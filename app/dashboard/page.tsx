"use client";

import { useState, useEffect, useCallback } from "react";
import AddBetDialog from "@/components/AddBetDialog";
import PriceAnalysis from "@/components/PriceAnalysis";
import { toast } from "react-hot-toast";
import Image from "next/image";
import { PolymarketEvent, Bet } from "@/types/polymarket";
import { supabase, getBets, addBet, removeBet } from "@/lib/supabase";

const REFRESH_INTERVALS = [
    { label: '5 seconds', value: 5000 },
    { label: '1 minute', value: 60000 },
] as const;

export default function Dashboard() {
    const [bets, setBets] = useState<Bet[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [refreshInterval, setRefreshInterval] = useState<number>(60000);

    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setDialogOpen(true);
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, []);

    useEffect(() => {
        console.log('Setting up dashboard subscription...');
        
        // Initial load
        getBets().then(bets => {
            console.log('Initial bets loaded:', bets);
            setBets(bets);
        });

        // Create a single channel for all bet changes
        const channel = supabase
            .channel('bets-realtime')
            .on(
                'postgres_changes',
                { 
                    event: 'INSERT',
                    schema: 'public',
                    table: 'bets' 
                },
                (payload) => {
                    console.log('New bet received:', payload.new);
                    // Immediately add new bet to state
                    setBets(currentBets => [...currentBets, payload.new as Bet]);
                }
            )
            .on(
                'postgres_changes',
                { 
                    event: 'DELETE',
                    schema: 'public',
                    table: 'bets' 
                },
                (payload) => {
                    console.log('Bet deleted:', payload.old);
                    // Immediately remove bet from state
                    setBets(currentBets => currentBets.filter(bet => bet.id !== payload.old.id));
                }
            );

        // Start subscription and log status
        channel.subscribe(status => {
            console.log('Subscription status:', status);
        });

        return () => {
            console.log('Cleaning up subscription');
            channel.unsubscribe();
        };
    }, []);

    const refreshBetData = async (bet: Bet): Promise<Bet> => {
        try {
            const response = await fetch(`https://gamma-api.polymarket.com/events?slug=${bet.slug}`);
            const data = await response.json() as PolymarketEvent[];
            
            if (data && data[0]) {
                const outcomePrices = JSON.parse(data[0].markets[0].outcomePrices);
                const yesPrice = parseFloat(outcomePrices[0]) * 100;
                const liquidity = parseFloat(data[0].liquidity);

                // Force PriceAnalysis to refresh when bet data updates
                const marketId = data[0].markets[0].clobTokenId;
                
                return {
                    ...bet,
                    currentPrice: yesPrice,
                    liquidity: liquidity,
                    markets: data[0].markets,
                    lastUpdated: Date.now() // Add timestamp to trigger PriceAnalysis refresh
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

    const handleAddBet = async (bet: Bet) => {
        try {
            // Optimistically add bet to UI first
            setBets(currentBets => [...currentBets, bet]);
            // Then add to Supabase
            await addBet(bet);
        } catch (error) {
            // If failed, remove from UI
            setBets(currentBets => currentBets.filter(b => b.id !== bet.id));
            throw error;
        }
    };

    const handleRemoveBet = async (betId: string) => {
        try {
            // Optimistically remove bet from UI first
            const betToRemove = bets.find(b => b.id === betId);
            setBets(currentBets => currentBets.filter(b => b.id !== betId));
            
            // Then remove from Supabase
            await removeBet(betId);
            toast.success('Bet removed');
        } catch (error) {
            // If failed, add the bet back to UI
            if (betToRemove) {
                setBets(currentBets => [...currentBets, betToRemove]);
            }
            console.error('Error removing bet:', error);
            toast.error('Failed to remove bet');
        }
    };

    // Separate data fetching from state updates
    const refreshAllBets = useCallback(async () => {
        if (isLoading) return; // Prevent concurrent refreshes
        
        setIsLoading(true);
        try {
            const updatedBets = await getBets();
            setBets(updatedBets);
        } catch (error) {
            console.error('Error refreshing bets:', error);
            toast.error('Failed to refresh bets');
        } finally {
            setIsLoading(false);
        }
    }, [isLoading]); // Only depend on isLoading

    // Separate interval effect from data subscription
    useEffect(() => {
        const interval = setInterval(refreshAllBets, refreshInterval);
        console.log(`Setting up refresh interval: ${refreshInterval}ms`);
        
        return () => {
            console.log('Clearing refresh interval');
            clearInterval(interval);
        };
    }, [refreshInterval, refreshAllBets]);

    const toggleRefreshInterval = () => {
        setRefreshInterval(current => current === 60000 ? 5000 : 60000);
    };

    return (
        <div className="min-h-screen bg-[#fafbff]">
            <div className="container mx-auto px-4 pt-16 pb-4">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-xl font-semibold text-[#171717]">Prediction Markets</h1>
                    <div className="flex gap-2 items-center">
                        <button
                            onClick={toggleRefreshInterval}
                            className={`
                                h-9 px-4 rounded-full border transition-all duration-300 flex items-center gap-2
                                ${refreshInterval === 5000 
                                    ? 'border-emerald-500/20 bg-emerald-50/50' 
                                    : 'border-amber-500/20 bg-amber-50/50'
                                }
                            `}
                        >
                            <div className="relative flex h-2 w-2">
                                {refreshInterval === 5000 ? (
                                    <>
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                    </>
                                ) : (
                                    <>
                                        <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                                    </>
                                )}
                            </div>
                            <span className={`text-sm font-medium transition-colors duration-300 ${
                                refreshInterval === 5000 
                                    ? 'text-emerald-700' 
                                    : 'text-amber-700'
                            }`}>
                                {refreshInterval === 5000 ? 'Real-time updates' : 'Update every minute'}
                            </span>
                        </button>
                        <button
                            onClick={() => setDialogOpen(true)}
                            className="h-9 px-4 text-sm inline-flex items-center justify-center rounded-full font-medium transition-all bg-blue-500 text-white hover:bg-blue-600"
                        >
                            + Add Bet (⌘K)
                        </button>
                    </div>
                </div>
                

                <div className="bg-white rounded-lg border border-[#EAEAEA]">
                    <div className="grid grid-cols-12 gap-4 px-4 py-2 border-b border-[#EAEAEA] text-xs text-[#666] font-medium">
                        <div className="col-span-3 text-left">NAME</div>
                        <div className="col-span-1 text-right">YES PRICE</div>
                        <div className="col-span-1 text-right">1H %</div>
                        <div className="col-span-1 text-right">24H %</div>
                        <div className="col-span-1 text-right">7D %</div>
                        <div className="col-span-2 text-right">LIQUIDITY</div>
                        <div className="col-span-2 text-right">LAST 24H</div>
                        <div className="col-span-1 text-right">REMOVE</div>
                    </div>
                    {bets.map((bet) => (
                        <div 
                            key={bet.id} 
                            className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-[#EAEAEA] last:border-b-0 items-center hover:bg-gray-50 transition-colors"
                        >
                            <div className="col-span-3 flex items-center gap-3">
                                <Image 
                                    src={bet.image} 
                                    alt={bet.title} 
                                    width={24} 
                                    height={24} 
                                    className="object-cover" 
                                />
                                <span className="text-sm font-medium text-[#171717]">{bet.title}</span>
                            </div>
                            <div className="col-span-1 text-right">
                                <span className="text-sm font-medium text-[#171717]">
                                    {bet.currentPrice ? `${bet.currentPrice.toFixed(1)}%` : 'N/A'}
                                </span>
                            </div>
                            <div className="col-span-3 grid grid-cols-3">
                                <PriceAnalysis 
                                    marketId={bet.yes_token_id || ''} 
                                    compact={true}
                                    renderChart={false}
                                    refreshInterval={refreshInterval}
                                />
                            </div>
                            <div className="col-span-2 text-right text-sm text-[#171717]">
                                ${Number(bet.liquidity).toLocaleString()}
                            </div>
                            <div className="col-span-2 text-right">
                                {bet.markets?.[0]?.clobTokenIds && (
                                    <PriceAnalysis 
                                    marketId={JSON.parse(bet.markets[0].clobTokenIds)[0]} 
                                    compact={true}
                                    renderChart={true}
                                    chartOnly
                                    refreshInterval={refreshInterval}
                                    key={`${bet.markets[0].clobTokenId}-${bet.lastUpdated}`}
                                  />
                                )}
                            </div>
                            <div className="col-span-1 text-right">
                                <button
                                    onClick={() => handleRemoveBet(bet.id)}
                                    className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-red-500 transition-colors"
                                    title="Remove bet"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>            


                <AddBetDialog 
                    open={dialogOpen}
                    onOpenChange={setDialogOpen}
                    onBetAdd={handleAddBet}
                />
            </div>
        </div>
    );
}