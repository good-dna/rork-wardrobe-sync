import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import { supabase, isSupabaseConfigured } from "./supabase";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_RORK_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  }

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
          const headers: HeadersInit = {
            ...(options?.headers as HeadersInit || {}),
          };

          if (isSupabaseConfigured) {
            try {
              const { data: { session } } = await supabase.auth.getSession();
              if (session?.access_token) {
                (headers as Record<string, string>).authorization = `Bearer ${session.access_token}`;
              }
            } catch (error) {
              console.warn('Failed to get session for auth header:', error);
            }
          }

          const response = await fetch(url, {
            ...options as RequestInit,
            headers,
          });
          return response;
        } catch (error) {
          console.warn('tRPC fetch failed:', error);
          return new Response(
            JSON.stringify({ error: { message: 'Backend not available', code: 'NETWORK_ERROR' } }),
            { status: 503, headers: { 'Content-Type': 'application/json' } }
          );
        }
      },
    }),
  ],
});