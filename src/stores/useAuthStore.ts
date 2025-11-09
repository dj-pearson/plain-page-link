import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import type { Profile, AppRole } from '@/types/database';

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  initialize: () => Promise<void>;
  signUp: (email: string, password: string, username: string, fullName?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      profile: null,
      role: null,
      isLoading: true,
      error: null,

      initialize: async () => {
        // Check if we already have a valid session from Supabase storage
        // This prevents unnecessary loading states on reload
        const existingSession = await supabase.auth.getSession();

        if (existingSession.data.session) {
          // We have a session, optimistically set user to reduce flicker
          set({
            user: existingSession.data.session.user,
            session: existingSession.data.session,
            isLoading: true, // Still loading profile/role data
          });
        } else {
          set({ isLoading: true });
        }

        try {
          // Get current session (this will also refresh if needed)
          const { data: { session } } = await supabase.auth.getSession();

          if (session?.user) {
            // Fetch profile and roles in parallel for better performance
            const [profileResult, rolesResult] = await Promise.all([
              supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single(),
              supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', session.user.id)
                .order('role', { ascending: true })
            ]);

            const role = rolesResult.data?.find(r => r.role === 'admin')?.role || rolesResult.data?.[0]?.role || null;

            set({
              user: session.user,
              session,
              profile: profileResult.data || null,
              role: role,
              isLoading: false,
            });
          } else {
            set({
              user: null,
              session: null,
              profile: null,
              role: null,
              isLoading: false
            });
          }
        } catch (error: any) {
          console.error('Auth initialization error:', error);
          set({
            user: null,
            session: null,
            profile: null,
            role: null,
            isLoading: false,
            error: error.message
          });
        }

        // Set up auth state listener for session changes
        supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('Auth state change:', event, session?.user?.id);

          if (event === 'SIGNED_OUT') {
            set({
              session: null,
              user: null,
              profile: null,
              role: null
            });
            return;
          }

          if (event === 'TOKEN_REFRESHED') {
            set({ session, user: session?.user ?? null });
            return;
          }

          set({ session, user: session?.user ?? null });

          if (session?.user) {
            // Fetch user data for new sessions or sign-ins
            try {
              const [profileResult, rolesResult] = await Promise.all([
                supabase
                  .from('profiles')
                  .select('*')
                  .eq('id', session.user.id)
                  .single(),
                supabase
                  .from('user_roles')
                  .select('role')
                  .eq('user_id', session.user.id)
                  .order('role', { ascending: true })
              ]);

              const role = rolesResult.data?.find(r => r.role === 'admin')?.role || rolesResult.data?.[0]?.role || null;
              set({ profile: profileResult.data || null, role });
            } catch (error) {
              console.error('Error fetching user data in auth state listener:', error);
            }
          } else {
            set({ profile: null, role: null });
          }
        });
      },

      signUp: async (email: string, password: string, username: string, fullName?: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                username,
                full_name: fullName || '',
              },
              emailRedirectTo: `${window.location.origin}/`,
            },
          });
          
          if (error) throw error;
          
          set({
            user: data.user,
            session: data.session,
            isLoading: false,
          });
        } catch (error: any) {
          set({
            error: error.message,
            isLoading: false,
          });
          throw error;
        }
      },

      signIn: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          
          if (error) throw error;
          
          // Fetch profile and role
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();
          
          const { data: userRoles } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', data.user.id)
            .order('role', { ascending: true });
          
          const role = userRoles?.find(r => r.role === 'admin')?.role || userRoles?.[0]?.role || null;
          
          set({
            user: data.user,
            session: data.session,
            profile: profile || null,
            role: role,
            isLoading: false,
          });
        } catch (error: any) {
          set({
            error: error.message,
            isLoading: false,
          });
          throw error;
        }
      },

      signOut: async () => {
        set({ isLoading: true });
        
        try {
          await supabase.auth.signOut();
          set({
            user: null,
            session: null,
            profile: null,
            role: null,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          console.error('Sign out error:', error);
          set({ isLoading: false });
        }
      },

      updateProfile: async (updates: Partial<Profile>) => {
        const { user } = get();
        if (!user) throw new Error('Not authenticated');
        
        set({ isLoading: true, error: null });
        
        try {
          const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', user.id)
            .select()
            .single();
          
          if (error) throw error;
          
          set({
            profile: data,
            isLoading: false,
          });
        } catch (error: any) {
          set({
            error: error.message,
            isLoading: false,
          });
          throw error;
        }
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        // Only persist non-sensitive metadata for faster initial load
        // Supabase handles actual session/token storage
        profile: state.profile,
        role: state.role,
      }),
    }
  )
);
