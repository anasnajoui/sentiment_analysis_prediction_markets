"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/dialog";
import { Input } from "@/app/components/input";
import { toast } from "react-hot-toast";
import { PolymarketEvent } from "@/app/types/polymarket";

interface AddBetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBetAdd: (betData: PolymarketEvent) => void;
}

export default function AddBetDialog({ open, onOpenChange, onBetAdd }: AddBetDialogProps) {
  const [betLink, setBetLink] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const slugMatch = betLink.match(/event\/([^/?]+)/);
      if (!slugMatch) {
        toast.error("Invalid Polymarket URL format");
        return;
      }

      const slug = slugMatch[1];
      const response = await fetch(`https://gamma-api.polymarket.com/events?slug=${slug}`);
      const data = await response.json() as PolymarketEvent[];

      if (data && data[0]) {
        onBetAdd(data[0]);
        onOpenChange(false);
        setBetLink("");
        toast.success("Bet added successfully!");
      } else {
        toast.error("Could not fetch bet data");
      }
    } catch (error) {
      toast.error("Error adding bet");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-white dark:bg-black border border-[#EAEAEA] dark:border-[#333333]">
        <DialogHeader>
          <DialogTitle className="text-[#171717] dark:text-white font-[family-name:var(--font-geist-sans)]">
            Add New Bet
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Input
            placeholder="Paste Polymarket bet URL..."
            value={betLink}
            onChange={(e) => setBetLink(e.target.value)}
            className="rounded-md border border-[#EAEAEA] dark:border-[#333333] bg-transparent"
          />
          <button 
            onClick={handleSubmit} 
            disabled={loading}
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-[#171717] text-white dark:bg-white dark:text-black gap-2 hover:bg-[#383838] dark:hover:bg-[#f5f5f5] text-sm h-10 px-4 disabled:opacity-50 disabled:cursor-not-allowed font-[family-name:var(--font-geist-sans)]"
          >
            {loading ? "Adding..." : "Add Bet"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}