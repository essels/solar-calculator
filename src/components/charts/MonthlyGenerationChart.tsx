'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface MonthlyGenerationData {
  month: string;
  generation: number;
}

interface MonthlyGenerationChartProps {
  data: MonthlyGenerationData[];
}

export function MonthlyGenerationChart({ data }: MonthlyGenerationChartProps) {
  return (
    <div className="h-64 w-full" role="img" aria-label="Monthly solar generation bar chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: 'var(--foreground)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--border)' }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'var(--foreground)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--border)' }}
            tickFormatter={(value) => `${value}`}
          />
          <Tooltip
            formatter={(value) => [`${Number(value).toFixed(0)} kWh`, 'Generation']}
            labelFormatter={(label) => String(label)}
            contentStyle={{
              backgroundColor: 'var(--background)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />
          <Bar dataKey="generation" fill="var(--primary)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
