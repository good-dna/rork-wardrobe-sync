/* eslint-disable */
// @ts-nocheck
// This is a Deno Edge Function and uses Deno-specific APIs
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WeatherKitJWTPayload {
  iss: string;
  iat: number;
  exp: number;
  sub: string;
}

async function generateWeatherKitJWT(): Promise<string> {
  const teamId = Deno.env.get('WEATHERKIT_TEAM_ID');
  const serviceId = Deno.env.get('WEATHERKIT_SERVICE_ID');
  const keyId = Deno.env.get('WEATHERKIT_KEY_ID');
  const privateKeyP8 = Deno.env.get('WEATHERKIT_PRIVATE_KEY_P8');

  if (!teamId || !serviceId || !keyId || !privateKeyP8) {
    throw new Error('WeatherKit credentials not configured');
  }

  const now = Math.floor(Date.now() / 1000);
  const payload: WeatherKitJWTPayload = {
    iss: teamId,
    iat: now,
    exp: now + 3600,
    sub: serviceId,
  };

  const header = {
    alg: 'ES256',
    kid: keyId,
    id: `${teamId}.${serviceId}`,
  };

  const encoder = new TextEncoder();
  const base64url = (data: ArrayBuffer | Uint8Array): string => {
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  };

  const headerEncoded = base64url(encoder.encode(JSON.stringify(header)));
  const payloadEncoded = base64url(encoder.encode(JSON.stringify(payload)));
  const message = `${headerEncoded}.${payloadEncoded}`;

  const privateKeyFormatted = privateKeyP8
    .replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----/g, '')
    .replace(/\s/g, '');

  const binaryKeyString = atob(privateKeyFormatted);
  const binaryKey = new Uint8Array(binaryKeyString.length);
  for (let i = 0; i < binaryKeyString.length; i++) {
    binaryKey[i] = binaryKeyString.charCodeAt(i);
  }

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    cryptoKey,
    encoder.encode(message)
  );

  const signatureEncoded = base64url(signature);
  return `${message}.${signatureEncoded}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { latitude, longitude, language = 'en' } = await req.json();

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return new Response(
        JSON.stringify({ error: 'Invalid latitude or longitude' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return new Response(
        JSON.stringify({ error: 'Latitude must be between -90 and 90, longitude between -180 and 180' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const jwt = await generateWeatherKitJWT();
    const url = `https://weatherkit.apple.com/api/v1/weather/${language}/${latitude}/${longitude}?dataSets=currentWeather,forecastDaily&timezone=auto`;

    console.log('Fetching WeatherKit data for:', { latitude, longitude, language });

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${jwt}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('WeatherKit API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: `WeatherKit API error: ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();

    return new Response(
      JSON.stringify({
        currentWeather: data.currentWeather,
        forecastDaily: data.forecastDaily,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in weatherkit function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
