import { z } from 'zod';
import { publicProcedure, protectedProcedure } from '../../create-context';
import { supabase } from '../../../../lib/supabase';
import { TRPCError } from '@trpc/server';

// Input validation schemas
const signUpSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.string().optional(),
  phoneNumber: z.string().optional(),
});

const signInSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
});

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  dateOfBirth: z.string().optional(),
  phoneNumber: z.string().optional(),
  avatar: z.string().url().optional(),
});

const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
  email: z.string().email('Invalid email format'),
});

// Sign up new user
export const signUpProcedure = publicProcedure
  .input(signUpSchema)
  .mutation(async ({ input }) => {
    try {
      console.log('Creating new user account:', input.email);
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          data: {
            first_name: input.firstName,
            last_name: input.lastName,
            date_of_birth: input.dateOfBirth,
            phone_number: input.phoneNumber,
          }
        }
      });

      if (authError) {
        console.error('Auth signup error:', authError);
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: authError.message,
        });
      }

      if (!authData.user) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create user account',
        });
      }

      // Create user profile in profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: input.email,
          first_name: input.firstName,
          last_name: input.lastName,
          date_of_birth: input.dateOfBirth,
          phone_number: input.phoneNumber,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // Don't throw error here as auth user was created successfully
      }

      console.log('User account created successfully:', authData.user.id);
      
      return {
        success: true,
        user: {
          id: authData.user.id,
          email: authData.user.email,
          emailConfirmed: authData.user.email_confirmed_at !== null,
          firstName: input.firstName,
          lastName: input.lastName,
        },
        session: authData.session,
        message: 'Account created successfully. Please check your email to verify your account.',
      };
    } catch (error) {
      console.error('Signup error:', error);
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create account',
      });
    }
  });

// Sign in user
export const signInProcedure = publicProcedure
  .input(signInSchema)
  .mutation(async ({ input }) => {
    try {
      console.log('User signing in:', input.email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: input.email,
        password: input.password,
      });

      if (error) {
        console.error('Auth signin error:', error);
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: error.message,
        });
      }

      if (!data.user || !data.session) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid credentials',
        });
      }

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      console.log('User signed in successfully:', data.user.id);
      
      return {
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email,
          emailConfirmed: data.user.email_confirmed_at !== null,
          firstName: profile?.first_name,
          lastName: profile?.last_name,
          avatar: profile?.avatar,
        },
        session: data.session,
        message: 'Signed in successfully',
      };
    } catch (error) {
      console.error('Signin error:', error);
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to sign in',
      });
    }
  });

// Sign out user
export const signOutProcedure = protectedProcedure
  .mutation(async () => {
    try {
      console.log('User signing out');
      
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('Auth signout error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        });
      }

      console.log('User signed out successfully');
      
      return {
        success: true,
        message: 'Signed out successfully',
      };
    } catch (error) {
      console.error('Signout error:', error);
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to sign out',
      });
    }
  });

// Get current user
export const getCurrentUserProcedure = protectedProcedure
  .query(async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error) {
        console.error('Get user error:', error);
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: error.message,
        });
      }

      if (!user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        });
      }

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      return {
        id: user.id,
        email: user.email,
        emailConfirmed: user.email_confirmed_at !== null,
        firstName: profile?.first_name,
        lastName: profile?.last_name,
        dateOfBirth: profile?.date_of_birth,
        phoneNumber: profile?.phone_number,
        avatar: profile?.avatar,
        createdAt: profile?.created_at,
        updatedAt: profile?.updated_at,
      };
    } catch (error) {
      console.error('Get current user error:', error);
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get user information',
      });
    }
  });

// Reset password
export const resetPasswordProcedure = publicProcedure
  .input(resetPasswordSchema)
  .mutation(async ({ input }) => {
    try {
      console.log('Password reset requested for:', input.email);
      
      const { error } = await supabase.auth.resetPasswordForEmail(input.email, {
        redirectTo: 'https://your-app.com/reset-password',
      });

      if (error) {
        console.error('Password reset error:', error);
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error.message,
        });
      }

      console.log('Password reset email sent successfully');
      
      return {
        success: true,
        message: 'Password reset email sent. Please check your inbox.',
      };
    } catch (error) {
      console.error('Reset password error:', error);
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to send password reset email',
      });
    }
  });

