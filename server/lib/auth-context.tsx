"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import type { UserRole } from "@/lib/sdk";
import { accountApi } from "./account-api";
import { auth } from "./firebase.client";

interface AuthContextValue {
  user: User | null;
  role: UserRole | null;
  isAdmin: boolean;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  role: null,
  isAdmin: false,
  loading: true,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  // Для якого uid уже запускали створення Ethora-акаунта в цій вкладці.
  const ethoraEnsuredFor = useRef<string | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u && ethoraEnsuredFor.current !== u.uid) {
        ethoraEnsuredFor.current = u.uid;
        // Після реєстрації/входу — створити акаунт в Ethora (сервер ідемпотентний).
        // Не блокує вхід: помилки лише логуються, спроба повториться при наступному вході.
        accountApi.ensureEthoraAccount().catch((err) => {
          ethoraEnsuredFor.current = null;
          console.warn("Не вдалося створити акаунт в Ethora:", err);
        });
      }
      if (u) {
        // Роль лежить у custom claim токена.
        const token = await u.getIdTokenResult();
        setRole(token.claims.role === "admin" ? "admin" : "user");
      } else {
        setRole(null);
      }
      setLoading(false);
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, role, isAdmin: role === "admin", loading, logout: () => signOut(auth) }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
