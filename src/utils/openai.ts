import type { ModelType } from '../types'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface ChatContext {
  personaName: string
  personaType: 'Existing Elite' | 'Active Weekender' | 'Early Elite (Talent)'
  modelType: ModelType
  currentValue: number
  targetValue: number
  unit: string
  baselineVO2: number
  baselinePower: number
  shapTop5: Array<{ factor: string; contribution: number; impact: number }>
  plannedGain: number
  daysOfData: number
}

export function buildSystemPrompt(context: ChatContext): string {
  return `You are a Digital Twin Expert - an AI performance advisor specialized in athletic training optimization. You have access to comprehensive data about the athlete and their performance model.

ATHLETE PROFILE:
- Name: ${context.personaName}
- Type: ${context.personaType}
- Training History: ${context.daysOfData} days of data
- Baseline VO2max: ${context.baselineVO2} ml/kg/min
- Baseline Power: ${context.baselinePower}W

CURRENT SESSION:
- Active Model: ${context.modelType === 'VO2' ? 'VO2max' : 'Power Output'}
- Current ${context.modelType}: ${context.currentValue.toFixed(1)} ${context.unit}
- Target ${context.modelType}: ${context.targetValue.toFixed(1)} ${context.unit}
- Planned Gain: +${context.plannedGain.toFixed(1)} ${context.unit}

TOP INFLUENCING FACTORS (SHAP Analysis):
${context.shapTop5.map((f, i) => `${i + 1}. ${f.factor}: ${f.contribution.toFixed(1)}% influence (Impact: ${f.impact >= 0 ? '+' : ''}${f.impact.toFixed(2)} ${context.unit})`).join('\n')}

YOUR ROLE:
- Provide expert, personalized advice based on the athlete's specific profile and data
- Explain training concepts clearly and actionably
- Reference the SHAP analysis to show which factors matter most
- Consider the athlete type (Elite vs Weekender vs Developing) in your recommendations
- Be supportive, motivating, and evidence-based
- Keep responses concise but informative (2-4 paragraphs max)
- Use specific numbers from the data when relevant

RESPONSE STYLE:
- Professional yet approachable
- Data-driven with clear explanations
- Actionable recommendations
- Reference their specific numbers and goals
- Consider their athlete profile in suggestions

For ${context.personaType === 'Existing Elite' ? 'elite athletes, focus on marginal gains and periodization' : context.personaType === 'Active Weekender' ? 'recreational athletes, emphasize recovery and sustainable progress' : 'developing athletes, focus on balanced development and building foundations'}.`
}

export async function sendChatMessage(
  messages: ChatMessage[],
  apiKey: string
): Promise<string> {
  if (!apiKey || apiKey === 'your_openai_api_key_here') {
    throw new Error('Please configure your OpenAI API key in .env file')
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Using gpt-4o-mini for cost-effectiveness
        messages: messages,
        temperature: 0.7,
        max_tokens: 500,
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }))
      throw new Error(error.error?.message || `API request failed with status ${response.status}`)
    }

    const data = await response.json()
    return data.choices[0]?.message?.content || 'No response generated'
  } catch (error) {
    console.error('OpenAI API Error:', error)
    throw error
  }
}

export async function sendChatMessageStreaming(
  messages: ChatMessage[],
  apiKey: string,
  onChunk: (chunk: string) => void
): Promise<void> {
  if (!apiKey || apiKey === 'your_openai_api_key_here') {
    throw new Error('Please configure your OpenAI API key in .env file')
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        temperature: 0.7,
        max_tokens: 500,
        stream: true,
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }))
      throw new Error(error.error?.message || `API request failed with status ${response.status}`)
    }

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    if (!reader) {
      throw new Error('No response body')
    }

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n').filter(line => line.trim() !== '')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') continue

          try {
            const parsed = JSON.parse(data)
            const content = parsed.choices[0]?.delta?.content
            if (content) {
              onChunk(content)
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }
  } catch (error) {
    console.error('OpenAI Streaming API Error:', error)
    throw error
  }
}

