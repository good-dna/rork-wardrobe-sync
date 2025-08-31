import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import { getProfile, updateProfile, deleteProfile } from "./routes/profile/route";
import { getPreferences, updatePreferences, deletePreferences } from "./routes/preferences/route";
import {
  addSneakerProcedure,
  getMySneakersProcedure,
  getSneakerProcedure,
  updateSneakerProcedure,
  deleteSneakerProcedure,
  addToWishlistProcedure,
  getMyWishlistProcedure,
  removeFromWishlistProcedure,
  updateWishlistItemProcedure,
  getCollectionStatsProcedure,
  searchSneakersProcedure,
  getTrendingSneakersProcedure,
  getUpcomingReleasesProcedure,
  addPriceHistoryProcedure,
  getPriceHistoryProcedure
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
    // Collection management
    add: addSneakerProcedure,
    getMy: getMySneakersProcedure,
    get: getSneakerProcedure,
    update: updateSneakerProcedure,
    delete: deleteSneakerProcedure,
    
    // Wishlist management
    addToWishlist: addToWishlistProcedure,
    getMyWishlist: getMyWishlistProcedure,
    removeFromWishlist: removeFromWishlistProcedure,
    updateWishlistItem: updateWishlistItemProcedure,
    
    // Stats and analytics
    getStats: getCollectionStatsProcedure,
    
    // Public data
    search: searchSneakersProcedure,
    getTrending: getTrendingSneakersProcedure,
    getUpcoming: getUpcomingReleasesProcedure,
    
    // Price tracking
    addPriceHistory: addPriceHistoryProcedure,
    getPriceHistory: getPriceHistoryProcedure,
  }),
});

export type AppRouter = typeof appRouter;