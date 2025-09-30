"use client"

import type React from "react"

import { AppSidebar } from "./app-sidebar"
import { TopNav } from "./top-nav"
import { TrustRibbon } from "./trust-ribbon"

interface AppLayoutProps {
  children: React.ReactNode
  title?: string
  description?: string
  showTrustRibbon?: boolean
}

export function AppLayout({ children, title, description, showTrustRibbon = true }: AppLayoutProps) {
  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNav />
        {showTrustRibbon && <TrustRibbon />}

        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-[1800px] mx-auto space-y-6">
            {(title || description) && (
              <div className="flex items-center justify-between">
                <div>
                  {title && <h1 className="text-3xl font-bold tracking-tight">{title}</h1>}
                  {description && <p className="text-muted-foreground mt-1">{description}</p>}
                </div>
              </div>
            )}

            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
