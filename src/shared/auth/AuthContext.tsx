import { createContext } from "react";
import type { PublicUser } from "../types/auth";

export type AuthContextValue = {
  user: PublicUser | null;
  loading: boolean;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
