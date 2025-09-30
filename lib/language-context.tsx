"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

type Language = "en" | "ja"

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

// Translation dictionary
const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    "nav.missionControl": "Mission Control",
    "nav.manifest": "Manifest Studio",
    "nav.orchestrator": "Orchestrator",
    "nav.approvals": "Approvals",
    "nav.cases": "Cases",
    "nav.observability": "Observability",
    "nav.agents": "Agents",
    "nav.integrations": "Integrations",
    "nav.policies": "Policies",
    "nav.settings": "Settings",
    "nav.compute": "COMPUTE",
    "nav.governance": "GOVERNANCE",
    // Common
    "common.search": "Search cases, agents, policies...",
    "common.help": "Help",
    "common.notifications": "Notifications",
    "common.language": "Language",
  },
  ja: {
    // Navigation
    "nav.missionControl": "ミッションコントロール",
    "nav.manifest": "マニフェストスタジオ",
    "nav.orchestrator": "オーケストレーター",
    "nav.approvals": "承認",
    "nav.cases": "ケース",
    "nav.observability": "可観測性",
    "nav.agents": "エージェント",
    "nav.integrations": "統合",
    "nav.policies": "ポリシー",
    "nav.settings": "設定",
    "nav.compute": "コンピュート",
    "nav.governance": "ガバナンス",
    // Common
    "common.search": "ケース、エージェント、ポリシーを検索...",
    "common.help": "ヘルプ",
    "common.notifications": "通知",
    "common.language": "言語",
  },
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("en")

  const t = (key: string): string => {
    return translations[language][key] || key
  }

  return <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
