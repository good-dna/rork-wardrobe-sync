import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { trpc, trpcClient } from '@/lib/trpc';
import { User } from '@/services/planService';

export interface UsePlanOptions {
  date?: Date;
  startDate?: Date;
  endDate?: Date;
}

/**
 * Hook for managing outfit plans with React Query integration
 */
export const usePlans = (options: UsePlanOptions = {}) => {
  const queryClient = useQueryClient();
  
  // Get plans for a specific date
  const plansForDateQuery = useQuery({
    queryKey: ['plans', 'date', options.date?.toLocaleDateString('en-CA'), options.date],
    queryFn: () => {
      if (!options.date) return { success: true, plans: [] };
      const ymd = options.date.toLocaleDateString('en-CA');
      return trpcClient.plans.getByDate.query({ date_ymd: ymd });
    },
    enabled: !!options.date,
  });

  // Get plans for a date range
  const plansForRangeQuery = useQuery({
    queryKey: [
      'plans', 
      'range', 
      options.startDate?.toLocaleDateString('en-CA'),
      options.endDate?.toLocaleDateString('en-CA'),
      options.startDate,
      options.endDate
    ],
    queryFn: () => {
      if (!options.startDate || !options.endDate) return { success: true, plans: [] };
      const startYmd = options.startDate.toLocaleDateString('en-CA');
      const endYmd = options.endDate.toLocaleDateString('en-CA');
      return trpcClient.plans.getByDateRange.query({
        start_date: startYmd,
        end_date: endYmd,
      });
    },
    enabled: !!options.startDate && !!options.endDate,
  });

  // Get all plans
  const allPlansQuery = trpc.plans.getAll.useQuery();

  // Add plan mutation
  const addPlanMutation = useMutation({
    mutationFn: async (data: {
      selected: Date;
      outfitId?: string;
      name: string;
      category: 'casual' | 'formal' | 'work' | 'athletic' | 'evening' | 'special';
      items: string[];
      notes?: string;
      reminderEnabled?: boolean;
    }) => {
      // Implement the exact script as requested
      const ymd = data.selected.toLocaleDateString('en-CA'); // "2025-08-31" (safe ISO-like)
      
      return trpcClient.plans.add.mutate({
        date_ymd: ymd,
        outfit_id: data.outfitId,
        name: data.name,
        category: data.category,
        items: data.items,
        notes: data.notes,
        reminder_enabled: data.reminderEnabled,
      });
    },
    onSuccess: () => {
      // Invalidate and refetch plans
      queryClient.invalidateQueries({ queryKey: ['plans'] });
    },
  });

  // Update plan mutation
  const updatePlanMutation = useMutation({
    mutationFn: (data: {
      id: string;
      name?: string;
      category?: 'casual' | 'formal' | 'work' | 'athletic' | 'evening' | 'special';
      items?: string[];
      notes?: string;
      reminderEnabled?: boolean;
    }) => {
      return trpcClient.plans.update.mutate({
        id: data.id,
        name: data.name,
        category: data.category,
        items: data.items,
        notes: data.notes,
        reminder_enabled: data.reminderEnabled,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
    },
  });

  // Delete plan mutation
  const deletePlanMutation = useMutation({
    mutationFn: (planId: string) => {
      return trpcClient.plans.delete.mutate({ id: planId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
    },
  });

  /**
   * Convenience function that implements the exact requested script
   */
  const savePlan = async (
    selected: Date,
    outfitId: string,
    notes: string | undefined,
    user: User,
    planData: {
      name: string;
      category: 'casual' | 'formal' | 'work' | 'athletic' | 'evening' | 'special';
      items: string[];
      reminderEnabled?: boolean;
    }
  ) => {
    return addPlanMutation.mutateAsync({
      selected,
      outfitId,
      notes,
      ...planData,
    });
  };

  return {
    // Queries
    plansForDate: plansForDateQuery.data?.plans || [],
    plansForRange: plansForRangeQuery.data?.plans || [],
    allPlans: allPlansQuery.data?.plans || [],
    
    // Loading states
    isLoadingPlansForDate: plansForDateQuery.isLoading,
    isLoadingPlansForRange: plansForRangeQuery.isLoading,
    isLoadingAllPlans: allPlansQuery.isLoading,
    
    // Error states
    plansForDateError: plansForDateQuery.error,
    plansForRangeError: plansForRangeQuery.error,
    allPlansError: allPlansQuery.error,
    
    // Mutations
    addPlan: addPlanMutation.mutate,
    addPlanAsync: addPlanMutation.mutateAsync,
    updatePlan: updatePlanMutation.mutate,
    updatePlanAsync: updatePlanMutation.mutateAsync,
    deletePlan: deletePlanMutation.mutate,
    deletePlanAsync: deletePlanMutation.mutateAsync,
    
    // Mutation states
    isAddingPlan: addPlanMutation.isPending,
    isUpdatingPlan: updatePlanMutation.isPending,
    isDeletingPlan: deletePlanMutation.isPending,
    
    // Convenience function
    savePlan,
    
    // Refetch functions
    refetchPlansForDate: plansForDateQuery.refetch,
    refetchPlansForRange: plansForRangeQuery.refetch,
    refetchAllPlans: allPlansQuery.refetch,
  };
};

/**
 * Hook for a specific plan by ID
 */
export const usePlan = (planId: string) => {
  return trpc.plans.get.useQuery(
    { id: planId },
    { enabled: !!planId }
  );
};