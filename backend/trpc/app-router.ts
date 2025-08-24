import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import { getProfile, updateProfile, deleteProfile } from "./routes/profile/route";
import { getPreferences, updatePreferences, deletePreferences } from "./routes/preferences/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  profile: createTRPCRouter({
    get: getProfile,
    update: updateProfile,
    delete: deleteProfile,
  }),
  preferences: createTRPCRouter({
    get: getPreferences,
    update: updatePreferences,
    delete: deletePreferences,
  }),
});

export type AppRouter = typeof appRouter;