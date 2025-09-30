"use client"

import { AppLayout } from "./app-layout"
import { KPIDashboard } from "./kpi-dashboard"
import { ApprovalQueue } from "./approval-queue"
import { AlertPanel } from "./alert-panel"

export function MissionControl() {
  return (
    <AppLayout title="Mission Control" description="Lead-to-Deploy Orchestrator Overview">
      <KPIDashboard />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ApprovalQueue />
        </div>
        <div>
          <AlertPanel />
        </div>
      </div>
    </AppLayout>
  )
}
