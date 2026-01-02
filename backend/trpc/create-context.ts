import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { initTRPC, TRPCError } from "@trpc/server";
import { supabaseAdmin } from "@/lib/supabase";

export const createContext = async (opts: FetchCreateContextFnOptions) => {
  const authHeader = opts.req.headers.get('authorization');
  let userId: string | null = null;
  let isAuthenticated = false;
  
  if (authHeader && supabaseAdmin) {
    try {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
      
      if (!error && user) {
        userId = user.id;
        isAuthenticated = true;
        console.log('User authenticated:', userId);
      }
    } catch (error) {
      console.warn('Failed to authenticate user:', error);
    }
  }
  
  if (!supabaseAdmin) {
    console.log('Running in demo mode - no Supabase connection');
    userId = 'demo-user';
    isAuthenticated = true;
  }
  
  return {
    req: opts.req,
    supabase: supabaseAdmin,
    userId: userId || 'demo-user',
    isAuthenticated,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;

// Initialize tRPC
const t = initTRPC.context<Context>().create();

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.isAuthenticated && ctx.supabase) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource',
    });
  }
  
  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId!,
    },
  });
});