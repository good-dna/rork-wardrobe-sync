import { z } from 'zod';
import { publicProcedure } from '../../../create-context';

const weatherKitInputSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  language: z.string().default('en'),
});

interface WeatherKitJWTPayload {
  iss: string;
  iat: number;
  exp: number;
  sub: string;
}

async function generateWeatherKitJWT(): Promise<string> {
  const teamId = process.env.WEATHERKIT_TEAM_ID;
  const serviceId = process.env.WEATHERKIT_SERVICE_ID;
  const keyId = process.env.WEATHERKIT_KEY_ID;
  const privateKeyP8 = process.env.WEATHERKIT_PRIVATE_KEY_P8;

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
  const base64url = (data: ArrayBuffer): string => {
    const base64 = btoa(String.fromCharCode(...new Uint8Array(data)));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  };

  const headerEncoded = base64url(encoder.encode(JSON.stringify(header)).buffer);
  const payloadEncoded = base64url(encoder.encode(JSON.stringify(payload)).buffer);
  const message = `${headerEncoded}.${payloadEncoded}`;

  const privateKeyFormatted = privateKeyP8
    .replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----/g, '')
    .replace(/\s/g, '');
  
  const binaryKey = Uint8Array.from(atob(privateKeyFormatted), c => c.charCodeAt(0));

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

export const getWeatherKitDataProcedure = publicProcedure
  .input(weatherKitInputSchema)
  .query(async ({ input }) => {
    try {
      const jwt = await generateWeatherKitJWT();
      const { latitude, longitude, language } = input;

      const url = `https://weatherkit.apple.com/api/v1/weather/${language}/${latitude}/${longitude}?dataSets=currentWeather,forecastDaily&timezone=auto`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${jwt}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('WeatherKit API error:', response.status, errorText);
        throw new Error(`WeatherKit API error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        currentWeather: data.currentWeather,
        forecastDaily: data.forecastDaily,
      };
    } catch (error) {
      console.error('Error fetching WeatherKit data:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch weather data');
    }
  });
