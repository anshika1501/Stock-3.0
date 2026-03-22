"""
Generate/refresh pgvector embeddings for stocks using Gemini embeddings.

Usage:
    python manage.py build_stock_embeddings
    python manage.py build_stock_embeddings --limit 50 --force
"""

import logging
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from stocks.chatbot import GeminiClient
from stocks.models import Stock, StockEmbedding

logger = logging.getLogger(__name__)


def _stock_context(stock: Stock) -> str:
    return (
        f"{stock.symbol} {stock.name}. Sector: {stock.sector}. "
        f"Industry: {stock.industry}. "
        f"Current price: {stock.current_price}. "
        f"52w high/low: {stock.fifty_two_week_high}/{stock.fifty_two_week_low}. "
        f"PE: {stock.pe_ratio}. "
        f"Summary: {stock.description[:400]}"
    )


class Command(BaseCommand):
    help = "Create or refresh stock embeddings for the chatbot (uses GEMINI_API_KEY)."

    def add_arguments(self, parser):
        parser.add_argument('--limit', type=int, help='Limit number of stocks to embed')
        parser.add_argument('--force', action='store_true', help='Rebuild even if embedding exists')
        parser.add_argument(
            '--max-failures',
            type=int,
            default=10,
            help='Stop after N failures (0 disables the limit)',
        )

    def handle(self, *args, **options):
        api_key = None  # rely on env
        try:
            client = GeminiClient(api_key)
        except ValueError as exc:
            raise CommandError(str(exc))

        qs = Stock.objects.order_by('id')
        if options.get('limit'):
            qs = qs[: options['limit']]

        total = qs.count()
        if total == 0:
            raise CommandError("No stocks found. Populate stocks first.")

        self.stdout.write(f"Building embeddings for {total} stocks...")
        success = 0
        failures = 0
        for stock in qs:
            if not options['force'] and hasattr(stock, "vector") and stock.vector.embedding:
                continue
            try:
                context = _stock_context(stock)
                embedding = client.embed_text(context)
                if len(embedding) != 3072:
                    raise ValueError(f"Expected 3072-dim embedding, got {len(embedding)}")
                with transaction.atomic():
                    StockEmbedding.objects.update_or_create(
                        stock=stock,
                        defaults={
                            "context": context,
                            "embedding": embedding,
                        },
                    )
                success += 1
            except Exception as exc:
                failures += 1
                self.stderr.write(f"Failed embedding for {stock.symbol}: {exc}")
                logger.exception("Failed embedding for %s: %s", stock.symbol, exc)
                max_failures = options.get('max_failures') or 0
                if max_failures and failures >= max_failures:
                    raise CommandError(
                        f"Aborting after {failures} failures. Check GEMINI_EMBED_MODEL/GEMINI_API_KEY."
                    )
                continue

        self.stdout.write(self.style.SUCCESS(f"Embeddings built for {success} stocks (out of {total})."))
