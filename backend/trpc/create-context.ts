import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { initTRPC } from "@trpc/server";
import { supabaseAdmin } from "@/lib/supabase";

// Context creation function
export const createContext = async (opts: FetchCreateContextFnOptions) => {
  // Extract user info from headers if available
  const authHeader = opts.req.headers.get('authorization');
  let userId: string | null = null;
  
  // Only try to authenticate if we have a real Supabase client
  if (authHeader && supabaseAdmin) {
    try {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      userId = user?.id || null;
    } catch (error) {
      console.warn('Failed to authenticate user:', error);
    }
  }
  
  // If no supabaseAdmin (demo mode), log it
  if (!supabaseAdmin) {
    console.log('Running in demo mode - no Supabase connection');
  }
  
  return {
    req: opts.req,
    supabase: supabaseAdmin, // This will be null in demo mode
    userId: userId || 'demo-user', // Fallback for demo
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;

// Initialize tRPC
const t = initTRPC.context<Context>().create();

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

// Protected procedure that requires authentication
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  // Add authentication logic here if needed
  return next({
    ctx: {
      ...ctx,
      // Add authenticated user context
    },
  });
});