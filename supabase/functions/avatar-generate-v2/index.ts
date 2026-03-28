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
      return new Response(JSON.stringify({ error: "userId and photos required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const falKey = Deno.env.get("FAL_API_KEY");
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!falKey || !anthropicKey) {
      return new Response(JSON.stringify({ error: "API keys not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Step 1: Upsert avatar_profiles with status=processing
    const { data: avatarProfile } = await supabase.from("avatar_profiles").upsert({
      user_id: userId, body_type: bodyType, preferred_fit: preferredFit,
      skin_tone_retention: skinToneRetention, hair_retention: hairRetention, realism,
      generation_status: "processing", updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" }).select().single();

    // Step 2: Upload reference photos + insert avatar_reference_images rows
    const referenceUrls = [];
    const referenceIds = [];
    for (let i = 0; i < Math.min(photos.length, 8); i++) {
      try {
        const b64 = photos[i];
        const isPng = b64.startsWith("iVBOR");
        const mediaType = isPng ? "image/png" : "image/jpeg";
        const ext = isPng ? "png" : "jpg";
        const binaryStr = atob(b64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let j = 0; j < binaryStr.length; j++) bytes[j] = binaryStr.charCodeAt(j);
        const path = `${userId}/references/ref_${i}_${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("avatars").upload(path, bytes, { contentType: mediaType, upsert: true });
        if (!upErr) {
          const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
          referenceUrls.push(urlData.publicUrl);
          // Insert into avatar_reference_images
          const { data: refImg } = await supabase.from("avatar_reference_images").insert({
            user_id: userId, storage_path: path, public_url: urlData.publicUrl,
            file_name: `ref_${i}.${ext}`, is_primary: i === 0, status: "uploaded",
          }).select().single();
          if (refImg) referenceIds.push(refImg.id);
        }
      } catch (e) { console.error(`Photo ${i} error:`, e); }
    }

    // Update avatar_profiles with reference image ids
    if (avatarProfile?.id) {
      await supabase.from("avatar_profiles").update({ reference_image_ids: referenceIds }).eq("id", avatarProfile.id);
    }

    // Step 3: Claude appearance analysis
    const primaryPhoto = photos[0];
    const primaryMediaType = primaryPhoto.startsWith("iVBOR") ? "image/png" : "image/jpeg";
    let appearance = { gender: "person", ageRange: "30s", skinTone: "medium brown skin tone", hairStyle: "natural hair", facialFeatures: "natural features", build: bodyType || "athletic", heightEstimate: "average" };
    try {
      const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": anthropicKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001", max_tokens: 400,
          messages: [{ role: "user", content: [
            { type: "image", source: { type: "base64", media_type: primaryMediaType, data: primaryPhoto } },
            { type: "text", text: `Analyze this person for avatar generation. Respond ONLY with valid JSON: {"gender":"man or woman","ageRange":"30s","skinTone":"description","hairStyle":"description","build":"description","heightEstimate":"average"}` },
          ]}],
        }),
      });
      if (claudeRes.ok) {
        const cd = await claudeRes.json();
        const match = (cd.content?.[0]?.text || "").match(/\{[\s\S]*\}/);
        if (match) { try { appearance = { ...appearance, ...JSON.parse(match[0]) }; } catch(_) {} }
      }
    } catch(e) { console.error("Claude error:", e); }

    // Save appearance to avatar_profiles
    if (avatarProfile?.id) {
      await supabase.from("avatar_profiles").update({ appearance_profile: appearance }).eq("id", avatarProfile.id);
    }

    // Step 4: Build prompts
    const skinInstr = skinToneRetention >= 75 ? `exactly matching ${appearance.skinTone}` : `similar to ${appearance.skinTone}`;
    const hairInstr = hairRetention >= 75 ? `exactly matching ${appearance.hairStyle}` : `similar to ${appearance.hairStyle}`;
    const realismStyle = realism >= 75 ? "photorealistic, 8k, natural skin texture, professional photography" : "semi-realistic, clean digital art, detailed";
    const fitMap = { "slim-fit": "slim-fitting tailored", "regular": "regular fit classic", "relaxed": "relaxed fit comfortable", "oversized": "oversized streetwear" };
    const fitDesc = fitMap[preferredFit] || "well-fitted";
    const negPrompt = "cartoon, anime, blurry, distorted, deformed, bad anatomy, extra limbs, watermark, text, low quality, multiple people, cropped, nsfw";
    const variants = [
      `Full body fashion portrait, ${appearance.gender}, ${appearance.ageRange}, ${skinInstr}, ${hairInstr}, ${appearance.build} build, stylish casual ${fitDesc} clothing, confident pose facing forward, luxury walk-in closet background warm lighting, ${realismStyle}, fashion magazine quality, full body head to toe`,
      `Full body fashion portrait, ${appearance.gender}, ${appearance.ageRange}, ${skinInstr}, ${hairInstr}, ${appearance.build} build, smart casual ${fitDesc} clothing, poised neutral stance, modern wardrobe room soft lighting, ${realismStyle}, editorial photography, full body visible`,
      `Full body fashion portrait, ${appearance.gender}, ${appearance.ageRange}, ${skinInstr}, ${hairInstr}, ${appearance.build} build, elevated evening ${fitDesc} clothing, elegant pose, luxury closet backdrop accent lighting, ${realismStyle}, high fashion photography, full body head to toe`,
    ];

    // Step 5: Generate 3 variants via FAL.ai + save to avatar_renders
    const generatedUrls = [];
    const renderIds = [];
    const refImageUrl = referenceUrls[0];
    for (let v = 0; v < 3; v++) {
      try {
        const endpoint = refImageUrl ? "https://fal.run/fal-ai/flux/dev/image-to-image" : "https://fal.run/fal-ai/flux/dev";
        const falBody = refImageUrl
          ? { image_url: refImageUrl, prompt: variants[v], negative_prompt: negPrompt, strength: realism >= 75 ? 0.35 : 0.5, num_inference_steps: 28, guidance_scale: 4.0, image_size: { width: 576, height: 1024 }, num_images: 1, enable_safety_checker: true }
          : { prompt: variants[v], negative_prompt: negPrompt, num_inference_steps: 28, guidance_scale: 4.0, image_size: { width: 576, height: 1024 }, num_images: 1, enable_safety_checker: true };
        const falRes = await fetch(endpoint, { method: "POST", headers: { "Authorization": `Key ${falKey}`, "Content-Type": "application/json" }, body: JSON.stringify(falBody) });
        if (!falRes.ok) { console.error(`FAL v${v} failed:`, await falRes.text()); continue; }
        const falData = await falRes.json();
        const outputUrl = falData.images?.[0]?.url;
        if (!outputUrl) continue;
        // Download and store
        const imgRes = await fetch(outputUrl);
        const imgBuffer = await imgRes.arrayBuffer();
        const uint8 = new Uint8Array(imgBuffer);
        const avatarPath = `${userId}/generated/avatar_v${v + 1}_${Date.now()}.png`;
        const { error: saveErr } = await supabase.storage.from("avatars").upload(avatarPath, uint8, { contentType: "image/png", upsert: true });
        if (!saveErr) {
          const { data: avatarUrlData } = supabase.storage.from("avatars").getPublicUrl(avatarPath);
          const publicUrl = avatarUrlData.publicUrl + "?t=" + Date.now();
          generatedUrls.push(publicUrl);
          // Insert into avatar_renders
          const { data: render } = await supabase.from("avatar_renders").insert({
            user_id: userId, avatar_profile_id: avatarProfile?.id,
            storage_path: avatarPath, public_url: publicUrl,
            variant: v + 1, is_selected: v === 0,
            generation_params: { prompt: variants[v], strength: realism >= 75 ? 0.35 : 0.5, realism, skinToneRetention, hairRetention },
          }).select().single();
          if (render) renderIds.push(render.id);
        }
      } catch(e) { console.error(`Variant ${v} error:`, e); }
    }

    // Fallback
    if (generatedUrls.length === 0) generatedUrls.push(...referenceUrls.slice(0, 3));

    // Step 6: Update avatar_profiles to ready
    await supabase.from("avatar_profiles").upsert({
      user_id: userId, body_type: bodyType, preferred_fit: preferredFit,
      skin_tone_retention: skinToneRetention, hair_retention: hairRetention, realism,
      reference_photo_urls: referenceUrls, generated_avatar_urls: generatedUrls,
      selected_avatar_url: generatedUrls[0] || null,
      selected_render_id: renderIds[0] || null,
      generation_status: "ready", updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

    // Update profiles.avatar_url
    if (generatedUrls[0]) {
      await supabase.from("profiles").update({ avatar_url: generatedUrls[0], updated_at: new Date().toISOString() }).eq("id", userId);
    }

    return new Response(JSON.stringify({ success: true, generatedUrls, referenceUrls, appearance, renderIds }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("avatar-generate-v2 error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
