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
    const { userId, avatarUrl, garmentUrl, wardrobeItemId, clothType = "overall", saveLook = false, lookName } = await req.json();
    if (!avatarUrl || !garmentUrl) {
      return new Response(JSON.stringify({ error: "avatarUrl and garmentUrl required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const falKey = Deno.env.get("FAL_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!falKey) throw new Error("FAL_API_KEY not set");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Step 1: Create tryon_jobs row
    let jobId = null;
    if (userId && wardrobeItemId) {
      const { data: job } = await supabase.from("tryon_jobs").insert({
        user_id: userId, wardrobe_item_id: wardrobeItemId,
        garment_url: garmentUrl, cloth_type: clothType, status: "processing",
      }).select().single();
      jobId = job?.id;
    }

    // Step 2: Call CAT-VTON via FAL.ai
    const falRes = await fetch("https://fal.run/fal-ai/cat-vton", {
      method: "POST",
      headers: { "Authorization": `Key ${falKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        human_image_url: avatarUrl,
        garment_image_url: garmentUrl,
        cloth_type: clothType,
        num_inference_steps: 30,
        guidance_scale: 2.5,
      }),
    });

    if (!falRes.ok) {
      const errText = await falRes.text();
      if (jobId) await supabase.from("tryon_jobs").update({ status: "failed", error_message: errText.slice(0, 200) }).eq("id", jobId);
      throw new Error(`FAL error: ${falRes.status} - ${errText.slice(0, 200)}`);
    }

    const falData = await falRes.json();
    const resultUrl = falData.image?.url || falData.images?.[0]?.url;
    if (!resultUrl) throw new Error("No result image from FAL");

    // Step 3: Download and store result
    let storedUrl = resultUrl;
    if (userId) {
      const imgRes = await fetch(resultUrl);
      const imgBuffer = await imgRes.arrayBuffer();
      const uint8 = new Uint8Array(imgBuffer);
      const path = `${userId}/tryon/result_${Date.now()}.png`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, uint8, { contentType: "image/png", upsert: true });
      if (!upErr) {
        const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
        storedUrl = urlData.publicUrl + "?t=" + Date.now();
      }
    }

    // Step 4: Update tryon_jobs to ready
    if (jobId) {
      await supabase.from("tryon_jobs").update({
        status: "ready", result_url: storedUrl, completed_at: new Date().toISOString(),
      }).eq("id", jobId);
    }

    // Step 5: Optionally save to saved_looks
    let savedLookId = null;
    if (saveLook && userId && wardrobeItemId) {
      const { data: look } = await supabase.from("saved_looks").insert({
        user_id: userId, tryon_job_id: jobId,
        wardrobe_item_id: wardrobeItemId,
        result_url: storedUrl, name: lookName || "My Look",
      }).select().single();
      savedLookId = look?.id;
    }

    return new Response(JSON.stringify({ success: true, resultUrl: storedUrl, jobId, savedLookId }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("tryon-fal error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
