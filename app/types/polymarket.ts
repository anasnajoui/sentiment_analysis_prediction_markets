export interface PolymarketEvent {
    id: string;
    ticker: string;
    slug: string;
    title: string;
    description: string;
    image: string;
    liquidity: number;
    markets: PolymarketMarket[];
}

export interface PolymarketMarket {
    id: string;
    question: string;
    outcomePrices: string;
    liquidity: string;
}