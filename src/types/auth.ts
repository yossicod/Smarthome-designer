export interface AuthState {
  isSignedIn: boolean;
  userName: string | null;
  userId: string | null;
}

export type AuthContextValue = {
  authState: AuthState;
  refreshAuth: () => Promise<boolean>;
  signIn: () => Promise<boolean>;
  signOut: () => Promise<boolean>;
};

export const DEFAULT_AUTH_STATE: AuthState = {
  isSignedIn: false,
  userName: null,
  userId: null,
};
