/* eslint-disable */
// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { imageBase64, fileName, userId } = await req.json();

    if (!imageBase64 || !fileName || !userId) {
      return new Response(
        JSON.stringify({ error: 'imageBase64, fileName, and userId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const hfKey = Deno.env.get('HUGGINGFACE_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!hfKey || !supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'API keys not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Convert base64 to binary
    const binaryStr = atob(imageBase64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    // Step 1: Remove background using Hugging Face rembg
    const hfResponse = await fetch(
      'https://router.huggingface.co/hf-inference/models/briaai/RMBG-1.4',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${hfKey}`,
          'Content-Type': 'image/jpeg',
        },
        body: bytes,
      }
    );

    let processedBytes = bytes; // fallback to original if bg removal fails
    let bgRemoved = false;

    if (hfResponse.ok) {
      const processedBuffer = await hfResponse.arrayBuffer();
      processedBytes = new Uint8Array(processedBuffer);
      bgRemoved = true;
    } else {
      console.warn('Background removal failed, using original image');
    }

    // Step 2: Upload to Supabase Storage
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const originalPath = `${userId}/original/${fileName}`;
    const processedPath = `${userId}/processed/${fileName.replace(/\.[^/.]+$/, '.png')}`;

    // Upload original
    const { error: origError } = await supabase.storage
      .from('wardrobe')
      .upload(originalPath, bytes, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (origError) throw new Error(`Failed to upload original: ${origError.message}`);

    // Upload processed (bg removed)
    const { error: procError } = await supabase.storage
      .from('wardrobe')
      .upload(processedPath, processedBytes, {
        contentType: bgRemoved ? 'image/png' : 'image/jpeg',
        upsert: true,
      });

    if (procError) throw new Error(`Failed to upload processed: ${procError.message}`);

    // Get public URLs
    const { data: origUrl } = supabase.storage.from('wardrobe').getPublicUrl(originalPath);
    const { data: procUrl } = supabase.storage.from('wardrobe').getPublicUrl(processedPath);

    return new Response(
      JSON.stringify({
        imageUrl: origUrl.publicUrl,
        bgRemovedUrl: procUrl.publicUrl,
        bgRemoved,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing wardrobe image:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});