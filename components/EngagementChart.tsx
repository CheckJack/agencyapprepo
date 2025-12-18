'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

interface EngagementChartProps {
  likes: number
  shares: number
  comments: number
}

export function EngagementChart({ likes, shares, comments }: EngagementChartProps) {
  const data = [
    { name: 'Likes', value: likes, color: '#EF4444' },
    { name: 'Shares', value: shares, color: '#3B82F6' },
    { name: 'Comments', value: comments, color: '#10B981' },
  ].filter(item => item.value > 0)

  const total = likes + shares + comments

  if (total === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Engagement Breakdown</h2>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500 dark:text-slate-400">No engagement data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Engagement Breakdown</h2>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

