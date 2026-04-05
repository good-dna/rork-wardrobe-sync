import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    console.log('tryon-fal called');
    const body = await req.json();
    console.log('body keys:', Object.keys(body));

    const falKey = Deno.env.get('FAL_API_KEY');
    if (!falKey) throw new Error('FAL_API_KEY not set');

    const { avatarUrl, garmentUrl, clothType } = body;
    if (!avatarUrl) throw new Error('avatarUrl required');
    if (!garmentUrl) throw new Error('garmentUrl required');

    console.log('Calling CAT-VTON with:', { avatarUrl: avatarUrl.slice(0, 50), garmentUrl: garmentUrl.slice(0, 50), clothType });

    const falRes = await fetch('https://fal.run/fal-ai/cat-vton', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${falKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        human_image_url: avatarUrl,
        garment_image_url: garmentUrl,
        cloth_type: clothType || 'upper',
      }),
    });

    const falText = await falRes.text();
    console.log('fal response status:', falRes.status, 'body:', falText.slice(0, 300));

    if (!falRes.ok) throw new Error(`fal error: ${falRes.status} - ${falText.slice(0, 200)}`);

    const falData = JSON.parse(falText);
    const outputUrl = falData.image?.url || falData.images?.[0]?.url;
    if (!outputUrl) throw new Error('No output URL from fal');

    const imgRes = await fetch(outputUrl);
    const imgBuffer = await imgRes.arrayBuffer();
    const uint8 = new Uint8Array(imgBuffer);
    let binary = '';
    for (let i = 0; i < uint8.length; i++) binary += String.fromCharCode(uint8[i]);
    const resultBase64 = btoa(binary);

    return new Response(
      JSON.stringify({ resultBase64, outputUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('tryon-fal error:', error?.message || error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});