"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function ChatFab() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          size="lg"
          className="rounded-full shadow-lg bg-primary text-primary-foreground hover:scale-105 transition-transform"
          onClick={() => setOpen(true)}
        >
          <MessageCircle className="h-5 w-5 mr-2" />
          Chat
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-4 pb-2">
            <DialogTitle>StockCompass Chat</DialogTitle>
          </DialogHeader>
          <div className="h-[70vh]">
            <iframe
              src="/chatbot"
              className="w-full h-full border-0"
              title="Chatbot"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
