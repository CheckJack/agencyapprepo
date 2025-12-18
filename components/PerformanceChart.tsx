'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface PerformanceChartProps {
  data: Array<{
    month: string
    blogs: number
    social: number
    views: number
  }>
}

export function PerformanceChart({ data }: PerformanceChartProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Content Performance Trends</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="month" 
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'white', 
              border: '1px solid #e5e7eb',
              borderRadius: '8px'
            }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="blogs" 
            stroke="#3B82F6" 
            strokeWidth={2}
            name="Blog Posts"
            dot={{ r: 4 }}
          />
          <Line 
            type="monotone" 
            dataKey="social" 
            stroke="#EC4899" 
            strokeWidth={2}
            name="Social Posts"
            dot={{ r: 4 }}
          />
          <Line 
            type="monotone" 
            dataKey="views" 
            stroke="#10B981" 
            strokeWidth={2}
            name="Blog Views"
            dot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

