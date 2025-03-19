"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface SalesChartProps {
  salesByDay: Array<{
    date: string;
    count: number;
    total: number;
  }>;
}

export default function SalesChart({ salesByDay }: SalesChartProps) {
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    if (salesByDay && salesByDay.length > 0) {
      // Sort sales by date in ascending order
      const sortedSales = [...salesByDay].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      // Format the data for the chart
      const formattedData = sortedSales.map((day) => ({
        name: new Date(day.date).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
        total: Number(day.total),
        count: day.count,
        fullDate: day.date,
      }));

      setChartData(formattedData);
    } else {
      setChartData([]);
    }
  }, [salesByDay]);

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ventas Diarias</CardTitle>
          <CardDescription>
            No hay datos de ventas diarias disponibles.
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">
            No hay datos para mostrar en este período.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ventas Diarias</CardTitle>
        <CardDescription>
          Ingresos diarios por ventas de tickets
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis
                dataKey="name"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                              Fecha
                            </span>
                            <span className="font-bold text-muted-foreground">
                              {new Date(
                                payload[0].payload.fullDate
                              ).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                              Total
                            </span>
                            <span className="font-bold text-muted-foreground">
                              ${payload[0].value}
                            </span>
                          </div>
                          <div className="flex flex-col col-span-2">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                              Tickets vendidos
                            </span>
                            <span className="font-bold text-muted-foreground">
                              {payload[0].payload.count}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return null;
                }}
              />
              <Bar
                dataKey="total"
                fill="currentColor"
                radius={[4, 4, 0, 0]}
                className="fill-primary"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
