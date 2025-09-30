"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  FileCode,
  GitBranch,
  CheckSquare,
  FolderKanban,
  BarChart3,
  Settings,
  Zap,
  Shield,
  Database,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/language-context"

const navigation = [
  { href: "/", name: "nav.missionControl", icon: LayoutDashboard },
  { href: "/manifest", name: "nav.manifest", icon: FileCode },
  { href: "/orchestrator", name: "nav.orchestrator", icon: GitBranch },
  { href: "/approvals", name: "nav.approvals", icon: CheckSquare },
  { href: "/cases", name: "nav.cases", icon: FolderKanban },
  { href: "/observability", name: "nav.observability", icon: BarChart3 },
]

const sections = [
  {
    title: "nav.compute",
    items: [
      { href: "/agents", name: "nav.agents", icon: Zap },
      { href: "/integrations", name: "nav.integrations", icon: Database },
    ],
  },
  {
    title: "nav.governance",
    items: [
      { href: "/policies", name: "nav.policies", icon: Shield },
      { href: "/settings", name: "nav.settings", icon: Settings },
    ],
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { t } = useLanguage()

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      <Link href="/" className="p-6 border-b border-sidebar-border hover:bg-sidebar-accent/50 transition-colors">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-bold text-sidebar-foreground">AGI Platform</h2>
            <p className="text-xs text-muted-foreground">Orchestrator v1.0</p>
          </div>
        </div>
      </Link>

      <nav className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50",
                )}
              >
                <Icon className="w-4 h-4" />
                {t(item.name)}
              </Link>
            )
          })}
        </div>

        {sections.map((section) => (
          <div key={section.title}>
            <h3 className="px-3 text-xs font-semibold text-muted-foreground mb-2">{t(section.title)}</h3>
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50",
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {t(item.name)}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-xs font-medium text-primary">OP</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">Operator</p>
            <p className="text-xs text-muted-foreground truncate">ops@agi.co.jp</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
