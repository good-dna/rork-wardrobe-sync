import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import { getProfile, updateProfile, deleteProfile } from "./routes/profile/route";
import { getPreferences, updatePreferences, deletePreferences } from "./routes/preferences/route";
import {
  signUpProcedure,
  signInProcedure,
  signOutProcedure,
  getCurrentUserProcedure,
  resetPasswordProcedure,
  updatePasswordProcedure,
  updateUserProfileProcedure,
  verifyEmailProcedure,
  resendVerificationProcedure,
  deleteAccountProcedure,
  getUserSessionsProcedure
} from "./routes/auth/route";
import { 
  getSneakersProcedure,
  getSneakerProcedure,
  searchSneakersProcedure,
  searchExternalSneakersProcedure,
  getFavoriteSneakersProcedure,
  getSneakersByBrandProcedure,
  toggleSneakerFavoriteProcedure,
  recordSneakerWearProcedure,
  getSneakerStatsProcedure,
  addSneakerProcedure,
  updateSneakerProcedure,
  deleteSneakerProcedure
} from "./routes/sneakers/route";
import { getCurrentWeatherProcedure } from "./routes/weather/current/route";
import { getForecastProcedure } from "./routes/weather/forecast/route";
import { searchLocationsProcedure, reverseGeocodeProcedure } from "./routes/weather/geocoding/route";
import { getWeatherRecommendationsProcedure } from "./routes/weather/recommendations/route";
import {
  addItemProcedure,
  listMyItemsProcedure,
  getItemProcedure,
  updateItemProcedure,
  deleteItemProcedure,
  getItemStatsProcedure
} from "./routes/wardrobe/items/route";
import {
  addOutfitProcedure,
  listMyOutfitsProcedure,
  getOutfitProcedure,
  updateOutfitProcedure,
  deleteOutfitProcedure,
  toggleOutfitFavoriteProcedure,
  recordOutfitWearProcedure,
  getOutfitStatsProcedure,
  getOutfitRecommendationsProcedure
} from "./routes/wardrobe/outfits/route";
import {
  getWardrobeOverviewProcedure,
  getCategoryBreakdownProcedure,
  getColorBreakdownProcedure,
  getBrandBreakdownProcedure,
  getWearAnalyticsProcedure,
  getPurchaseAnalyticsProcedure,
  getSeasonalAnalyticsProcedure,
  getMaintenanceAnalyticsProcedure,
  getAnalyticsDashboardProcedure
} from "./routes/analytics/route";
import {
  getBrandsProcedure,
  getBrandProcedure,
  searchBrandsProcedure,
  getPopularBrandsProcedure,
  getBrandsByCategoryProcedure,
  getBrandsByPriceRangeProcedure,
  addBrandProcedure,
  updateBrandProcedure,
  deleteBrandProcedure,
  getBrandStatsProcedure,
  getBrandSuggestionsProcedure
} from "./routes/brands/route";
import {
  addPlanProcedure,
  getPlansByDateProcedure,
  getPlansByDateRangeProcedure,
  updatePlanProcedure,
  deletePlanProcedure,
  getPlanProcedure,
  getAllPlansProcedure
} from "./routes/plans/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  auth: createTRPCRouter({
    signUp: signUpProcedure,
    signIn: signInProcedure,
    signOut: signOutProcedure,
    getCurrentUser: getCurrentUserProcedure,
    resetPassword: resetPasswordProcedure,
    updatePassword: updatePasswordProcedure,
    updateProfile: updateUserProfileProcedure,
    verifyEmail: verifyEmailProcedure,
    resendVerification: resendVerificationProcedure,
    deleteAccount: deleteAccountProcedure,
    getSessions: getUserSessionsProcedure,
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
    searchExternal: searchExternalSneakersProcedure,
    getFavorites: getFavoriteSneakersProcedure,
    getByBrand: getSneakersByBrandProcedure,
    toggleFavorite: toggleSneakerFavoriteProcedure,
    recordWear: recordSneakerWearProcedure,
    getStats: getSneakerStatsProcedure,
    add: addSneakerProcedure,
    update: updateSneakerProcedure,
    delete: deleteSneakerProcedure,
  }),
  weather: createTRPCRouter({
    current: getCurrentWeatherProcedure,
    forecast: getForecastProcedure,
    searchLocations: searchLocationsProcedure,
    reverseGeocode: reverseGeocodeProcedure,
    recommendations: getWeatherRecommendationsProcedure,
  }),
  wardrobe: createTRPCRouter({
    items: createTRPCRouter({
      add: addItemProcedure,
      list: listMyItemsProcedure,
      get: getItemProcedure,
      update: updateItemProcedure,
      delete: deleteItemProcedure,
      stats: getItemStatsProcedure,
    }),
    outfits: createTRPCRouter({
      add: addOutfitProcedure,
      list: listMyOutfitsProcedure,
      get: getOutfitProcedure,
      update: updateOutfitProcedure,
      delete: deleteOutfitProcedure,
      toggleFavorite: toggleOutfitFavoriteProcedure,
      recordWear: recordOutfitWearProcedure,
      stats: getOutfitStatsProcedure,
      recommendations: getOutfitRecommendationsProcedure,
    }),
  }),
  analytics: createTRPCRouter({
    overview: getWardrobeOverviewProcedure,
    categories: getCategoryBreakdownProcedure,
    colors: getColorBreakdownProcedure,
    brands: getBrandBreakdownProcedure,
    wear: getWearAnalyticsProcedure,
    purchases: getPurchaseAnalyticsProcedure,
    seasonal: getSeasonalAnalyticsProcedure,
    maintenance: getMaintenanceAnalyticsProcedure,
    dashboard: getAnalyticsDashboardProcedure,
  }),
  brands: createTRPCRouter({
    getAll: getBrandsProcedure,
    getById: getBrandProcedure,
    search: searchBrandsProcedure,
    getPopular: getPopularBrandsProcedure,
    getByCategory: getBrandsByCategoryProcedure,
    getByPriceRange: getBrandsByPriceRangeProcedure,
    add: addBrandProcedure,
    update: updateBrandProcedure,
    delete: deleteBrandProcedure,
    stats: getBrandStatsProcedure,
    suggestions: getBrandSuggestionsProcedure,
  }),
  plans: createTRPCRouter({
    add: addPlanProcedure,
    getByDate: getPlansByDateProcedure,
    getByDateRange: getPlansByDateRangeProcedure,
    update: updatePlanProcedure,
    delete: deletePlanProcedure,
    get: getPlanProcedure,
    getAll: getAllPlansProcedure,
  }),
});

export type AppRouter = typeof appRouter;