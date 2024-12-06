import { createClient } from '@supabase/supabase-js'
import { Bet } from '@/types/polymarket'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Enable realtime for the bets table
supabase.channel('public:bets')
  .on('postgres_changes', { 
    event: '*', 
    schema: 'public', 
    table: 'bets' 
  }, payload => {
    console.log('Realtime event received:', payload)
  })
  .subscribe(status => {
    console.log('Realtime subscription status:', status)
  });

export async function getBets(): Promise<Bet[]> {
  try {
    console.log('Fetching bets from Supabase...');
    const { data, error } = await supabase
      .from('bets')
      .select('*, current_price, yes_token_id')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data?.map(bet => ({
      ...bet,
      currentPrice: bet.current_price,
      yes_token_id: bet.yes_token_id
    })) || [];
  } catch (error) {
    console.error('Error fetching bets:', error);
    throw error;
  }
}

export async function addBet(bet: Bet): Promise<void> {
  try {
    // Safely parse the clobTokenIds array and get the first (YES) token
    const yesTokenId = bet.markets?.[0]?.clobTokenIds ? 
      JSON.parse(bet.markets[0].clobTokenIds)[0] : null;

    if (!yesTokenId) {
      throw new Error('No YES token ID found in market data');
    }

    const { error } = await supabase
      .from('bets')
      .upsert([{
        id: bet.id,
        title: bet.title,
        image: bet.image,
        current_price: bet.currentPrice,
        liquidity: bet.liquidity,
        markets: bet.markets,
        slug: bet.slug || null,
        yes_token_id: yesTokenId,
        created_at: new Date().toISOString()
      }]);
    
    if (error) throw error;
  } catch (error) {
    console.error('Error adding bet:', error);
    throw error;
  }
}

export async function removeBet(betId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('bets')
      .delete()
      .eq('id', betId)
    
    if (error) {
      console.error('Supabase error:', error)
      throw error
    }
  } catch (error) {
    console.error('Detailed error:', error)
    throw error
  }
}