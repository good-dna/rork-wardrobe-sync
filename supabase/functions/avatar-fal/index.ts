/* eslint-disable */
// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { imageBase64, imageMediaType, userId } = await req.json();
    if (!imageBase64 || !userId) {
      return new Response(JSON.stringify({ error: 'imageBase64 and userId required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const falKey = Deno.env.get('FAL_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!falKey) return new Response(JSON.stringify({ error: 'FAL_API_KEY not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const mediaType = imageMediaType || (imageBase64.startsWith('iVBOR') ? 'image/png' : 'image/jpeg');

    // Step 1: Upload user photo to fal storage
    const binaryStr = atob(imageBase64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
    const blob = new Blob([bytes], { type: mediaType });

    const uploadRes = await fetch('https://fal.run/fal-ai/storage/upload/initiate', {
      method: 'POST',
      headers: { 'Authorization': `Key ${falKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ file_name: `avatar_${userId}_${Date.now()}.jpg`, content_type: mediaType }),
    });

    let imageUrl = '';
    if (uploadRes.ok) {
      const { upload_url, file_url } = await uploadRes.json();
      await fetch(upload_url, { method: 'PUT', body: blob, headers: { 'Content-Type': mediaType } });
      imageUrl = file_url;
    } else {
      // Fallback: use base64 data URI
      imageUrl = `data:${mediaType};base64,${imageBase64}`;
    }

    // Step 2: Generate polished avatar using fal-ai/flux/dev with img2img
    const falRes = await fetch('https://fal.run/fal-ai/flux/dev/image-to-image', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${falKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_url: imageUrl,
        prompt: 'Full body portrait of a person standing confidently in a neutral pose, arms slightly away from body, facing forward, clean white studio background, professional fashion photography, sharp focus, 8k, photorealistic',
        negative_prompt: 'cartoon, anime, blurry, distorted, bad anatomy, extra limbs, deformed',
        strength: 0.3,
        num_inference_steps: 28,
        guidance_scale: 3.5,
        image_size: { width: 768, height: 1024 },
        num_images: 1,
        enable_safety_checker: true,
      }),
    });

    if (!falRes.ok) {
      const err = await falRes.text();
      throw new Error(`fal.ai error: ${falRes.status} - ${err.slice(0, 200)}`);
    }

    const falData = await falRes.json();
    const outputUrl = falData.images?.[0]?.url;
    if (!outputUrl) throw new Error('No image returned from fal.ai');

    // Step 3: Download and store in Supabase
    const imgRes = await fetch(outputUrl);
    const imgBuffer = await imgRes.arrayBuffer();
    const uint8 = new Uint8Array(imgBuffer);
    let binary = '';
    for (let i = 0; i < uint8.length; i++) binary += String.fromCharCode(uint8[i]);
    const avatarBase64 = btoa(binary);

    // Save avatar URL to profiles table
    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const path = `${userId}/avatar_${Date.now()}.png`;
      await supabase.storage.from('wardrobe').upload(path, uint8, { contentType: 'image/png', upsert: true });
      const { data: urlData } = supabase.storage.from('wardrobe').getPublicUrl(path);
      await supabase.from('profiles').update({ avatar_url: urlData.publicUrl }).eq('id', userId);
    }

    return new Response(
      JSON.stringify({ avatarBase64, method: 'fal' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Avatar fal error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});