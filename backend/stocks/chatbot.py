import logging
import os
from typing import List, Dict, Any

import requests
from django.db.models import F
from pgvector.django import CosineDistance

from .models import StockEmbedding, Stock

logger = logging.getLogger(__name__)

GEMINI_EMBED_MODEL = "models/text-embedding-004"
GEMINI_CHAT_MODEL = "models/gemini-1.5-flash"


class GeminiClient:
    def __init__(self, api_key: str | None = None):
        self.api_key = api_key or os.environ.get("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY is missing.")

    def _post(self, url: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        resp = requests.post(url, json=payload, timeout=40)
        resp.raise_for_status()
        return resp.json()

    def embed_text(self, text: str) -> List[float]:
        url = f"https://generativelanguage.googleapis.com/v1beta/{GEMINI_EMBED_MODEL}:embedContent?key={self.api_key}"
        payload = {
            "model": GEMINI_EMBED_MODEL,
            "content": {"parts": [{"text": text}]},
        }
        data = self._post(url, payload)
        embedding = data.get("embedding", {}).get("values")
        if not embedding:
            raise ValueError("Gemini embedding response was empty.")
        return embedding

    def generate(self, prompt: str, context: str, question: str) -> str:
        url = f"https://generativelanguage.googleapis.com/v1beta/{GEMINI_CHAT_MODEL}:generateContent?key={self.api_key}"
        user_message = f"{prompt}\n\nContext:\n{context}\n\nUser question:\n{question}\n\nRespond clearly and concisely."
        payload = {
            "model": GEMINI_CHAT_MODEL,
            "contents": [
                {"role": "user", "parts": [{"text": user_message}]},
            ],
        }
        data = self._post(url, payload)
        candidates = data.get("candidates", [])
        if not candidates:
            raise ValueError("Gemini returned no candidates.")
        parts = candidates[0].get("content", {}).get("parts", [])
        if not parts:
            raise ValueError("Gemini response had no parts.")
        return parts[0].get("text", "").strip()


def _compute_risk(stock: Stock) -> str:
    """Lightweight risk heuristic based on 52w range and PE."""
    try:
        range_ratio = float(stock.fifty_two_week_high - stock.fifty_two_week_low) / max(float(stock.current_price or 1), 1)
    except Exception:
        range_ratio = 0.0
    pe = float(stock.pe_ratio or 0)
    if range_ratio > 0.8 or pe > 35:
        return "High"
    if range_ratio > 0.4 or pe > 22:
        return "Medium"
    return "Low"


class ChatAdvisorService:
    """
    Provides a RAG-style chatbot that uses pgvector for similarity search
    and Gemini for generation.
    """

    def __init__(self, api_key: str | None = None):
        self.gemini = GeminiClient(api_key)

    def _nearest_stocks(self, query_embedding: List[float], top_k: int = 5):
        return (
            StockEmbedding.objects.exclude(embedding=None)
            .annotate(distance=CosineDistance("embedding", query_embedding))
            .order_by("distance")[:top_k]
        )

    def _build_context(self, embeddings) -> str:
        lines = []
        for emb in embeddings:
            stock = emb.stock
            risk = _compute_risk(stock)
            lines.append(
                f"{stock.symbol} ({stock.name}) | sector={stock.sector} | price={stock.current_price} | "
                f"52w range={stock.fifty_two_week_low}-{stock.fifty_two_week_high} | "
                f"PE={stock.pe_ratio} | risk={risk} | notes={emb.context[:400]}"
            )
        return "\n".join(lines)

    def answer(self, question: str) -> Dict[str, Any]:
        if not question or not question.strip():
            raise ValueError("Query cannot be empty.")

        query_vec = self.gemini.embed_text(question.strip())
        matches = list(self._nearest_stocks(query_vec, top_k=6))
        if not matches:
            raise ValueError("No embeddings available. Run build_stock_embeddings first.")

        context = self._build_context(matches)
        prompt = (
            "You are StockCompass AI. Using the provided stock context, answer the user with:\n"
            "1) Risk level (Low/Medium/High) per relevant stock with a short reason.\n"
            "2) Suggestions: diversification or sector angles tied to the context.\n"
            "3) Short-term prediction (1-4 weeks) in plain language with confidence.\n"
            "4) Compare the top 2-3 closest stocks (strengths/weaknesses).\n"
            "5) Recommendation (Buy/Hold/Sell) with a one-line rationale.\n"
            "Keep it concise (<= 180 words) and include a brief disclaimer."
        )

        answer_text = self.gemini.generate(prompt, context, question)
        sources = [
            {
                "symbol": emb.stock.symbol,
                "name": emb.stock.name,
                "sector": emb.stock.sector,
                "distance": float(emb.distance),
            }
            for emb in matches
        ]
        return {"answer": answer_text, "sources": sources}
