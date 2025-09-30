"use client"

import { Card } from "./ui/card"
import { TrendingUp, TrendingDown, Users, Mail, Calendar, Rocket } from "lucide-react"

const kpis = [
  {
    label: "Reply Rate",
    value: "12.4%",
    change: "+2.3%",
    trend: "up" as const,
    icon: Mail,
  },
  {
    label: "Meeting Hold Rate",
    value: "68%",
    change: "+5.1%",
    trend: "up" as const,
    icon: Calendar,
  },
  {
    label: "Active Cases",
    value: "47",
    change: "+12",
    trend: "up" as const,
    icon: Users,
  },
  {
    label: "Deploy Success",
    value: "94.2%",
    change: "-1.2%",
    trend: "down" as const,
    icon: Rocket,
  },
]

export function KPIDashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon
        const TrendIcon = kpi.trend === "up" ? TrendingUp : TrendingDown

        return (
          <Card key={kpi.label} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div
                className={`flex items-center gap-1 text-sm ${
                  kpi.trend === "up" ? "text-success" : "text-destructive"
                }`}
              >
                <TrendIcon className="w-4 h-4" />
                <span>{kpi.change}</span>
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold">{kpi.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{kpi.label}</p>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
