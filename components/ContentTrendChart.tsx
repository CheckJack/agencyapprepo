'use client'

import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

interface ContentTrendChartProps {
  data: Array<{
    month: string
    socialMedia: number
    blogPosts: number
  }>
}

export function ContentTrendChart({ data }: ContentTrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Content Trends</CardTitle>
          <CardDescription>Last 6 months overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
            No trend data available
          </div>
        </CardContent>
      </Card>
    )
  }

  const chartConfig = {
    socialMedia: {
      label: "Social Media",
      color: "hsl(var(--chart-1))",
    },
    blogPosts: {
      label: "Blog Posts",
      color: "hsl(var(--chart-2))",
    },
  } satisfies ChartConfig

  // Calculate trend
  const currentMonth = data[data.length - 1]
  const previousMonth = data[data.length - 2]
  const currentTotal = (currentMonth?.socialMedia || 0) + (currentMonth?.blogPosts || 0)
  const previousTotal = (previousMonth?.socialMedia || 0) + (previousMonth?.blogPosts || 0)
  const trend = previousTotal > 0 
    ? (((currentTotal - previousTotal) / previousTotal) * 100).toFixed(1)
    : '0'

  return (
    <Card>
      <CardHeader>
        <CardTitle>Content Trends</CardTitle>
        <CardDescription>Last 6 months overview</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={data}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dashed" />}
            />
            <Bar dataKey="socialMedia" fill="var(--color-socialMedia)" radius={4} />
            <Bar dataKey="blogPosts" fill="var(--color-blogPosts)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium">
          {Number(trend) > 0 ? (
            <>
              Trending up by {Math.abs(Number(trend))}% this month <TrendingUp className="h-4 w-4" />
            </>
          ) : Number(trend) < 0 ? (
            <>
              Trending down by {Math.abs(Number(trend))}% this month <TrendingUp className="h-4 w-4 rotate-180" />
            </>
          ) : (
            <>
              No change this month
            </>
          )}
        </div>
        <div className="text-muted-foreground leading-none">
          Showing total content created for the last 6 months
        </div>
      </CardFooter>
    </Card>
  )
}
