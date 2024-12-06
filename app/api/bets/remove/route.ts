import { NextRequest, NextResponse } from 'next/server';
import { removeBet } from '@/lib/supabase';

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const betId = searchParams.get('id');

    if (!betId) {
      return NextResponse.json({ error: 'Bet ID is required' }, { status: 400 });
    }

    await removeBet(betId);
    return NextResponse.json({ message: 'Bet removed successfully' });
  } catch (error) {
    console.error('Error removing bet:', error);
    return NextResponse.json({ error: 'Failed to remove bet' }, { status: 500 });
  }
}
