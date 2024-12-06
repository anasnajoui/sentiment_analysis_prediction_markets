"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/dialog";
import { Input } from "@/components/input";
import { toast } from "react-hot-toast";
import { PolymarketEvent, Bet } from "@/types/polymarket";

interface AddBetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBetAdd: (betData: Bet) => Promise<void>;
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
        const event = data[0];
        const outcomePrices = JSON.parse(event.markets[0].outcomePrices);
        const yesPrice = parseFloat(outcomePrices[0]) * 100;
        
        const bet: Bet = {
          id: event.id,
          title: event.title,
          image: event.image,
          currentPrice: yesPrice,
          liquidity: parseFloat(event.liquidity),
          slug: event.slug,
          markets: [{
            ...event.markets[0],
            clobTokenIds: event.markets[0].clobTokenIds
          }]
        };

        onOpenChange(false);
        setBetLink("");
        
        onBetAdd(bet).catch(error => {
          console.error('Error adding bet:', error);
          toast.error("Failed to add bet");
        });
        
        toast.success("Adding bet...");
      } else {
        toast.error("Could not fetch bet data");
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error("Error adding bet");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-white border border-[#EAEAEA] rounded-lg shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-[#171717] text-lg font-semibold">
            Add New Bet
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Input
            placeholder="Paste Polymarket bet URL..."
            value={betLink}
            onChange={(e) => setBetLink(e.target.value)}
            className="rounded-full border border-[#EAEAEA] bg-white text-[#171717] h-9 px-4 text-sm focus:border-[#999] focus:ring-0 transition-all"
          />
          <div className="flex justify-end gap-2">
            <button 
              onClick={() => onOpenChange(false)}
              className="h-9 px-4 text-sm inline-flex items-center justify-center rounded-full font-medium transition-all border border-[#EAEAEA] bg-white text-[#171717] hover:border-[#999]"
            >
              Cancel
            </button>
            <button 
              onClick={handleSubmit} 
              disabled={loading}
              className="h-9 px-4 text-sm inline-flex items-center justify-center rounded-full font-medium transition-all bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Adding..." : "Add Bet"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}