import { createContext, useContext, useState, useEffect } from "react";
import type { ApiUser } from "@/lib/api";

export type { ApiUser as User };

interface AuthContextType {
  user: ApiUser | null;
  token: string | null;
  isSignedIn: boolean;
  signIn: (user: ApiUser, token: string) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("smartattend_user");
    const savedToken = localStorage.getItem("smartattend_token");
    if (savedUser && savedToken) {
      try {
        setUser(JSON.parse(savedUser));
        setToken(savedToken);
        setIsSignedIn(true);
      } catch {
        localStorage.removeItem("smartattend_user");
        localStorage.removeItem("smartattend_token");
      }
    }
  }, []);

  const signIn = (newUser: ApiUser, newToken: string) => {
    setUser(newUser);
    setToken(newToken);
    setIsSignedIn(true);
    localStorage.setItem("smartattend_user", JSON.stringify(newUser));
    localStorage.setItem("smartattend_token", newToken);
  };

  const signOut = () => {
    setUser(null);
    setToken(null);
    setIsSignedIn(false);
    localStorage.removeItem("smartattend_user");
    localStorage.removeItem("smartattend_token");
  };

  return (
    <AuthContext.Provider value={{ user, token, isSignedIn, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
