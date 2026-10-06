// Routes a chat turn to either the live Anthropic API (online mode) or a
// local Ollama instance (offline mode), picking the model/token cap for
// the caller's tier from admin settings.

import { getSetting, getNumberSetting } from './settingsService.js';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';

function modelAndCapFor(tierForRouting) {
  switch (tierForRouting) {
    case 'subscriber':
      return {
        model: getSetting('model_subscriber'),
        maxTokens: getNumberSetting('max_tokens_subscriber'),
      };
    case 'ad_unlock':
      return {
        model: getSetting('model_ad_unlock'),
        maxTokens: getNumberSetting('max_tokens_ad_unlock'),
      };
    case 'free':
    default:
      return {
        model: getSetting('model_free'),
        maxTokens: getNumberSetting('max_tokens_free'),
      };
  }
}

/**
 * @param {object} opts
 * @param {'online'|'offline'} opts.mode
 * @param {'subscriber'|'ad_unlock'|'free'} opts.tierForRouting
 * @param {Array<{role:'user'|'assistant', content: string}>} opts.history
 * @param {string} opts.systemPrompt
 * @param {Array<{type:'image', mediaType:string, base64:string}>} [opts.attachments]
 * @returns {Promise<{text: string, model: string, inputTokens: number, outputTokens: number}>}
 */
export async function generateReply({
  mode,
  tierForRouting,
  history,
  systemPrompt,
  attachments = [],
}) {
  const { model, maxTokens } = modelAndCapFor(tierForRouting);

  if (mode === 'offline') {
    return callOllama({ model: getSetting('model_offline'), history, systemPrompt, maxTokens });
  }
  return callAnthropic({ model, history, systemPrompt, maxTokens, attachments });
}

async function callAnthropic({ model, history, systemPrompt, maxTokens, attachments }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new AiProviderError(
      'ANTHROPIC_API_KEY is not set on the server. Add it to server/.env, ' +
      'or switch this session to offline mode.'
    );
  }

  const messages = history.map((m) => ({ role: m.role, content: m.content }));

  // Attach any images to the final user turn as extra content blocks.
  if (attachments.length > 0 && messages.length > 0) {
    const last = messages[messages.length - 1];
    if (last.role === 'user') {
      last.content = [
        { type: 'text', text: last.content },
        ...attachments.map((a) => ({
          type: 'image',
          source: { type: 'base64', media_type: a.mediaType, data: a.base64 },
        })),
      ];
    }
  }

  const res = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages,
    }),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    throw new AiProviderError(`Anthropic API error (${res.status}): ${errBody.slice(0, 300)}`);
  }

  const data = await res.json();
  const text = (data.content || [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n');

  return {
    text,
    model,
    inputTokens: data.usage?.input_tokens || 0,
    outputTokens: data.usage?.output_tokens || 0,
  };
}

async function callOllama({ model, history, systemPrompt, maxTokens }) {
  const baseUrl = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.map((m) => ({ role: m.role, content: m.content })),
  ];

  let res;
  try {
    res = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
        options: { num_predict: maxTokens },
      }),
    });
  } catch (err) {
    throw new AiProviderError(
      `Couldn't reach Ollama at ${baseUrl}. Is it installed and running? ` +
      `Install from https://ollama.com, then run \`ollama pull ${model}\`. (${err.message})`
    );
  }

  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    throw new AiProviderError(`Ollama error (${res.status}): ${errBody.slice(0, 300)}`);
  }

  const data = await res.json();
  return {
    text: data.message?.content || '',
    model,
    inputTokens: data.prompt_eval_count || 0,
    outputTokens: data.eval_count || 0,
  };
}

export class AiProviderError extends Error {}
