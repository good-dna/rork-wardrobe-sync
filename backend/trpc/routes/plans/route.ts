import { z } from 'zod';
import { protectedProcedure } from '../../create-context';
import { TRPCError } from '@trpc/server';

// Mock data store - replace with actual database
let mockPlans: Array<{
  id: string;
  user_id: string;
  date_ymd: string;
  outfit_id?: string;
  name: string;
  category: string;
  items: string[];
  notes?: string;
  reminder_enabled?: boolean;
  created_at: string;
  updated_at: string;
}> = [];

// Add outfit plan to calendar
export const addPlanProcedure = protectedProcedure
  .input(z.object({
    date_ymd: z.string(), // "2025-08-31" format
    outfit_id: z.string().optional(),
    name: z.string(),
    category: z.enum(['casual', 'formal', 'work', 'athletic', 'evening', 'special']),
    items: z.array(z.string()),
    notes: z.string().optional(),
    reminder_enabled: z.boolean().optional().default(false),
  }))
  .mutation(async ({ input }) => {
    try {
      const newPlan = {
        id: `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: 'mock_user_id', // Replace with actual user ID from context
        date_ymd: input.date_ymd,
        outfit_id: input.outfit_id,
        name: input.name,
        category: input.category,
        items: input.items,
        notes: input.notes,
        reminder_enabled: input.reminder_enabled,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockPlans.push(newPlan);
      console.log('Added plan:', newPlan);
      
      return {
        success: true,
        plan: newPlan,
      };
    } catch (error) {
      console.error('Error adding plan:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to add plan',
      });
    }
  });

// Get plans for a specific date
export const getPlansByDateProcedure = protectedProcedure
  .input(z.object({
    date_ymd: z.string(),
  }))
  .query(async ({ input }) => {
    try {
      const plans = mockPlans.filter(plan => 
        plan.user_id === 'mock_user_id' && plan.date_ymd === input.date_ymd
      );
      
      return {
        success: true,
        plans,
      };
    } catch (error) {
      console.error('Error getting plans by date:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get plans',
      });
    }
  });

// Get plans for a date range (for calendar view)
export const getPlansByDateRangeProcedure = protectedProcedure
  .input(z.object({
    start_date: z.string(),
    end_date: z.string(),
  }))
  .query(async ({ input }) => {
    try {
      const plans = mockPlans.filter(plan => 
        plan.user_id === 'mock_user_id' && 
        plan.date_ymd >= input.start_date && 
        plan.date_ymd <= input.end_date
      );
      
      return {
        success: true,
        plans,
      };
    } catch (error) {
      console.error('Error getting plans by date range:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get plans',
      });
    }
  });

// Update a plan
export const updatePlanProcedure = protectedProcedure
  .input(z.object({
    id: z.string(),
    name: z.string().optional(),
    category: z.enum(['casual', 'formal', 'work', 'athletic', 'evening', 'special']).optional(),
    items: z.array(z.string()).optional(),
    notes: z.string().optional(),
    reminder_enabled: z.boolean().optional(),
  }))
  .mutation(async ({ input }) => {
    try {
      const planIndex = mockPlans.findIndex(plan => 
        plan.id === input.id && plan.user_id === 'mock_user_id'
      );
      
      if (planIndex === -1) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Plan not found',
        });
      }
      
      const updatedPlan = {
        ...mockPlans[planIndex],
        ...input,
        updated_at: new Date().toISOString(),
      };
      
      mockPlans[planIndex] = updatedPlan;
      console.log('Updated plan:', updatedPlan);
      
      return {
        success: true,
        plan: updatedPlan,
      };
    } catch (error) {
      console.error('Error updating plan:', error);
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update plan',
      });
    }
  });

// Delete a plan
export const deletePlanProcedure = protectedProcedure
  .input(z.object({
    id: z.string(),
  }))
  .mutation(async ({ input }) => {
    try {
      const planIndex = mockPlans.findIndex(plan => 
        plan.id === input.id && plan.user_id === 'mock_user_id'
      );
      
      if (planIndex === -1) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Plan not found',
        });
      }
      
      const deletedPlan = mockPlans.splice(planIndex, 1)[0];
      console.log('Deleted plan:', deletedPlan);
      
      return {
        success: true,
        plan: deletedPlan,
      };
    } catch (error) {
      console.error('Error deleting plan:', error);
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete plan',
      });
    }
  });

// Get a specific plan by ID
export const getPlanProcedure = protectedProcedure
  .input(z.object({
    id: z.string(),
  }))
  .query(async ({ input }) => {
    try {
      const plan = mockPlans.find(plan => 
        plan.id === input.id && plan.user_id === 'mock_user_id'
      );
      
      if (!plan) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Plan not found',
        });
      }
      
      return {
        success: true,
        plan,
      };
    } catch (error) {
      console.error('Error getting plan:', error);
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get plan',
      });
    }
  });

// Get all plans for the user
export const getAllPlansProcedure = protectedProcedure
  .query(async () => {
    try {
      const plans = mockPlans.filter(plan => plan.user_id === 'mock_user_id');
      
      return {
        success: true,
        plans,
      };
    } catch (error) {
      console.error('Error getting all plans:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get plans',
      });
    }
  });