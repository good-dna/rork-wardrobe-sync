/* eslint-disable */
// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { imageBase64, mediaType } = await req.json();
    if (!imageBase64) return new Response(JSON.stringify({ error: 'imageBase64 required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicKey) return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType || 'image/jpeg', data: imageBase64 } },
            { type: 'text', text: `You are a clothing identification expert. Analyze this image which may show:
- A clothing item directly
- A clothing tag or label
- A receipt or purchase record
- A brand label or care tag

Extract all available information and respond with ONLY a JSON object:
{
  "name": "specific item name (e.g. Slim Fit Oxford Shirt, not just Shirt)",
  "brand": "brand name exactly as shown",
  "category": "one of: shirts, pants, jackets, shoes, accessories, fragrances",
  "color": "primary color",
  "material": "fabric/material if visible",
  "confidence": "high/medium/low"
}

If you cannot determine a field, use an empty string. Never guess brand names.` }
          ],
        }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Claude error: ${response.status} - ${err}`);
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Could not parse Claude response');
    const result = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Scan error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});