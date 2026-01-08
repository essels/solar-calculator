'use client';

import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';

interface SavingsData {
  name: string;
  value: number;
  [key: string]: string | number;
}

interface SavingsBreakdownChartProps {
  selfConsumedSavings: number;
  exportEarnings: number;
}

const COLORS = ['var(--primary)', 'var(--success)'];

export function SavingsBreakdownChart({
  selfConsumedSavings,
  exportEarnings,
}: SavingsBreakdownChartProps) {
  const data: SavingsData[] = [
    { name: 'Self-Consumption', value: selfConsumedSavings },
    { name: 'Export Earnings', value: exportEarnings },
  ];

  const total = selfConsumedSavings + exportEarnings;

  return (
    <div className="h-64 w-full" role="img" aria-label="Savings breakdown pie chart">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
            label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
            labelLine={false}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => [`£${Number(value).toFixed(0)}`, '']}
            contentStyle={{
              backgroundColor: 'var(--background)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value, entry) => {
              const dataItem = data.find((d) => d.name === value);
              const percentage = dataItem ? ((dataItem.value / total) * 100).toFixed(0) : '0';
              return (
                <span style={{ color: entry.color, fontSize: '12px' }}>
                  {value} ({percentage}%)
                </span>
              );
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
