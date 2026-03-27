/* eslint-disable */
// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { userId, photos, bodyType, preferredFit, skinToneRetention = 75, hairRetention = 75, realism = 75 } = await req.json();

    if (!userId || !photos?.length) {
      return new Response(JSON.stringify({ error: "userId and photos are required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const falKey = Deno.env.get("FAL_API_KEY");
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!falKey || !anthropicKey) {
      return new Response(JSON.stringify({ error: "API keys not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Step 1: Update status to generating
    await supabase.from("avatar_profiles").upsert({
      user_id: userId, body_type: bodyType, preferred_fit: preferredFit,
      skin_tone_retention: skinToneRetention, hair_retention: hairRetention, realism,
      generation_status: "generating", updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

    // Step 2: Upload reference photos to Supabase Storage
    const referenceUrls = [];
    for (let i = 0; i < Math.min(photos.length, 8); i++) {
      const b64 = photos[i];
      const mediaType = b64.startsWith("iVBOR") ? "image/png" : "image/jpeg";
      const ext = mediaType === "image/png" ? "png" : "jpg";
      const binaryStr = atob(b64);
      const bytes = new Uint8Array(binaryStr.length);
      for (let j = 0; j < binaryStr.length; j++) bytes[j] = binaryStr.charCodeAt(j);
      const path = `${userId}/references/ref_${i}_${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, bytes, { contentType: mediaType, upsert: true });
      if (!upErr) {
        const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
        referenceUrls.push(urlData.publicUrl);
      }
    }

    // Step 3: Claude analyzes primary photo
    const primaryPhoto = photos[0];
    const mediaType = primaryPhoto.startsWith("iVBOR") ? "image/png" : "image/jpeg";
    let appearance = { gender: "person", ageRange: "30s", skinTone: "medium skin tone", hairStyle: "natural hair", build: bodyType || "athletic" };

    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": anthropicKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 400,
        messages: [{ role: "user", content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: primaryPhoto } },
          { type: "text", text: `Analyze this person for fashion avatar generation. Respond ONLY with JSON: {"gender": "man/woman/person", "ageRange": "20s/30s etc", "skinTone": "specific skin tone", "hairStyle": "specific hair description", "build": "body build"}` },
        ]}],
      }),
    });

    if (claudeRes.ok) {
      const claudeData = await claudeRes.json();
      const claudeText = claudeData.content?.[0]?.text || "";
      const jsonMatch = claudeText.match(/\{[\s\S]*\}/);
      if (jsonMatch) { try { appearance = { ...appearance, ...JSON.parse(jsonMatch[0]) }; } catch (_) {} }
    }

    // Step 4: Build prompts based on settings
    const skinInstruction = skinToneRetention >= 75 ? `exactly matching ${appearance.skinTone}` : `similar to ${appearance.skinTone}`;
    const hairInstruction = hairRetention >= 75 ? `exactly matching ${appearance.hairStyle}` : `similar to ${appearance.hairStyle}`;
    const realismStyle = realism >= 75 ? "photorealistic, 8k, natural skin texture, studio photography" : "semi-realistic, clean digital art, detailed";
    const fitDesc = { "slim-fit": "slim-fitting tailored", "regular": "regular fit classic", "relaxed": "relaxed fit comfortable", "oversized": "oversized streetwear" }[preferredFit] || "well-fitted";

    const variantPrompts = [
      `Full body fashion portrait of a ${appearance.gender}, ${skinInstruction}, ${hairInstruction}, ${appearance.build} build, wearing stylish casual ${fitDesc} clothing, confident pose facing forward, luxury walk-in closet background warm lighting, ${realismStyle}, fashion magazine quality`,
      `Full body fashion portrait of a ${appearance.gender}, ${skinInstruction}, ${hairInstruction}, ${appearance.build} build, wearing smart casual ${fitDesc} clothing, modern wardrobe room background soft lighting, ${realismStyle}, editorial photography`,
      `Full body fashion portrait of a ${appearance.gender}, ${skinInstruction}, ${hairInstruction}, ${appearance.build} build, wearing elevated ${fitDesc} evening clothing, elegant closet backdrop accent lighting, ${realismStyle}, luxury fashion photography`,
    ];
    const negativePrompt = "cartoon, anime, blurry, distorted, deformed, bad anatomy, extra limbs, watermark, text, low quality, multiple people, cropped";

    // Step 5: Generate 3 variants via FAL.ai
    const generatedUrls = [];
    const refImageUrl = referenceUrls[0];

    for (let v = 0; v < 3; v++) {
      try {
        const endpoint = refImageUrl ? "https://fal.run/fal-ai/flux/dev/image-to-image" : "https://fal.run/fal-ai/flux/dev";
        const falBody = refImageUrl
          ? { image_url: refImageUrl, prompt: variantPrompts[v], negative_prompt: negativePrompt, strength: realism >= 75 ? 0.35 : 0.5, num_inference_steps: 28, guidance_scale: 4.0, image_size: { width: 576, height: 1024 }, num_images: 1, enable_safety_checker: true }
          : { prompt: variantPrompts[v], negative_prompt: negativePrompt, num_inference_steps: 28, guidance_scale: 4.0, image_size: { width: 576, height: 1024 }, num_images: 1, enable_safety_checker: true };

        const falRes = await fetch(endpoint, {
          method: "POST",
          headers: { "Authorization": `Key ${falKey}`, "Content-Type": "application/json" },
          body: JSON.stringify(falBody),
        });

        if (!falRes.ok) { console.error(`FAL variant ${v} failed:`, await falRes.text()); continue; }

        const falData = await falRes.json();
        const outputUrl = falData.images?.[0]?.url;
        if (!outputUrl) continue;

        const imgRes = await fetch(outputUrl);
        const imgBuffer = await imgRes.arrayBuffer();
        const uint8 = new Uint8Array(imgBuffer);
        const avatarPath = `${userId}/generated/avatar_v${v + 1}_${Date.now()}.png`;

        const { error: saveErr } = await supabase.storage.from("avatars").upload(avatarPath, uint8, { contentType: "image/png", upsert: true });
        if (!saveErr) {
          const { data: avatarUrlData } = supabase.storage.from("avatars").getPublicUrl(avatarPath);
          generatedUrls.push(`${avatarUrlData.publicUrl}?t=${Date.now()}`);
        }
      } catch (variantErr) { console.error(`Variant ${v} error:`, variantErr); }
    }

    // Fallback to reference photos if generation failed
    if (generatedUrls.length === 0) generatedUrls.push(...referenceUrls.slice(0, 3));

    // Step 6: Save to avatar_profiles and update profile
    await supabase.from("avatar_profiles").upsert({
      user_id: userId, body_type: bodyType, preferred_fit: preferredFit,
      skin_tone_retention: skinToneRetention, hair_retention: hairRetention, realism,
      reference_photo_urls: referenceUrls, generated_avatar_urls: generatedUrls,
      selected_avatar_url: generatedUrls[0] || null, generation_status: "complete",
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

    if (generatedUrls[0]) {
      await supabase.from("profiles").update({ avatar_url: generatedUrls[0], updated_at: new Date().toISOString() }).eq("id", userId);
    }

    return new Response(JSON.stringify({ success: true, generatedUrls, referenceUrls, appearance }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("Avatar generate v2 error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
