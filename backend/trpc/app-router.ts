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
  }),
});

export type AppRouter = typeof appRouter;