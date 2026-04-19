import { useEffect, useState, type ReactNode } from "react";
import {
  DEFAULT_AUTH_STATE,
  type AuthState,
} from "../types/auth";
import {
  getCurrentUser,
  signIn as puterSignIn,
  signOut as puterSignOut,
} from "../../lib/puter.actino";
import { authContext } from "./auth-context";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>(DEFAULT_AUTH_STATE);

  // Write the auth context functions here.
  const refreshAuth = async () => {
    try {
      const user = await getCurrentUser();

      if (!user) {
        setAuthState(DEFAULT_AUTH_STATE);
        return false;
      }

      setAuthState({
        isSignedIn: true,
        userName: user.username ?? null,
        userId: user.uuid ?? null,
      });
      return true;
    } catch {
      setAuthState(DEFAULT_AUTH_STATE);
      return false;
    }
  };

  const signIn = async () => {
    await puterSignIn();
    return refreshAuth();
  };

  const signOut = async () => {
    await puterSignOut();
    setAuthState(DEFAULT_AUTH_STATE);
    return true;
  };

  useEffect(() => {
    let cancelled = false;

    const loadAuth = async () => {
      try {
        const user = await getCurrentUser();

        if (cancelled) {
          return;
        }

        if (!user) {
          setAuthState(DEFAULT_AUTH_STATE);
          return;
        }

        setAuthState({
          isSignedIn: true,
          userName: user.username ?? null,
          userId: user.uuid ?? null,
        });
      } catch {
        if (!cancelled) {
          setAuthState(DEFAULT_AUTH_STATE);
        }
      }
    };

    void loadAuth();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <authContext.Provider value={{ authState, refreshAuth, signIn, signOut }}>
      {children}
    </authContext.Provider>
  );
}
