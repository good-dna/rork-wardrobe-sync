import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import { getProfile, updateProfile, deleteProfile } from "./routes/profile/route";
import { getPreferences, updatePreferences, deletePreferences } from "./routes/preferences/route";
import { 
  getSneakersProcedure,
  getSneakerProcedure,
  searchSneakersProcedure,
  getFavoriteSneakersProcedure,
  getSneakersByBrandProcedure,
  toggleSneakerFavoriteProcedure,
  recordSneakerWearProcedure,
  getSneakerStatsProcedure
} from "./routes/sneakers/route";

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
  sneakers: createTRPCRouter({
    getAll: getSneakersProcedure,
    getById: getSneakerProcedure,
    search: searchSneakersProcedure,
    getFavorites: getFavoriteSneakersProcedure,
    getByBrand: getSneakersByBrandProcedure,
    toggleFavorite: toggleSneakerFavoriteProcedure,
    recordWear: recordSneakerWearProcedure,
    getStats: getSneakerStatsProcedure,
  }),
});

export type AppRouter = typeof appRouter;