// Update password
export const updatePasswordProcedure = protectedProcedure
  .input(updatePasswordSchema)
  .mutation(async ({ input }) => {
    try {
      console.log('Password update requested');
      
      // First verify current password by attempting to sign in
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.email) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        });
      }

      // Verify current password
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: input.currentPassword,
      });

      if (verifyError) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Current password is incorrect',
        });
      }

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: input.newPassword,
      });

      if (error) {
        console.error('Password update error:', error);
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error.message,
        });
      }

      console.log('Password updated successfully');
      
      return {
        success: true,
        message: 'Password updated successfully',
      };
    } catch (error) {
      console.error('Update password error:', error);
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update password',
      });
    }
  });

// Update user profile
export const updateUserProfileProcedure = protectedProcedure
  .input(updateProfileSchema)
  .mutation(async ({ input }) => {
    try {
      console.log('Profile update requested');
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        });
      }

      // Update profile in database
      const { data, error } = await supabase
        .from('profiles')
        .update({
          first_name: input.firstName,
          last_name: input.lastName,
          date_of_birth: input.dateOfBirth,
          phone_number: input.phoneNumber,
          avatar: input.avatar,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Profile update error:', error);
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error.message,
        });
      }

      // Update auth user metadata if needed
      if (input.firstName || input.lastName) {
        await supabase.auth.updateUser({
          data: {
            first_name: input.firstName,
            last_name: input.lastName,
          }
        });
      }

      console.log('Profile updated successfully');
      
      return {
        success: true,
        user: {
          id: data.id,
          email: data.email,
          firstName: data.first_name,
          lastName: data.last_name,
          dateOfBirth: data.date_of_birth,
          phoneNumber: data.phone_number,
          avatar: data.avatar,
          updatedAt: data.updated_at,
        },
        message: 'Profile updated successfully',
      };
    } catch (error) {
      console.error('Update profile error:', error);
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update profile',
      });
    }
  });

// Verify email
export const verifyEmailProcedure = publicProcedure
  .input(verifyEmailSchema)
  .mutation(async ({ input }) => {
    try {
      console.log('Email verification requested');
      
      const { data, error } = await supabase.auth.verifyOtp({
        email: input.email,
        token: input.token,
        type: 'signup'
      });

      if (error) {
        console.error('Email verification error:', error);
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error.message,
        });
      }

      console.log('Email verified successfully');
      
      return {
        success: true,
        user: data.user,
        session: data.session,
        message: 'Email verified successfully',
      };
    } catch (error) {
      console.error('Verify email error:', error);
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to verify email',
      });
    }
  });

// Resend verification email
export const resendVerificationProcedure = publicProcedure
  .input(z.object({ email: z.string().email() }))
  .mutation(async ({ input }) => {
    try {
      console.log('Resending verification email to:', input.email);
      
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: input.email,
      });

      if (error) {
        console.error('Resend verification error:', error);
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error.message,
        });
      }

      console.log('Verification email resent successfully');
      
      return {
        success: true,
        message: 'Verification email sent. Please check your inbox.',
      };
    } catch (error) {
      console.error('Resend verification error:', error);
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to resend verification email',
      });
    }
  });

// Delete user account
export const deleteAccountProcedure = protectedProcedure
  .input(z.object({ password: z.string().min(1, 'Password is required') }))
  .mutation(async ({ input }) => {
    try {
      console.log('Account deletion requested');
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.email) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        });
      }

      // Verify password before deletion
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: input.password,
      });

      if (verifyError) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Password is incorrect',
        });
      }

      // Delete user profile first
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      if (profileError) {
        console.error('Profile deletion error:', profileError);
      }

      // Delete auth user (this will cascade delete related data)
      const { error } = await supabase.auth.admin.deleteUser(user.id);

      if (error) {
        console.error('Account deletion error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        });
      }

      console.log('Account deleted successfully');
      
      return {
        success: true,
        message: 'Account deleted successfully',
      };
    } catch (error) {
      console.error('Delete account error:', error);
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete account',
      });
    }
  });

// Get user sessions
export const getUserSessionsProcedure = protectedProcedure
  .query(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Get session error:', error);
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: error.message,
        });
      }

      return {
        currentSession: session,
        isAuthenticated: !!session,
      };
    } catch (error) {
      console.error('Get sessions error:', error);
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get session information',
      });
    }
  });