# WeatherKit Setup Guide

This app uses Apple WeatherKit REST API through a Supabase Edge Function for secure authentication.

## Architecture

```
Expo App → Supabase Edge Function → Apple WeatherKit REST API
```

The private key is stored securely in Supabase and never exposed to the mobile app.

## Setup Steps

### 1. Apple WeatherKit Configuration

1. Go to [Apple Developer Portal](https://developer.apple.com)
2. Navigate to **Certificates, Identifiers & Profiles**
3. Create a **Service ID** for WeatherKit
4. Create a **Key** with WeatherKit enabled
5. Download the `.p8` private key file (you can only download it once!)

You'll need:
- **Team ID**: Found in your Apple Developer account
- **Service ID**: The identifier you created (e.g., `com.yourapp.weatherkit`)
- **Key ID**: The ID of the key you created
- **Private Key (.p8)**: The contents of the downloaded file

### 2. Supabase Edge Function Deployment

1. Install Supabase CLI if you haven't:
```bash
npm install -g supabase
```

2. Link your Supabase project:
```bash
supabase link --project-ref your-project-ref
```

3. Set the secrets (replace with your actual values):
```bash
supabase secrets set WEATHERKIT_TEAM_ID=YOUR_TEAM_ID
supabase secrets set WEATHERKIT_SERVICE_ID=com.yourapp.weatherkit
supabase secrets set WEATHERKIT_KEY_ID=YOUR_KEY_ID
supabase secrets set WEATHERKIT_PRIVATE_KEY_P8="$(cat path/to/AuthKey_XXXXX.p8)"
```

4. Deploy the edge function:
```bash
supabase functions deploy weatherkit
```

### 3. Verify Setup

Test the edge function:
```bash
curl -X POST 'https://your-project.supabase.co/functions/v1/weatherkit' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"latitude": 40.7128, "longitude": -74.0060, "language": "en"}'
```

### 4. Environment Variables in Expo

Make sure these are set in your `.env` file:
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## How It Works

1. **Location Permission**: App requests foreground location permission
2. **Get Coordinates**: Uses `expo-location` to get current latitude/longitude
3. **Call Edge Function**: Sends coordinates to Supabase Edge Function
4. **JWT Generation**: Edge Function generates signed ES256 JWT using private key
5. **WeatherKit API**: Edge Function calls Apple WeatherKit with JWT
6. **Display**: App shows 3-day forecast on Home screen

## Security Notes

- ✅ Private key is stored in Supabase secrets (server-side)
- ✅ JWT is generated server-side and never exposed to client
- ✅ Mobile app only sends coordinates and receives weather data
- ❌ Never include the `.p8` private key in your app code or repository

## Troubleshooting

### "WeatherKit credentials not configured"
- Check that all 4 secrets are set in Supabase
- Verify the private key includes the full PEM format with headers

### "WeatherKit API error: 401"
- Verify your Team ID, Service ID, and Key ID are correct
- Ensure the key has WeatherKit enabled in Apple Developer Portal
- Check the private key format (should be PKCS#8 PEM)

### "Location permission denied"
- App will fallback to profile location
- User can manually grant permission in device settings

### Edge function timeout
- WeatherKit API should respond in < 2 seconds
- Check Supabase function logs for errors

## API Response Format

```typescript
{
  currentWeather: {
    temperature: number,
    conditionCode: string,
    humidity: number,
    // ... more fields
  },
  forecastDaily: {
    days: [
      {
        forecastStart: string,
        temperatureMax: number,
        temperatureMin: number,
        conditionCode: string,
        // ... more fields
      }
    ]
  }
}
```

## References

- [Apple WeatherKit REST API](https://developer.apple.com/documentation/weatherkitrestapi)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [expo-location](https://docs.expo.dev/versions/latest/sdk/location/)
