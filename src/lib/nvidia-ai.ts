/**
 * NVIDIA AI Integration for blessing verification
 * Uses free GLM-4 or Minimax models via NVIDIA API
 */

const NVIDIA_API_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';

// Get API key from environment
function getApiKey(): string | null {
  return process.env.NVIDIA_API_KEY || null;
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

/**
 * Call NVIDIA AI API
 */
async function callNvidiaAI(messages: ChatMessage[], model = 'nvidia/llama-3.1-nemotron-70b-instruct'): Promise<string | null> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.log('NVIDIA_API_KEY not configured, skipping AI verification');
    return null;
  }

  try {
    const response = await fetch(NVIDIA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 100,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      console.error('NVIDIA API error:', response.status, await response.text());
      return null;
    }

    const data: ChatResponse = await response.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (error) {
    console.error('NVIDIA API call failed:', error);
    return null;
  }
}

/**
 * Verify if a message is a valid New Year blessing
 * Returns true if valid, false if not, null if AI unavailable (skip check)
 */
export async function verifyNewYearBlessing(blessing: string): Promise<boolean | null> {
  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: `You are a validator that checks if a message is a genuine New Year blessing or greeting.
Valid blessings include: wishes for prosperity, health, happiness, luck, success, family harmony, etc.
They can be in any language (English, Chinese, etc.).
Invalid: random text, insults, spam, unrelated content.
Respond with ONLY "VALID" or "INVALID" - nothing else.`,
    },
    {
      role: 'user',
      content: `Is this a valid New Year blessing?\n\n"${blessing}"`,
    },
  ];

  const result = await callNvidiaAI(messages);
  
  if (result === null) {
    // AI unavailable, skip verification
    return null;
  }

  const normalized = result.trim().toUpperCase();
  return normalized.includes('VALID') && !normalized.includes('INVALID');
}

/**
 * Tokens that require New Year blessing verification
 */
export const BLESSING_REQUIRED_TOKENS = ['CNY', 'RED-POCKET', 'HONGBAO', '红包'];

/**
 * Check if a token requires blessing verification
 */
export function requiresBlessing(tick: string): boolean {
  return BLESSING_REQUIRED_TOKENS.includes(tick.toUpperCase());
}
