import { useState, useEffect, useCallback, useMemo } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { UserProfile, UserPreferences, UseEntityResult } from '@/types/data';
import { cacheService } from '@/services/cacheService';
import { syncService } from '@/services/syncService';
import { trpcClient } from '@/lib/trpc';

const DEMO_USER_ID = 'demo-user-1';

export const [DataProvider, useData] = createContextHook(() => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileIsSyncing, setProfileIsSyncing] = useState(false);
  const [profileIsDirty, setProfileIsDirty] = useState(false);
  
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [preferencesError, setPreferencesError] = useState<string | null>(null);
  const [preferencesIsSyncing, setPreferencesIsSyncing] = useState(false);
  const [preferencesIsDirty, setPreferencesIsDirty] = useState(false);

  useEffect(() => {
    const initializeData = async () => {
      try {
        const cachedProfile = await cacheService.get<UserProfile>(`profile:${DEMO_USER_ID}`);
        if (cachedProfile) {
          setProfile(cachedProfile);
        }
        
        const cachedPreferences = await cacheService.get<UserPreferences>(`preferences:${DEMO_USER_ID}`);
        if (cachedPreferences) {
          setPreferences(cachedPreferences);
        }
      } catch (error) {
        console.error('Failed to initialize data:', error);
      }
    };
    
    initializeData();
  }, []);

  const saveProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!profile) return;
    
    setProfileIsSyncing(true);
    setProfileError(null);
    
    try {
      const updatedProfile: UserProfile = {
        ...profile,
        ...updates,
        updatedAt: Date.now(),
        version: profile.version + 1,
      };
      
      setProfile(updatedProfile);
      setProfileIsDirty(false);
      
      await cacheService.set(`profile:${DEMO_USER_ID}`, updatedProfile);
      
      try {
        await trpcClient.profile.update.mutate(updatedProfile);
        
        console.log('Profile synced successfully');
      } catch (syncError) {
        console.error('Profile sync failed:', syncError);
        setProfileError('Failed to sync profile. Changes saved locally.');
        
        await syncService.queueOperation({
          type: 'update',
          entity: 'profile',
          entityId: DEMO_USER_ID,
          data: updatedProfile,
        });
      }
    } catch (error) {
      console.error('Failed to save profile:', error);
      setProfileError('Failed to save profile');
      
      if (profile) {
        setProfile(profile);
      }
    } finally {
      setProfileIsSyncing(false);
    }
  }, [profile]);

  const savePreferences = useCallback(async (updates: Partial<UserPreferences>) => {
    if (!preferences) return;
    
    setPreferencesIsSyncing(true);
    setPreferencesError(null);
    
    try {
      const updatedPreferences: UserPreferences = {
        ...preferences,
        ...updates,
        updatedAt: Date.now(),
        version: preferences.version + 1,
      };
      
      setPreferences(updatedPreferences);
      setPreferencesIsDirty(false);
      
      await cacheService.set(`preferences:${DEMO_USER_ID}`, updatedPreferences);
      
      try {
        await trpcClient.preferences.update.mutate(updatedPreferences);
        
        console.log('Preferences synced successfully');
      } catch (syncError) {
        console.error('Preferences sync failed:', syncError);
        setPreferencesError('Failed to sync preferences. Changes saved locally.');
        
        await syncService.queueOperation({
          type: 'update',
          entity: 'preferences',
          entityId: DEMO_USER_ID,
          data: updatedPreferences,
        });
      }
    } catch (error) {
      console.error('Failed to save preferences:', error);
      setPreferencesError('Failed to save preferences');
      
      if (preferences) {
        setPreferences(preferences);
      }
    } finally {
      setPreferencesIsSyncing(false);
    }
  }, [preferences]);

  const refetchProfile = useCallback(async () => {
    try {
      const serverProfile = await trpcClient.profile.get.query({ id: DEMO_USER_ID });
      if (serverProfile) {
        setProfile(serverProfile);
        await cacheService.set(`profile:${DEMO_USER_ID}`, serverProfile);
      }
    } catch (error) {
      console.error('Failed to refetch profile:', error);
    }
  }, []);

  const refetchPreferences = useCallback(async () => {
    try {
      const serverPreferences = await trpcClient.preferences.get.query({ id: DEMO_USER_ID });
      if (serverPreferences) {
        setPreferences(serverPreferences);
        await cacheService.set(`preferences:${DEMO_USER_ID}`, serverPreferences);
      }
    } catch (error) {
      console.error('Failed to refetch preferences:', error);
    }
  }, []);

  const profileResult: UseEntityResult<UserProfile> = useMemo(() => ({
    data: profile,
    save: saveProfile,
    isDirty: profileIsDirty,
    isSyncing: profileIsSyncing,
    error: profileError,
    refetch: refetchProfile,
  }), [profile, saveProfile, profileIsDirty, profileIsSyncing, profileError, refetchProfile]);

  const preferencesResult: UseEntityResult<UserPreferences> = useMemo(() => ({
    data: preferences,
    save: savePreferences,
    isDirty: preferencesIsDirty,
    isSyncing: preferencesIsSyncing,
    error: preferencesError,
    refetch: refetchPreferences,
  }), [preferences, savePreferences, preferencesIsDirty, preferencesIsSyncing, preferencesError, refetchPreferences]);

  return useMemo(() => ({
    profile: profileResult,
    preferences: preferencesResult,
  }), [profileResult, preferencesResult]);
});

export const useProfile = () => {
  const { profile } = useData();
  return profile;
};

export const usePreferences = () => {
  const { preferences } = useData();
  return preferences;
};