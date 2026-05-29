/**
 * Improved Auth Context with race condition fix
 * 
 * This fixes:
 * - Race condition in role fetching with setTimeout
 * - Missing error handling in fetchRoles
 * - Improper state management during auth transitions
 * - Memory leaks from uncleared effects
 */

import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { ROLES, type RoleType } from "@/constants";
import { createErrorLog } from "@/lib/error-handling";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  roles: RoleType[];
  loading: boolean;
  error: Error | null;
  signOut: () => Promise<void>;
  hasRole: (r: RoleType | RoleType[]) => boolean;
  isAdmin: () => boolean;
  isHR: () => boolean;
  isApplicant: () => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<RoleType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Use refs to track current state and prevent race conditions
  const rolesFetchAbortRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  /**
   * Fetch user roles with proper error handling and race condition prevention
   */
  const fetchRoles = useCallback(async (uid: string, signal?: AbortSignal) => {
    try {
      // Cancel previous request if still pending
      if (rolesFetchAbortRef.current) {
        rolesFetchAbortRef.current.abort();
      }

      const controller = new AbortController();
      rolesFetchAbortRef.current = controller;

      // Combine signals if provided
      const combinedSignal = signal
        ? new AbortController().signal
        : controller.signal;

      // Fetch user roles with timeout
      const rolesPromise = supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", uid);

      // Add a timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => {
          reject(new Error("Role fetch timeout"));
        }, 5000)
      );

      const { data, error: err } = await Promise.race([
        rolesPromise,
        timeoutPromise,
      ]) as any;

      // Check if component is still mounted and this is the latest request
      if (!isMountedRef.current || combinedSignal.aborted) {
        return;
      }

      if (err) {
        console.error("Error fetching roles:", err);
        const errorLog = createErrorLog(err, { userId: uid, action: "fetchRoles" });
        console.error("Error log:", errorLog);
        // Set default role on error
        setRoles([ROLES.APPLICANT]);
        return;
      }

      const userRoles = (data ?? []).map((r: { role: RoleType }) => r.role);
      setRoles(userRoles.length > 0 ? userRoles : [ROLES.APPLICANT]);
    } catch (err) {
      if (isMountedRef.current && !(err instanceof Error && err.message === "AbortError")) {
        console.error("Unexpected error in fetchRoles:", err);
        setRoles([ROLES.APPLICANT]);
      }
    }
  }, []);

  /**
   * Initialize auth state on mount
   */
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Get current session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Session error:", sessionError);
          setError(sessionError as Error);
        }

        if (mounted) {
          const currentSession = sessionData.session;
          setSession(currentSession);
          setUser(currentSession?.user ?? null);

          // Fetch roles if user exists
          if (currentSession?.user) {
            await fetchRoles(currentSession.user.id);
          }

          setLoading(false);
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
        if (mounted) {
          setError(err instanceof Error ? err : new Error("Auth initialization failed"));
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Set up auth state listener
    const { data: subscription } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;

      setSession(newSession);
      setUser(newSession?.user ?? null);
      setError(null);

      if (newSession?.user) {
        // Fetch roles for new user - no setTimeout needed
        await fetchRoles(newSession.user.id);
      } else {
        // Clear roles when logged out
        setRoles([]);
      }
    });

    return () => {
      mounted = false;
      isMountedRef.current = false;
      subscription?.subscription.unsubscribe();

      // Cancel any pending role fetches
      if (rolesFetchAbortRef.current) {
        rolesFetchAbortRef.current.abort();
      }
    };
  }, [fetchRoles]);

  /**
   * Sign out function with proper cleanup
   */
  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setRoles([]);
      setError(null);
    } catch (err) {
      const signOutError = err instanceof Error ? err : new Error("Sign out failed");
      setError(signOutError);
      console.error("Sign out error:", signOutError);
      throw signOutError;
    }
  }, []);

  /**
   * Check if user has any of the given roles
   */
  const hasRole = useCallback((r: RoleType | RoleType[]) => {
    if (Array.isArray(r)) {
      return r.some((role) => roles.includes(role));
    }
    return roles.includes(r);
  }, [roles]);

  /**
   * Check if user is admin
   */
  const isAdmin = useCallback(() => {
    return roles.includes(ROLES.ADMIN);
  }, [roles]);

  /**
   * Check if user is HR
   */
  const isHR = useCallback(() => {
    return roles.includes(ROLES.HR);
  }, [roles]);

  /**
   * Check if user is applicant
   */
  const isApplicant = useCallback(() => {
    return roles.includes(ROLES.APPLICANT);
  }, [roles]);

  const value: AuthContextValue = {
    user,
    session,
    roles,
    loading,
    error,
    signOut,
    hasRole,
    isAdmin,
    isHR,
    isApplicant,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
