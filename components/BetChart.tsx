"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
);

interface PricePoint {
  time: string;
  price: number;
}

interface BetChartProps {
  data: PricePoint[];
}

export default function BetChart({ data }: BetChartProps) {
  const chartData = {
    labels: data.map(point => point.time),
    datasets: [
      {
        data: data.map(point => point.price),
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1.5,
        fill: false,
        tension: 0.4,
        pointRadius: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false,
      },
    },
    scales: {
      x: {
        display: false,
      },
      y: {
        display: false,
      },
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
  };

  return (
    <div style={{ height: '50px', width: '100%' }}>
      <Line data={chartData} options={options} />
    </div>
  );
}