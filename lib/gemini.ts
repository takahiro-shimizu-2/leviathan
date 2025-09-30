import { generateText, streamText } from "ai"

// Gemini 2.5 Pro configuration
const GEMINI_MODEL = "google/gemini-2.5-pro-latest"

export async function generateWithGemini(prompt: string, systemPrompt?: string) {
  try {
    const { text } = await generateText({
      model: GEMINI_MODEL,
      prompt,
      system: systemPrompt,
      temperature: 0.2,
    })

    return text
  } catch (error) {
    console.error("[v0] Gemini generation error:", error)
    throw error
  }
}

export async function streamWithGemini(prompt: string, systemPrompt?: string) {
  try {
    const result = await streamText({
      model: GEMINI_MODEL,
      prompt,
      system: systemPrompt,
      temperature: 0.2,
    })

    return result
  } catch (error) {
    console.error("[v0] Gemini streaming error:", error)
    throw error
  }
}

// Agent-specific prompts
export const AGENT_PROMPTS = {
  leadScoring: `You are a lead scoring agent. Analyze company data and score leads based on:
- Industry fit and technology stack
- Recent activity and hiring signals
- Decision maker presence
- Budget indicators
Return a score from 0-1 with reasoning.`,

  emailDraft: `You are an email drafting agent. Create personalized outreach emails that:
- Reference specific recent changes or activities
- Demonstrate understanding of their challenges
- Maintain professional, polite tone
- Include clear call-to-action
- Comply with brand guidelines and avoid prohibited words`,

  meetingAnalysis: `You are a meeting analysis agent. From meeting transcripts:
- Extract key discussion points
- Identify client pain points and requirements
- Generate action items with owners
- Assess deal probability
- Suggest next steps`,

  documentGeneration: `You are a document generation agent. Create professional materials:
- Sales decks tailored to client needs
- Technical proposals with evidence
- Deployment plans with rollback strategies
- Follow brand guidelines and legal requirements`,
}
