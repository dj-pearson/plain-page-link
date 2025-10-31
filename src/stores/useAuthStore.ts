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
      isLoading: false,
      error: null,

      initialize: async () => {
        set({ isLoading: true });
        
        try {
          // Get current session
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session?.user) {
            // Fetch profile
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
            
            // Fetch roles (prioritize admin)
            const { data: userRoles } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', session.user.id)
              .order('role', { ascending: true }); // 'admin' comes before 'user'
            
            const role = userRoles?.find(r => r.role === 'admin')?.role || userRoles?.[0]?.role || null;
            
            set({
              user: session.user,
              session,
              profile: profile || null,
              role: role,
              isLoading: false,
            });
          } else {
            set({ isLoading: false });
          }
        } catch (error: any) {
          console.error('Auth initialization error:', error);
          set({ isLoading: false, error: error.message });
        }

        // Set up auth state listener
        supabase.auth.onAuthStateChange((event, session) => {
          set({ session, user: session?.user ?? null });
          
          if (session?.user) {
            setTimeout(() => {
              const fetchUserData = async () => {
                const { data: profile } = await supabase
                  .from('profiles')
                  .select('*')
                  .eq('id', session.user.id)
                  .single();
                
                const { data: userRoles } = await supabase
                  .from('user_roles')
                  .select('role')
                  .eq('user_id', session.user.id)
                  .order('role', { ascending: true });
                
                const role = userRoles?.find(r => r.role === 'admin')?.role || userRoles?.[0]?.role || null;
                set({ profile: profile || null, role });
              };
              fetchUserData();
            }, 0);
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
        // Don't persist sensitive data, just let Supabase handle it
      }),
    }
  )
);
