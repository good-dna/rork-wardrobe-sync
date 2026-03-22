/* eslint-disable */
// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  try {
    const { imageBase64, outfitDescription, imageMediaType } = await req.json();
    if (!imageBase64) {
      return new Response(JSON.stringify({ error: 'imageBase64 is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const replicateKey = Deno.env.get('REPLICATE_API_KEY');
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!replicateKey || !anthropicKey) {
      return new Response(JSON.stringify({ error: 'API keys not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const mediaType = imageMediaType || (imageBase64.startsWith('iVBOR') ? 'image/png' : 'image/jpeg');
    const outfit = outfitDescription || 'stylish casual outfit';

    // Step 1: Claude analyzes appearance
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: imageBase64 } },
            { type: 'text', text: 'Describe this person for fashion photo generation in one sentence covering gender, age range, skin tone, hair. Be concise. No JSON needed.' },
          ],
        }],
      }),
    });
    if (!claudeRes.ok) {
      const err = await claudeRes.text();
      throw new Error(`Claude error: ${claudeRes.status} - ${err}`);
    }
    const claudeData = await claudeRes.json();
    const appearance = claudeData.content?.[0]?.text || 'a person';

    // Step 2: Send to Replicate PhotoMaker
    const dataUri = `data:${mediaType};base64,${imageBase64}`;
    const prompt = `Full body fashion photo of ${appearance}, wearing ${outfit}, standing in front of a luxury walk-in wardrobe with warm ambient lighting, clothes hanging on rails, photorealistic, fashion magazine style, 8k img`;

    const predictionRes = await fetch('https://api.replicate.com/v1/models/stability-ai/sdxl/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${replicateKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: {
          prompt,
          negative_prompt: 'cartoon, anime, blurry, distorted, deformed, low quality, extra limbs',
          num_inference_steps: 25,
          guidance_scale: 7.5,
          width: 768,
          height: 1024,
        },
      }),
    });

    if (!predictionRes.ok) {
      const err = await predictionRes.text();
      throw new Error(`Replicate error: ${predictionRes.status} - ${err}`);
    }

    let result = await predictionRes.json();

    // Poll for completion (max 90 seconds)
    let attempts = 0;
    while (result.status !== 'succeeded' && result.status !== 'failed' && attempts < 45) {
      await new Promise(r => setTimeout(r, 2000));
      const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${result.id}`, {
        headers: { 'Authorization': `Bearer ${replicateKey}` },
      });
      result = await pollRes.json();
      attempts++;
    }

    if (result.status === 'failed') {
      throw new Error(`Replicate failed: ${result.error || 'unknown error'}`);
    }

    if (!result.output) {
      throw new Error('No output returned from Replicate');
    }

    const outputUrl = Array.isArray(result.output) ? result.output[0] : result.output;

    // Fetch image and convert to base64
    const imgRes = await fetch(outputUrl);
    const imgBuffer = await imgRes.arrayBuffer();
    const uint8 = new Uint8Array(imgBuffer);
    let binary = '';
    for (let i = 0; i < uint8.length; i++) binary += String.fromCharCode(uint8[i]);
    const avatarBase64 = btoa(binary);

    return new Response(
      JSON.stringify({ avatarBase64, appearance, method: 'replicate' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Replicate avatar error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
