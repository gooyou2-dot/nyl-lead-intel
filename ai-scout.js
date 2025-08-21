// /netlify/functions/ai-scout.js

import { ok, fail } from './_shared/respond.js';

// --- CONFIGURATION ---
// The agent will ONLY call functions that have a corresponding API key set in Netlify.
const AVAILABLE_SOURCES = [
  { id: 'yelp', path: 'yelp', requiredEnv: 'YELP_API_KEY' },
  { id: 'places', path: 'places-search', requiredEnv: 'GOOGLE_PLACES_KEY' },
  { id: 'ticketmaster', path: 'ticketmaster', requiredEnv: 'TICKETMASTER_API_KEY' },
  { id: 'eventbrite', path: 'eventbrite-search', requiredEnv: 'EVENTBRITE_TOKEN' },
  { id: 'seatgeek', path: 'seatgeek', requiredEnv: 'SEATGEEK_CLIENT_ID' },
  // NOTE: You can add your public data sources like la-permits here later
].filter(src => process.env[src.requiredEnv]);

const OPENAI_MODEL = 'gpt-4o-mini';
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
// --- END CONFIGURATION ---

const getBaseUrl = () => process.env.URL || 'http://localhost:9999';

export async function handler(event) {
  const { region = 'Orange County' } = event.queryStringParameters || {};
  const baseUrl = getBaseUrl();

  if (AVAILABLE_SOURCES.length === 0) {
    return ok([]);
  }

  // 1. --- GATHER ---
  // Call all available working API functions in parallel.
  const fetchPromises = AVAILABLE_SOURCES.map(source => {
    const url = `${baseUrl}/.netlify/functions/${source.path}?region=${encodeURIComponent(region)}`;
    return fetch(url).then(res => res.json()).catch(() => ({ ok: false, items: [] }));
  });

  const results = await Promise.all(fetchPromises);
  let combinedLeads = [];
  results.forEach(result => {
    if (result.ok && Array.isArray(result.items)) {
      combinedLeads = combinedLeads.concat(result.items);
    }
  });

  // De-duplicate leads using a Map
  const uniqueLeads = new Map();
  combinedLeads.forEach(lead => {
    const key = `${lead.name.toLowerCase().trim()}|${(lead.location || "").substring(0, 15)}`;
    if (!uniqueLeads.has(key)) uniqueLeads.set(key, lead);
  });

  const finalLeads = Array.from(uniqueLeads.values());
  if (finalLeads.length === 0) return ok([]);

  // 2. --- ENRICH ---
  if (!process.env.OPENAI_API_KEY) {
    return ok(finalLeads); // Skip enrichment if key is missing
  }

  const prompt = `
    You are an AI assistant for a New York Life insurance agent. Analyze a list of new business leads and enrich them with insurance-specific insights.
    For each business in the provided JSON array, add these keys:
    - "insuranceNeeds": An array of 2-3 specific insurance types they likely need (e.g., "General Liability", "Workers' Compensation", "Commercial Auto").
    - "talkingPoint": A single, concise sentence (under 20 words) the agent can use to start a conversation.

    Respond with ONLY the updated JSON array of leads. Do not include any other text or explanations.
  `;

  try {
    const response = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        response_format: { "type": "json_object" }, // Ensures valid JSON output
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: JSON.stringify({ leads: finalLeads.slice(0, 40) }) } // Limit to manage cost
        ]
      })
    });

    if (!response.ok) throw new Error(`OpenAI API error: ${response.statusText}`);

    const data = await response.json();
    const enrichedContent = JSON.parse(data.choices[0].message.content);
    return ok(enrichedContent.leads || finalLeads);

  } catch (error) {
    console.error("AI enrichment failed:", error);
    return ok(finalLeads); // If AI fails, return the raw leads
  }
}