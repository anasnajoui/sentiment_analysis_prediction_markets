interface StoredBet {
    id: string;
    title: string;
    image: string;
    currentPrice: number;
    markets: Array<{
      clobTokenIds: string;
    }>;
    liquidity: string;
    lastUpdated: number;
  }
  
  interface UserBets {
    bets: StoredBet[];
  }