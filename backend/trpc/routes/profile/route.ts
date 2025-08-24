import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";
import { UserProfile } from "@/types/data";

const userProfileSchema = z.object({
  id: z.string(),
  uid: z.string(),
  displayName: z.string(),
  email: z.string().email(),
  photoURL: z.string().optional(),
  phone: z.string().optional(),
  location: z.object({
    city: z.string(),
    latitude: z.number(),
    longitude: z.number(),
    timezone: z.string(),
  }).optional(),
  units: z.enum(['imperial', 'metric']),
  createdAt: z.number(),
  updatedAt: z.number(),
  version: z.number(),
  lastSyncedAt: z.number().optional(),
  isDirty: z.boolean().optional(),
  isDeleted: z.boolean().optional(),
});

// Mock storage - in a real app, this would be a database
const profiles = new Map<string, UserProfile>();

export const getProfile = publicProcedure
  .input(z.object({ id: z.string() }))
  .query(({ input }) => {
    return profiles.get(input.id) || null;
  });

export const updateProfile = publicProcedure
  .input(userProfileSchema)
  .mutation(({ input }) => {
    const profile: UserProfile = {
      ...input,
      updatedAt: Date.now(),
      version: input.version + 1,
      lastSyncedAt: Date.now(),
      isDirty: false,
    };
    
    profiles.set(input.id, profile);
    return profile;
  });

export const deleteProfile = publicProcedure
  .input(z.object({ id: z.string() }))
  .mutation(({ input }) => {
    profiles.delete(input.id);
    return { success: true };
  });