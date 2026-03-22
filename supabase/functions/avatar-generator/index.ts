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
    const { imageBase64, outfitDescription } = await req.json();
    if (!imageBase64) {
      return new Response(JSON.stringify({ error: 'imageBase64 is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
    const hfKey = Deno.env.get('HUGGINGFACE_API_KEY');
    if (!anthropicKey || !hfKey) {
      return new Response(JSON.stringify({ error: 'API keys not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Step 1: Claude analyzes person's appearance
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: imageBase64.startsWith('iVBOR') ? 'image/png' : 'image/jpeg', data: imageBase64 } },
            { type: 'text', text: `Describe this person for AI image generation. Be specific about gender, age range, skin tone, hair, build, and facial features. Respond ONLY with JSON: {"appearance": "detailed description", "gender": "woman/man/person"}` },
          ],
        }],
      }),
    });
    if (!claudeResponse.ok) {
  const errText = await claudeResponse.text();
  throw new Error(`Claude error: ${claudeResponse.status} - ${errText}`);
}
    const claudeData = await claudeResponse.json();
    const claudeText = claudeData.content?.[0]?.text || '';
    const jsonMatch = claudeText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Could not parse Claude response');
    const { appearance, gender } = JSON.parse(jsonMatch[0]);

    // Step 2: Generate avatar with Hugging Face SDXL
    const outfit = outfitDescription || 'stylish casual outfit';
    const prompt = `Professional fashion photography, full body portrait of a real ${gender}, ${appearance}, wearing ${outfit}, standing in front of a luxury walk-in closet with warm LED lighting, clothes hanging neatly on wooden rails behind them, shoes displayed below, clean neutral background, sharp focus, photorealistic, 8k, fashion editorial style, natural skin texture, professional studio lighting`;
    const negativePrompt = 'cartoon, anime, illustration, painting, blurry, distorted, deformed, ugly, bad anatomy, extra limbs, watermark, text, low quality, grainy, overexposed, plastic skin, fake, artificial';

    const hfResponse = await fetch(
      'https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-xl-base-1.0',
      {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${hfKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputs: prompt,
          parameters: { negative_prompt: negativePrompt, num_inference_steps: 30, guidance_scale: 3.5, width: 576, height: 1024 },
        }),
      }
    );
    if (!hfResponse.ok) {
      const errText = await hfResponse.text();
      throw new Error(`Hugging Face error: ${hfResponse.status} - ${errText.slice(0, 200)}`);
    }

    // Convert to base64
    const imageBuffer = await hfResponse.arrayBuffer();
    const uint8Array = new Uint8Array(imageBuffer);
    let binary = '';
    for (let i = 0; i < uint8Array.length; i++) binary += String.fromCharCode(uint8Array[i]);
    const avatarBase64 = btoa(binary);

    return new Response(
      JSON.stringify({ avatarBase64, appearance, prompt }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Avatar generation error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});