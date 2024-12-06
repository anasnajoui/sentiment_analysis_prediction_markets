"use client";

import { useState, useEffect, useCallback } from "react";
import AddBetDialog from "../components/AddBetDialog";
import { toast } from "react-hot-toast";
import Image from "next/image";
import { PolymarketEvent } from "../types/polymarket";

interface Bet {
    id: string;
    title: string;
    image: string;
    currentPrice: number;
    liquidity: number;
    slug: string;
    markets: PolymarketEvent["markets"];
}

const REFRESH_INTERVALS = [
    { label: '5 seconds', value: 5000 },
    { label: '1 minute', value: 60000 },
] as const;

export default function Dashboard() {
    const [bets, setBets] = useState<Bet[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [refreshInterval, setRefreshInterval] = useState<number>(60000);

    const refreshBetData = async (bet: Bet): Promise<Bet> => {
        try {
            const response = await fetch(`https://gamma-api.polymarket.com/events?slug=${bet.slug}`);
            const data = await response.json() as PolymarketEvent[];
            
            if (data && data[0]) {
                const outcomePrices = JSON.parse(data[0].markets[0].outcomePrices);
                const yesPrice = parseFloat(outcomePrices[0]) * 100;
                const liquidity = parseFloat(data[0].liquidity);

                return {
                    ...bet,
                    currentPrice: yesPrice,
                    liquidity: liquidity,
                    markets: data[0].markets
                };
            }
            return bet;
        } catch (error) {
            if (error instanceof Error) {
                console.error(`Error refreshing bet ${bet.slug}:`, error.message);
            }
            return bet;
        }
    };

    const refreshAllBets = useCallback(async () => {
        if (bets.length === 0) return;
        
        setIsLoading(true);
        try {
            const updatedBets = await Promise.all(bets.map(refreshBetData));
            setBets(updatedBets);
            toast.success("Prices updated");
        } catch (error) {
            if (error instanceof Error) {
                console.error("Error refreshing bets:", error.message);
            }
            toast.error("Failed to update prices");
        } finally {
            setIsLoading(false);
        }
    }, [bets]);

    useEffect(() => {
        const intervalId = setInterval(refreshAllBets, refreshInterval);
        return () => clearInterval(intervalId);
    }, [refreshAllBets, refreshInterval]);

    const addBet = (betData: PolymarketEvent) => {
        try {
            const outcomePrices = JSON.parse(betData.markets[0].outcomePrices);
            const yesPrice = parseFloat(outcomePrices[0]) * 100;
            const liquidity = parseFloat(betData.liquidity);

            const newBet: Bet = {
                id: betData.id,
                title: betData.title,
                image: betData.image,
                currentPrice: yesPrice,
                liquidity: liquidity,
                slug: betData.slug,
                markets: betData.markets
            };

            setBets(prevBets => [...prevBets, newBet]);
            toast.success("Bet added successfully!");
        } catch (error) {
            console.error("Error processing bet data:", error);
            toast.error("Failed to process bet data");
        }
    };

    const formatLiquidity = (value: number): string => {
        if (value >= 1000000) {
            return `$${(value / 1000000).toFixed(2)}M`;
        } else if (value >= 1000) {
            return `$${(value / 1000).toFixed(2)}K`;
        }
        return `$${value.toFixed(2)}`;
    };

    return (
        <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#111111]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-[#171717] dark:text-white">
                        Prediction Markets
                    </h1>
                    <div className="flex items-center gap-3">
                        <select
                            value={refreshInterval}
                            onChange={(e) => setRefreshInterval(Number(e.target.value))}
                            className="rounded-md border border-[#EAEAEA] dark:border-[#333333] bg-transparent px-3 py-2 text-sm text-[#171717] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#171717] dark:focus:ring-white"
                        >
                            {REFRESH_INTERVALS.map((interval) => (
                                <option key={interval.value} value={interval.value}>
                                    Refresh every {interval.label}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={() => setDialogOpen(true)}
                            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-[#171717] text-white dark:bg-white dark:text-black gap-2 hover:bg-[#383838] dark:hover:bg-[#f5f5f5] text-sm h-10 px-4"
                        >
                            + Add Bet
                        </button>
                        <button
                            onClick={refreshAllBets}
                            disabled={isLoading || bets.length === 0}
                            className="rounded-full border border-solid border-[#EAEAEA] dark:border-[#333333] transition-colors flex items-center justify-center hover:bg-[#FAFAFA] dark:hover:bg-[#333333] text-sm h-10 px-4 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? "Updating..." : "Refresh"}
                        </button>
                    </div>
                </div>

                <div className="rounded-lg border border-[#EAEAEA] dark:border-[#333333] bg-white dark:bg-black overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-[#EAEAEA] dark:divide-[#333333]">
                            <thead className="bg-[#FAFAFA] dark:bg-[#111111]">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-[#666666] dark:text-[#888888] uppercase tracking-wider w-12"></th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-[#666666] dark:text-[#888888] uppercase tracking-wider">Title</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-[#666666] dark:text-[#888888] uppercase tracking-wider">Yes Price</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-[#666666] dark:text-[#888888] uppercase tracking-wider">Liquidity</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#EAEAEA] dark:divide-[#333333]">
                                {bets.map((bet) => (
                                    <tr key={bet.id} className="hover:bg-[#FAFAFA] dark:hover:bg-[#111111] transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="h-10 w-10 relative rounded-full overflow-hidden">
                                                <Image
                                                    src={bet.image}
                                                    alt={bet.title}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-[#171717] dark:text-white">{bet.title}</td>
                                        <td className="px-6 py-4 text-sm text-[#171717] dark:text-white">
                                            {bet.currentPrice.toFixed(1)}%
                                        </td>
                                        <td className="px-6 py-4 text-sm text-[#171717] dark:text-white">
                                            {formatLiquidity(bet.liquidity)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <AddBetDialog 
                    open={dialogOpen}
                    onOpenChange={setDialogOpen}
                    onBetAdd={addBet}
                />
            </div>
        </div>
    );
}