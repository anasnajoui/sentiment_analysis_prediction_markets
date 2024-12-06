"use client";

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
} from 'chart.js';

const Line = dynamic(
  () => import('react-chartjs-2').then(mod => mod.Line),
  { ssr: false }
);

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

interface PriceData {
  t: number;
  p: string;
}

interface PriceAnalysisProps {
  marketId: string;
}

export default function PriceAnalysis({ marketId }: PriceAnalysisProps) {
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [changes, setChanges] = useState({
    hour: 0,
    day: 0,
    week: 0
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchPriceHistory = async () => {
    if (!marketId) return;
    
    try {
      console.log('Fetching price history for market:', marketId);
      const response = await fetch(
        `https://clob.polymarket.com/prices-history?market=${marketId}&interval=1h&fidelity=1`
      );
      const data = await response.json();
      console.log('Received price data:', data);
      
      if (data?.history && Array.isArray(data.history)) {
        setPriceData(data.history);
        calculateChanges(data.history);
      }
    } catch (error) {
      console.error('Error fetching price history:', error);
    }
  };

  const calculateChanges = (history: PriceData[]) => {
    if (!history || history.length === 0) return;
    
    const current = parseFloat(history[history.length - 1]?.p ?? '0');
    const hourAgo = parseFloat(history[Math.max(history.length - 1, 0)]?.p ?? current.toString());
    const dayAgo = parseFloat(history[Math.max(history.length - 24, 0)]?.p ?? current.toString());
    const weekAgo = parseFloat(history[0]?.p ?? current.toString());

    setChanges({
      hour: hourAgo ? ((current - hourAgo) / hourAgo) * 100 : 0,
      day: dayAgo ? ((current - dayAgo) / dayAgo) * 100 : 0,
      week: weekAgo ? ((current - weekAgo) / weekAgo) * 100 : 0
    });
  };

  const chartData = {
    labels: priceData?.map(d => {
      const date = new Date(d.t * 1000);
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    }) ?? [],
    datasets: [{
      label: 'Price',
      data: priceData?.map(d => parseFloat(d.p) * 100) ?? [], // Convert to percentage
      borderColor: '#00ff9d',
      backgroundColor: 'rgba(0, 255, 157, 0.1)',
      tension: 0.4,
      fill: true
    }]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context: any) => `${context.parsed.y.toFixed(2)}%`
        }
      }
    },
    scales: {
      y: { 
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        ticks: { 
          color: '#666666',
          callback: (value: number) => `${value.toFixed(1)}%`
        }
      },
      x: { display: false }
    },
    maintainAspectRatio: false
  };

  useEffect(() => {
    if (mounted && marketId) {
      fetchPriceHistory();
      const interval = setInterval(fetchPriceHistory, 60000);
      return () => clearInterval(interval);
    }
  }, [mounted, marketId]);

  if (!mounted) {
    return (
      <div className="bg-[#111111] p-4 rounded-lg border border-[#333333] h-[280px] flex items-center justify-center">
        <div className="text-[#888888]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-[#111111] p-4 rounded-lg border border-[#333333]">
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="text-sm text-[#888888]">1h Change</div>
          <div className={`text-lg ${changes.hour >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {changes.hour.toFixed(2)}%
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-[#888888]">24h Change</div>
          <div className={`text-lg ${changes.day >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {changes.day.toFixed(2)}%
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-[#888888]">7d Change</div>
          <div className={`text-lg ${changes.week >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {changes.week.toFixed(2)}%
          </div>
        </div>
      </div>
      <div className="h-48">
        {priceData.length > 0 && <Line data={chartData} options={chartOptions} />}
      </div>
    </div>
  );
}