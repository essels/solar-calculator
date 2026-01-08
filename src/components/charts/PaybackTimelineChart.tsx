'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';

interface PaybackData {
  year: number;
  cumulativeSavings: number;
}

interface PaybackTimelineChartProps {
  data: PaybackData[];
  systemCost: number;
  paybackYear: number;
}

export function PaybackTimelineChart({ data, systemCost, paybackYear }: PaybackTimelineChartProps) {
  return (
    <div className="h-64 w-full" role="img" aria-label="Payback timeline chart">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="year"
            tick={{ fontSize: 11, fill: 'var(--foreground)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--border)' }}
            label={{ value: 'Year', position: 'insideBottomRight', offset: -5, fontSize: 11 }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'var(--foreground)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--border)' }}
            tickFormatter={(value) => `£${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip
            formatter={(value) => [`£${Number(value).toLocaleString()}`, 'Cumulative Savings']}
            labelFormatter={(label) => `Year ${label}`}
            contentStyle={{
              backgroundColor: 'var(--background)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />
          <ReferenceLine
            y={systemCost}
            stroke="var(--error)"
            strokeDasharray="5 5"
            label={{
              value: `Cost: £${systemCost.toLocaleString()}`,
              position: 'right',
              fontSize: 10,
              fill: 'var(--error)',
            }}
          />
          <ReferenceLine
            x={paybackYear}
            stroke="var(--success)"
            strokeDasharray="3 3"
            label={{
              value: `Payback: Year ${paybackYear.toFixed(1)}`,
              position: 'top',
              fontSize: 10,
              fill: 'var(--success)',
            }}
          />
          <Area
            type="monotone"
            dataKey="cumulativeSavings"
            stroke="var(--primary)"
            fillOpacity={1}
            fill="url(#colorSavings)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
