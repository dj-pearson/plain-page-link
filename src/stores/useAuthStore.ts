import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { generateSampleData } from '@/lib/sample-data-service';
import type { User, Session } from '@supabase/supabase-js';
import type { Profile, AppRole } from '@/types/database';

// Auth store with Google Sign-In support and Single Sign-Out (SLO)

// BroadcastChannel for cross-tab Single Sign-Out
const AUTH_CHANNEL_NAME = 'agentbio-auth-channel';
let authChannel: BroadcastChannel | null = null;

// Initialize BroadcastChannel if supported
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    authChannel = new BroadcastChannel(AUTH_CHANNEL_NAME);
  } catch (e) {
    logger.warn('BroadcastChannel not available for SLO');
  }
}

// SLO message types
interface SLOMessage {
  type: 'SIGN_OUT' | 'SESSION_REVOKED';
  timestamp: number;
  userId?: string;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null;
  isLoading: boolean;
  error: string | null;

  // MFA state
  requiresMFA: boolean;
  mfaVerified: boolean;

  // Actions
  initialize: () => Promise<void>;
  signUp: (email: string, password: string, username: string, fullName?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: (options?: { global?: boolean }) => Promise<void>;
  signOutAllDevices: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  clearError: () => void;
  setMFAVerified: (verified: boolean) => void;
  _handleSLOMessage: (message: SLOMessage) => void;
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
      requiresMFA: false,
      mfaVerified: false,

      initialize: async () => {
        const { _handleSLOMessage } = get();

        // Set up BroadcastChannel listener for Single Sign-Out (SLO)
        if (authChannel) {
          authChannel.onmessage = (event: MessageEvent<SLOMessage>) => {
            _handleSLOMessage(event.data);
          };
        }

        // Set up localStorage listener for SLO fallback (works in older browsers)
        if (typeof window !== 'undefined') {
          window.addEventListener('storage', (event) => {
            if (event.key === 'agentbio-logout' && event.newValue) {
              logger.debug('SLO: Received logout via localStorage event');
              _handleSLOMessage({
                type: 'SIGN_OUT',
                timestamp: parseInt(event.newValue, 10),
              });
            }
          });
        }

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
          logger.error('Auth initialization error', error);
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
          logger.authEvent(event, session?.user?.id);

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
              logger.error('Error fetching user data in auth state listener', error);
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

          // If user was created and we have a session, wait for profile to be created by DB trigger
          // The handle_new_user trigger creates the profile, but there's a race condition
          if (data.user && data.session) {
            let profile = null;
            let role = null;

            // Retry fetching profile with exponential backoff (trigger may not have completed yet)
            const maxRetries = 5;
            const baseDelay = 100; // Start with 100ms

            for (let attempt = 0; attempt < maxRetries; attempt++) {
              const [profileResult, rolesResult] = await Promise.all([
                supabase
                  .from('profiles')
                  .select('*')
                  .eq('id', data.user.id)
                  .single(),
                supabase
                  .from('user_roles')
                  .select('role')
                  .eq('user_id', data.user.id)
                  .order('role', { ascending: true })
              ]);

              if (profileResult.data) {
                profile = profileResult.data;
                role = rolesResult.data?.find(r => r.role === 'admin')?.role || rolesResult.data?.[0]?.role || null;
                break;
              }

              // Wait before retrying (exponential backoff: 100ms, 200ms, 400ms, 800ms, 1600ms)
              if (attempt < maxRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, baseDelay * Math.pow(2, attempt)));
              }
            }

            set({
              user: data.user,
              session: data.session,
              profile,
              role,
              isLoading: false,
            });

            // Generate sample data for new users (runs in background)
            // This provides demo content to help users visualize their profile
            if (profile) {
              generateSampleData(data.user.id).catch(error => {
                logger.error('Failed to generate sample data for new user', error);
                // Don't throw - sample data is non-critical
              });
            }
          } else {
            // Email confirmation required - no session yet
            set({
              user: data.user,
              session: data.session,
              isLoading: false,
            });
          }
        } catch (error: any) {
          set({
            error: error.message,
            isLoading: false,
          });
          throw error;
        }
      },

      signIn: async (email: string, password: string) => {
        set({ isLoading: true, error: null, requiresMFA: false, mfaVerified: false });

        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) throw error;

          // Fetch profile, roles, and MFA settings in parallel for better performance
          const [profileResult, rolesResult, mfaResult] = await Promise.all([
            supabase
              .from('profiles')
              .select('*')
              .eq('id', data.user.id)
              .single(),
            supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', data.user.id)
              .order('role', { ascending: true }),
            supabase
              .from('user_mfa_settings')
              .select('mfa_enabled, verified_at')
              .eq('user_id', data.user.id)
              .maybeSingle()
          ]);

          const role = rolesResult.data?.find(r => r.role === 'admin')?.role || rolesResult.data?.[0]?.role || null;

          // Check if MFA is enabled and verified for this user
          const mfaEnabled = mfaResult.data?.mfa_enabled && mfaResult.data?.verified_at;

          if (mfaEnabled) {
            // User has MFA enabled - require verification before granting full access
            // Note: The user will need to be redirected to MFA verification page
            set({
              user: data.user,
              session: data.session,
              profile: profileResult.data || null,
              role: role,
              isLoading: false,
              requiresMFA: true,
              mfaVerified: false,
            });
          } else {
            // No MFA required - grant full access
            set({
              user: data.user,
              session: data.session,
              profile: profileResult.data || null,
              role: role,
              isLoading: false,
              requiresMFA: false,
              mfaVerified: true,
            });
          }
        } catch (error: any) {
          set({
            error: error.message,
            isLoading: false,
          });
          throw error;
        }
      },

      signInWithGoogle: async () => {
        set({ isLoading: true, error: null });

        try {
          // Use oauth-proxy edge function to bypass GOTRUE_SITE_URL limitation
          // Flow: Frontend → oauth-proxy → Google → oauth-proxy callback → /auth/callback
          const functionsUrl = import.meta.env.VITE_FUNCTIONS_URL;
          const lastRoute = localStorage.getItem('lastVisitedRoute') || '/dashboard';

          if (functionsUrl) {
            // Self-hosted: use oauth-proxy edge function
            const oauthUrl = `${functionsUrl}/oauth-proxy?action=authorize&provider=google&redirect_to=${encodeURIComponent(lastRoute)}`;
            window.location.href = oauthUrl;
          } else {
            // Fallback: use standard Supabase OAuth (for hosted Supabase)
            const callbackUrl = `${window.location.origin}/auth/callback`;
            const { error } = await supabase.auth.signInWithOAuth({
              provider: 'google',
              options: {
                redirectTo: callbackUrl,
                queryParams: {
                  access_type: 'offline',
                  prompt: 'consent',
                },
              },
            });
            if (error) throw error;
          }

          set({ isLoading: false });
        } catch (error: any) {
          set({
            error: error.message,
            isLoading: false,
          });
          throw error;
        }
      },

      signInWithApple: async () => {
        set({ isLoading: true, error: null });

        try {
          // Use oauth-proxy edge function to bypass GOTRUE_SITE_URL limitation
          const functionsUrl = import.meta.env.VITE_FUNCTIONS_URL;
          const lastRoute = localStorage.getItem('lastVisitedRoute') || '/dashboard';

          if (functionsUrl) {
            // Self-hosted: use oauth-proxy edge function
            const oauthUrl = `${functionsUrl}/oauth-proxy?action=authorize&provider=apple&redirect_to=${encodeURIComponent(lastRoute)}`;
            window.location.href = oauthUrl;
          } else {
            // Fallback: use standard Supabase OAuth (for hosted Supabase)
            const callbackUrl = `${window.location.origin}/auth/callback`;
            const { error } = await supabase.auth.signInWithOAuth({
              provider: 'apple',
              options: {
                redirectTo: callbackUrl,
              },
            });
            if (error) throw error;
          }

          set({ isLoading: false });
        } catch (error: any) {
          set({
            error: error.message,
            isLoading: false,
          });
          throw error;
        }
      },

      signOut: async (options?: { global?: boolean }) => {
        const { user } = get();
        set({ isLoading: true });

        try {
          // Sign out from Supabase (optionally from all devices)
          await supabase.auth.signOut({ scope: options?.global ? 'global' : 'local' });

          // Broadcast logout event to other tabs via BroadcastChannel
          if (authChannel) {
            const message: SLOMessage = {
              type: 'SIGN_OUT',
              timestamp: Date.now(),
              userId: user?.id,
            };
            authChannel.postMessage(message);
          }

          // Also use localStorage event for fallback cross-tab sync
          // This works even if BroadcastChannel is not supported
          localStorage.setItem('agentbio-logout', Date.now().toString());
          localStorage.removeItem('agentbio-logout');

          set({
            user: null,
            session: null,
            profile: null,
            role: null,
            isLoading: false,
            error: null,
            requiresMFA: false,
            mfaVerified: false,
          });
        } catch (error: any) {
          logger.error('Sign out error', error);
          set({ isLoading: false });
        }
      },

      signOutAllDevices: async () => {
        const { user } = get();
        set({ isLoading: true });

        try {
          // Sign out from all devices using Supabase global scope
          await supabase.auth.signOut({ scope: 'global' });

          // Broadcast logout event to other tabs
          if (authChannel) {
            const message: SLOMessage = {
              type: 'SIGN_OUT',
              timestamp: Date.now(),
              userId: user?.id,
            };
            authChannel.postMessage(message);
          }

          // Fallback localStorage event
          localStorage.setItem('agentbio-logout', Date.now().toString());
          localStorage.removeItem('agentbio-logout');

          set({
            user: null,
            session: null,
            profile: null,
            role: null,
            isLoading: false,
            error: null,
            requiresMFA: false,
            mfaVerified: false,
          });
        } catch (error: any) {
          logger.error('Sign out all devices error', error);
          set({ isLoading: false });
        }
      },

      _handleSLOMessage: (message: SLOMessage) => {
        const { user } = get();

        // Only handle if we have a session and message is for our user or all users
        if (user && (message.userId === user.id || !message.userId)) {
          logger.debug('SLO: Received logout broadcast from another tab');
          // Clear local state without re-calling Supabase signOut
          // to avoid infinite broadcast loop
          set({
            user: null,
            session: null,
            profile: null,
            role: null,
            isLoading: false,
            error: null,
            requiresMFA: false,
            mfaVerified: false,
          });
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

      setMFAVerified: (verified: boolean) => {
        set({
          mfaVerified: verified,
          requiresMFA: !verified,
        });
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
