
import type { AuthUser } from "./auth.ts";

declare module "express-serve-static-core" {
    interface Request {
      user?: AuthUser;
    }
  }