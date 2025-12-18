'use client'

import * as React from "react"
import { TrendingUp } from "lucide-react"
import { Label, Pie, PieChart } from "recharts"

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

interface ContentPlatformChartProps {
  data: Array<{
    name: string
    value: number
    color: string
  }>
}

export function ContentPlatformChart({ data }: ContentPlatformChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Content Distribution</CardTitle>
          <CardDescription>By platform and type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
            No content data available
          </div>
        </CardContent>
      </Card>
    )
  }

  // Create chart config first - map each platform to a chart color
  const chartConfig: ChartConfig = {
    count: {
      label: "Count",
    },
  }

  // Convert data to chart format and add to config
  const chartData = data.map((item, index) => {
    const key = item.name.toLowerCase().replace(/\s+/g, '-')
    const chartColorIndex = (index % 5) + 1
    const chartColor = `hsl(var(--chart-${chartColorIndex}))`
    
    // Add to config
    chartConfig[key] = {
      label: item.name,
      color: chartColor,
    }
    
    return {
      platform: item.name,
      count: item.value,
      fill: `var(--color-${key})`,
    }
  })

  const totalContent = React.useMemo(() => {
    return data.reduce((acc, curr) => acc + curr.value, 0)
  }, [data])

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Content Distribution</CardTitle>
        <CardDescription>By platform and type</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0 flex items-center justify-center">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[280px] w-[280px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="platform"
              innerRadius={65}
              outerRadius={110}
              strokeWidth={5}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {totalContent.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          Total Content
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 leading-none font-medium">
          Content across {data.length} platform{data.length !== 1 ? 's' : ''}
        </div>
        <div className="text-muted-foreground leading-none">
          Showing distribution of all content types
        </div>
      </CardFooter>
    </Card>
  )
}
