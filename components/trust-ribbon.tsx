"use client"

import { Shield, DollarSign, Clock, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

const metrics = [
  {
    label: "PII Compliance",
    value: "99.9%",
    status: "success" as const,
    icon: Shield,
  },
  {
    label: "Brand Policy",
    value: "100%",
    status: "success" as const,
    icon: Shield,
  },
  {
    label: "Cost SLO",
    value: "$12.4/$15",
    status: "success" as const,
    icon: DollarSign,
  },
  {
    label: "P95 Latency",
    value: "3.2s",
    status: "success" as const,
    icon: Clock,
  },
  {
    label: "Safety Incidents",
    value: "0",
    status: "success" as const,
    icon: AlertTriangle,
  },
]

export function TrustRibbon() {
  return (
    <div className="border-b border-border bg-card">
      <div className="flex items-center justify-between px-6 py-2">
        {metrics.map((metric) => {
          const Icon = metric.icon
          return (
            <div key={metric.label} className="flex items-center gap-2">
              <Icon
                className={cn(
                  "w-4 h-4",
                  metric.status === "success" && "text-success",
                  metric.status === "warning" && "text-warning",
                  metric.status === "error" && "text-destructive",
                )}
              />
              <span className="text-xs text-muted-foreground">{metric.label}</span>
              <span
                className={cn(
                  "text-sm font-semibold",
                  metric.status === "success" && "text-success",
                  metric.status === "warning" && "text-warning",
                  metric.status === "error" && "text-destructive",
                )}
              >
                {metric.value}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
