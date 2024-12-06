import { NextResponse } from 'next/server';
import { getBets } from '@/lib/supabase';  // Updated import

export async function GET() {
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();

  const bets = await getBets();
  writer.write(encoder.encode(`data: ${JSON.stringify(bets)}\n\n`));

  const interval = setInterval(async () => {
    const updatedBets = await getBets();
    writer.write(encoder.encode(`data: ${JSON.stringify(updatedBets)}\n\n`));
  }, 5000);

  return new NextResponse(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}