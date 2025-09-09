import { trpcClient } from '@/lib/trpc';

export interface PlanData {
  outfitId?: string;
  name: string;
  category: 'casual' | 'formal' | 'work' | 'athletic' | 'evening' | 'special';
  items: string[];
  notes?: string;
  reminderEnabled?: boolean;
}

export interface User {
  id: string;
  // Add other user properties as needed
}

/**
 * Implements the requested JS script for saving outfit plans
 * @param selected - JS Date for the day the user tapped
 * @param outfitId - ID of the outfit to schedule
 * @param notes - Optional notes for the plan
 * @param user - User object with id
 * @param planData - Additional plan data
 */
export const savePlanToDatabase = async (
  selected: Date,
  outfitId: string,
  notes: string | undefined,
  user: User,
  planData: Omit<PlanData, 'outfitId' | 'notes'>
): Promise<void> => {
  // Convert selected date to ISO-like format as requested
  const ymd = selected.toLocaleDateString('en-CA'); // "2025-08-31" (safe ISO-like)
  
  try {
    await trpcClient.plans.add.mutate({
      date_ymd: ymd,
      outfit_id: outfitId,
      name: planData.name,
      category: planData.category,
      items: planData.items,
      notes,
      reminder_enabled: planData.reminderEnabled,
    });
    
    console.log(`Successfully saved plan for ${ymd}:`, {
      user_id: user.id,
      date_ymd: ymd,
      outfit_id: outfitId,
      notes
    });
  } catch (error) {
    console.error('Failed to save plan:', error);
    throw error;
  }
};

/**
 * Alternative implementation using the exact structure from your script
 * This mimics the supabase.from('plans').insert() pattern
 */
export const saveOutfitPlan = async (
  selected: Date,
  outfitId: string,
  notes: string | undefined,
  user: User,
  additionalData: {
    name: string;
    category: 'casual' | 'formal' | 'work' | 'athletic' | 'evening' | 'special';
    items: string[];
    reminderEnabled?: boolean;
  }
): Promise<void> => {
  // selected is a JS Date for the day the user tapped
  const ymd = selected.toLocaleDateString('en-CA'); // "2025-08-31" (safe ISO-like)
  
  // Equivalent to: await supabase.from('plans').insert({...})
  await trpcClient.plans.add.mutate({
    date_ymd: ymd,
    outfit_id: outfitId,
    name: additionalData.name,
    category: additionalData.category,
    items: additionalData.items,
    notes,
    reminder_enabled: additionalData.reminderEnabled,
  });
};

/**
 * Get plans for a specific date
 */
export const getPlansForDate = async (date: Date) => {
  const ymd = date.toLocaleDateString('en-CA');
  return await trpcClient.plans.getByDate.query({ date_ymd: ymd });
};

/**
 * Get plans for a date range (useful for calendar views)
 */
export const getPlansForDateRange = async (startDate: Date, endDate: Date) => {
  const startYmd = startDate.toLocaleDateString('en-CA');
  const endYmd = endDate.toLocaleDateString('en-CA');
  return await trpcClient.plans.getByDateRange.query({
    start_date: startYmd,
    end_date: endYmd,
  });
};

/**
 * Update an existing plan
 */
export const updatePlan = async (
  planId: string,
  updates: {
    name?: string;
    category?: 'casual' | 'formal' | 'work' | 'athletic' | 'evening' | 'special';
    items?: string[];
    notes?: string;
    reminderEnabled?: boolean;
  }
) => {
  return await trpcClient.plans.update.mutate({
    id: planId,
    ...updates,
    reminder_enabled: updates.reminderEnabled,
  });
};

/**
 * Delete a plan
 */
export const deletePlan = async (planId: string) => {
  return await trpcClient.plans.delete.mutate({ id: planId });
};

/**
 * Get all plans for the current user
 */
export const getAllPlans = async () => {
  return await trpcClient.plans.getAll.query();
};

/**
 * Implements the requested JS script for fetching plans by date
 * @param selected - JS Date for the day the user tapped
 * @param user - User object with id
 * @returns Array of plans for the specified date
 */
export const getPlansForSelectedDate = async (
  selected: Date,
  user: User
): Promise<any[]> => {
  // Convert selected date to ISO-like format as requested
  const ymd = selected.toLocaleDateString('en-CA'); // "2025-08-31" (safe ISO-like)
  
  try {
    // Equivalent to: const { data } = await supabase.from('plans').select('*').eq('user_id', user.id).eq('date_ymd', ymd).order('created_at', { ascending: true });
    const response = await trpcClient.plans.getByDate.query({ date_ymd: ymd });
    
    if (response.success) {
      // Sort by created_at ascending to match the supabase query
      const sortedPlans = response.plans.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      
      console.log(`Successfully fetched ${sortedPlans.length} plans for ${ymd}:`, sortedPlans);
      return sortedPlans;
    }
    
    return [];
  } catch (error) {
    console.error('Failed to fetch plans for date:', error);
    throw error;
  }
};

/**
 * Alternative implementation that returns the exact structure as supabase
 * This mimics the supabase query result format
 */
export const fetchPlansForDate = async (
  selected: Date,
  user: User
): Promise<{ data: any[] }> => {
  const ymd = selected.toLocaleDateString('en-CA');
  
  const response = await trpcClient.plans.getByDate.query({ date_ymd: ymd });
  
  if (response.success) {
    // Sort by created_at ascending to match supabase order
    const data = response.plans.sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    
    return { data };
  }
  
  return { data: [] };
};