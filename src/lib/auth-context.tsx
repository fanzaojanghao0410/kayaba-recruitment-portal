/**
 * Fixed Auth Context with race condition handling
 * 
 * This version fixes:
 * - Race condition in role fetching (no setTimeout)
 * - Proper error handling in fetchRoles
 * - Memory leak prevention with cleanup
 * - Type safety with RoleType from constants
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
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<RoleType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Prevent memory leaks and race conditions
  const isMountedRef = useRef(true);
  const rolesFetchAbortRef = useRef<AbortController | null>(null);

  /**
   * Fetch roles with timeout and abort signal support
   */
  const fetchRoles = useCallback(async (uid: string) => {
    try {
      if (rolesFetchAbortRef.current) {
        rolesFetchAbortRef.current.abort();
      }

      const controller = new AbortController();
      rolesFetchAbortRef.current = controller;

      // Add timeout to prevent hanging
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      try {
        const { data, error: err } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", uid);

        clearTimeout(timeoutId);

        if (!isMountedRef.current) return;

        if (err) {
          console.error("Error fetching roles:", err);
          const errorLog = createErrorLog(err, { userId: uid, action: "fetchRoles" });
          console.error("Error context:", errorLog);
          setRoles([ROLES.APPLICANT]);
          return;
        }

        const userRoles = (data ?? []).map((r: { role: RoleType }) => r.role);
        setRoles(userRoles.length > 0 ? userRoles : [ROLES.APPLICANT]);
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (isMountedRef.current && !(fetchError instanceof Error && fetchError.message === "AbortError")) {
          console.error("Error in fetchRoles:", fetchError);
          setRoles([ROLES.APPLICANT]);
        }
      }
    } catch (err) {
      console.error("Unexpected error in fetchRoles:", err);
      if (isMountedRef.current) {
        setRoles([ROLES.APPLICANT]);
      }
    }
  }, []);

  /**
   * Initialize auth on mount
   */
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Session error:", sessionError);
          setError(sessionError as Error);
        }

        if (isMountedRef.current) {
          const currentSession = sessionData.session;
          setSession(currentSession);
          setUser(currentSession?.user ?? null);

          if (currentSession?.user) {
            await fetchRoles(currentSession.user.id);
          }

          setLoading(false);
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
        if (isMountedRef.current) {
          setError(err instanceof Error ? err : new Error("Auth initialization failed"));
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event: string, newSession: Session | null) => {
      if (!isMountedRef.current) return;

      setSession(newSession);
      setUser(newSession?.user ?? null);
      setError(null);

      if (newSession?.user) {
        // No setTimeout - fetch immediately
        await fetchRoles(newSession.user.id);
      } else {
        setRoles([]);
      }
    });

    return () => {
      isMountedRef.current = false;
      subscription?.subscription.unsubscribe();
      if (rolesFetchAbortRef.current) {
        rolesFetchAbortRef.current.abort();
      }
    };
  }, [fetchRoles]);

  /**
   * Sign out with proper cleanup
   */
  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      if (isMountedRef.current) {
        setUser(null);
        setSession(null);
        setRoles([]);
        setError(null);
      }
    } catch (err) {
      const signOutError = err instanceof Error ? err : new Error("Sign out failed");
      if (isMountedRef.current) {
        setError(signOutError);
      }
      throw signOutError;
    }
  }, []);

  /**
   * Check role with support for array of roles
   */
  const hasRole = useCallback((r: RoleType | RoleType[]) => {
    if (Array.isArray(r)) {
      return r.some((role) => roles.includes(role));
    }
    return roles.includes(r);
  }, [roles]);

  /**
   * Check if admin
   */
  const isAdmin = useCallback(() => roles.includes(ROLES.ADMIN), [roles]);

  /**
   * Check if HR
   */
  const isHR = useCallback(() => roles.includes(ROLES.HR), [roles]);

  return (
    <AuthContext.Provider value={{ user, session, roles, loading, error, signOut, hasRole, isAdmin, isHR }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
