// Rough $ cost estimation for the admin metrics view, based on logged
// token counts per message. Prices are approximate and configurable here
// — check anthropic.com/pricing for current numbers and adjust.
// This is for the admin's own visibility, not billing anyone.

const PRICE_PER_MILLION_TOKENS_USD = {
  'claude-haiku-4-5-20251001': { input: 1, output: 5 },
  'claude-sonnet-5': { input: 3, output: 15 },
  'claude-opus-5-5': { input: 15, output: 75 },
};
const DEFAULT_PRICE = { input: 3, output: 15 };

export function estimateCostUsd(model, inputTokens, outputTokens) {
  const price = PRICE_PER_MILLION_TOKENS_USD[model] || DEFAULT_PRICE;
  return (
    (inputTokens / 1_000_000) * price.input +
    (outputTokens / 1_000_000) * price.output
  );
}
