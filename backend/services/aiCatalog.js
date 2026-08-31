// services/aiCatalog.js — this is a REAL AI call (not simulated), using the
// Anthropic API. It requires YOUR OWN Anthropic API key in the .env file
// (ANTHROPIC_API_KEY). Without a key, this function throws a clear error
// instead of silently pretending to work.
//
// Model name: check https://docs.claude.com/en/docs/about-claude/models for
// the current recommended model string and update ANTHROPIC_MODEL in .env —
// model names change over time, so this file reads it from env rather than
// hardcoding one.

async function generateCatalogEntry({ rawNotes, language = 'Hindi' }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    const err = new Error(
      'ANTHROPIC_API_KEY .env file mein set nahi hai. https://console.anthropic.com se ek API key banao aur .env mein daalo.'
    );
    err.status = 501;
    throw err;
  }

  const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929';

  const prompt = `Tum ek marketplace ke liye product catalog assistant ho. Ek artisan ne apne handmade product ke baare mein ye raw notes di hain (unki apni bhasha mein, thoda unstructured ho sakta hai):

"""${rawNotes}"""

Isse ek clean product listing banao. Sirf valid JSON return karo, koi aur text nahi, is exact shape mein:
{
  "title": "chhota, aakarshak product title, ${language} mein",
  "category": "ek category jaise Pottery / Handloom / Bamboo Craft / Jewellery",
  "description": "2-3 sentence description jo ${language} mein ho, buyer ko aakarshit kare",
  "suggested_price_inr": <ek reasonable integer price INR mein, material aur craftsmanship dekhte hue>
}`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model,
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!response.ok) {
    const text = await response.text();
    const err = new Error(`Anthropic API error (${response.status}): ${text}`);
    err.status = 502;
    throw err;
  }

  const data = await response.json();
  const textBlock = (data.content || []).find((b) => b.type === 'text');
  if (!textBlock) {
    const err = new Error('AI se koi text response nahi mila.');
    err.status = 502;
    throw err;
  }

  const cleaned = textBlock.text.replace(/```json|```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    const err = new Error('AI response ko JSON mein parse nahi kar paye: ' + cleaned);
    err.status = 502;
    throw err;
  }
}

module.exports = { generateCatalogEntry };
