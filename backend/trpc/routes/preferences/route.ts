import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";
import { UserPreferences } from "@/types/data";

const weatherRuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  condition: z.object({
    type: z.enum(['temperature', 'precipitation', 'uv', 'humidity', 'wind']),
    operator: z.enum(['lt', 'gt', 'gte', 'lte', 'eq']),
    value: z.number(),
  }),
  recommendationTags: z.array(z.string()),
  enabled: z.boolean(),
});

const userPreferencesSchema = z.object({
  id: z.string(),
  uid: z.string(),
  notifications: z.object({
    outfitReminders: z.boolean(),
    weatherAlerts: z.boolean(),
    washingReminders: z.boolean(),
    newFeatures: z.boolean(),
  }),
  theme: z.enum(['light', 'dark', 'auto']),
  weatherFlags: z.object({
    rain: z.boolean(),
    wind: z.boolean(),
    uv: z.boolean(),
    humidity: z.boolean(),
    pollen: z.boolean(),
  }),
  rules: z.array(weatherRuleSchema),
  createdAt: z.number(),
  updatedAt: z.number(),
  version: z.number(),
  lastSyncedAt: z.number().optional(),
  isDirty: z.boolean().optional(),
  isDeleted: z.boolean().optional(),
});

// Mock storage - in a real app, this would be a database
const preferences = new Map<string, UserPreferences>();

export const getPreferences = publicProcedure
  .input(z.object({ id: z.string() }))
  .query(({ input }) => {
    return preferences.get(input.id) || null;
  });

export const updatePreferences = publicProcedure
  .input(userPreferencesSchema)
  .mutation(({ input }) => {
    const prefs: UserPreferences = {
      ...input,
      updatedAt: Date.now(),
      version: input.version + 1,
      lastSyncedAt: Date.now(),
      isDirty: false,
    };
    
    preferences.set(input.id, prefs);
    return prefs;
  });

export const deletePreferences = publicProcedure
  .input(z.object({ id: z.string() }))
  .mutation(({ input }) => {
    preferences.delete(input.id);
    return { success: true };
  });