export interface PolymarketEvent {
    id: string;
    title: string;
    image: string;
    slug: string;
    liquidity: string;
    markets: {
        clobTokenIds: string;
        outcomePrices: string;
    }[];
}

export interface Bet {
    id: string;
    title: string;
    image: string;
    currentPrice: number;
    liquidity: number;
    slug: string;
    markets: PolymarketEvent["markets"];
    yes_token_id?: string;
    lastUpdated?: number;
}