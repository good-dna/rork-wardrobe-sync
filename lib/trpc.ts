import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_RORK_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  }

  // Fallback for development
  if (__DEV__) {
    return 'http://localhost:3000';
  }

  throw new Error(
    "No base url found, please set EXPO_PUBLIC_RORK_API_BASE_URL"
  );
};

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      fetch: async (url, options) => {
        try {
          const response = await fetch(url, options as RequestInit);
          return response;
        } catch (error) {
          console.warn('tRPC fetch failed:', error);
          // Return a mock response for development
          return new Response(
            JSON.stringify({ error: { message: 'Backend not available', code: 'NETWORK_ERROR' } }),
            { status: 503, headers: { 'Content-Type': 'application/json' } }
          );
        }
      },
    }),
  ],
});