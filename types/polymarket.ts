export interface PolymarketEvent {
    markets: {
        clobTokenIds: string;
        outcomePrices: string;
    }[];
    liquidity: string;
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
}