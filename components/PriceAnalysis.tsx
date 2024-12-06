"use client";

import { useState, useEffect } from 'react';
import BetChart from './BetChart';

interface PricePoint {
  t: number;
  p: string;
}

export interface PriceChanges {
  oneHour: number;
  oneDay: number;
  sevenDays: number;
}

interface PriceAnalysisProps {
  marketId: string;
  compact?: boolean;
  renderChart?: boolean;
  chartOnly?: boolean;
  refreshInterval?: number;
}

const formatChange = (change: number): string => {
  return `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
};

export default function PriceAnalysis({ 
  marketId, 
  compact = false, 
  renderChart = true,
  chartOnly = false,
  refreshInterval = 60000,
}: PriceAnalysisProps) {
  const [priceChanges, setPriceChanges] = useState({ oneHour: 0, oneDay: 0, sevenDays: 0 });
  const [chartData, setChartData] = useState<PricePoint[]>([]);

  useEffect(() => {
    if (!marketId) return;
  
    let isSubscribed = true;
  
    const fetchPriceData = async () => {
      try {
        const now = Math.floor(Date.now() / 1000);
        
        const [hourlyData, dailyData, weeklyData] = await Promise.all([
          fetch(`https://clob.polymarket.com/prices-history?market=${marketId}&interval=1h&fidelity=1`).then(r => r.json()),
          fetch(`https://clob.polymarket.com/prices-history?market=${marketId}&interval=1d&fidelity=1`).then(r => r.json()),
          fetch(`https://clob.polymarket.com/prices-history?market=${marketId}&interval=1w&fidelity=5`).then(r => r.json())
        ]);

        if (isSubscribed && hourlyData.history?.length > 0) {
          const sortedHourly = [...hourlyData.history].sort((a, b) => b.t - a.t); // Sort descending
          const currentPrice = parseFloat(sortedHourly[0].p) * 100;
          const oneHourAgo = now - 3600;

          // Find closest price point to 1 hour ago
          const hourlyPrice = sortedHourly.reduce((closest, point) => {
            if (!closest) return point;
            
            const closestDiff = Math.abs(closest.t - oneHourAgo);
            const pointDiff = Math.abs(point.t - oneHourAgo);
            
            return pointDiff < closestDiff ? point : closest;
          }, null);

          // Debug logs
          console.log('Hourly price analysis:', {
            currentTime: new Date(now * 1000).toLocaleString(),
            oneHourAgo: new Date(oneHourAgo * 1000).toLocaleString(),
            availablePoints: sortedHourly.map(p => ({
              time: new Date(p.t * 1000).toLocaleString(),
              price: parseFloat(p.p) * 100
            })),
            selectedPoint: hourlyPrice && {
              time: new Date(hourlyPrice.t * 1000).toLocaleString(),
              price: parseFloat(hourlyPrice.p) * 100,
              timeDiff: Math.abs(hourlyPrice.t - oneHourAgo) / 60 + ' minutes'
            }
          });

          const changes = {
            oneHour: hourlyPrice ? 
              ((currentPrice - parseFloat(hourlyPrice.p) * 100) / (parseFloat(hourlyPrice.p) * 100)) * 100 : 
              ((currentPrice - parseFloat(sortedHourly[sortedHourly.length - 1].p) * 100) / 
               (parseFloat(sortedHourly[sortedHourly.length - 1].p) * 100)) * 100, // fallback to oldest hourly price
            
            oneDay: dailyData.history?.length >= 2 ? 
              ((currentPrice - parseFloat(dailyData.history[0].p) * 100) / (parseFloat(dailyData.history[0].p) * 100)) * 100 : 
              0,
            
            sevenDays: weeklyData.history?.length >= 2 ? 
              ((currentPrice - parseFloat(weeklyData.history[0].p) * 100) / (parseFloat(weeklyData.history[0].p) * 100)) * 100 : 
              0
          };

          setPriceChanges(changes);
          setChartData(dailyData.history.map((point: { t: number; p: string }) => ({
            time: new Date(point.t * 1000).toISOString(),
            price: parseFloat(point.p) * 100
          })));
        }

      } catch (error) {
        console.error('Error fetching price data:', error);
      }
    };
  
    fetchPriceData();
    
    const interval = setInterval(fetchPriceData, refreshInterval);
  
    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [marketId, refreshInterval]);

  return (
    <>
      {!chartOnly && (
        <div className="col-span-3 grid grid-cols-3 gap-4">
          <div className="text-right">
            <span className={`text-sm ${getColorClass(priceChanges.oneHour)}`}>
              {priceChanges.oneHour ? `${priceChanges.oneHour.toFixed(2)}%` : '-'}
            </span>
          </div>
          <div className="text-right">
            <span className={`text-sm ${getColorClass(priceChanges.oneDay)}`}>
              {priceChanges.oneDay ? `${priceChanges.oneDay.toFixed(2)}%` : '-'}
            </span>
          </div>
          <div className="text-right">
            <span className={`text-sm ${getColorClass(priceChanges.sevenDays)}`}>
              {priceChanges.sevenDays ? `${priceChanges.sevenDays.toFixed(2)}%` : '-'}
            </span>
          </div>
        </div>
      )}
      {renderChart && (
        <div className="col-span-2">
          <BetChart data={chartData} />
        </div>
      )}
    </>
  );
}

const getColorClass = (value: number): string => {
  if (value > 0) return 'text-emerald-500';
  if (value < 0) return 'text-red-500';
  return 'text-gray-500';
};