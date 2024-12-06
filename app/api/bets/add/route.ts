import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // Handle the POST request logic here
    return NextResponse.json({ message: 'Bet added successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add bet' }, { status: 500 });
  }
}
