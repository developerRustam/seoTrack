import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { CLIENT_ORIGINS } from "./config.js";

export function createApp() {
  const app = express();

  app.use(express.json());
  app.use(cookieParser());
  app.set("trust proxy", 1);

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const normalizedOrigin = origin.replace(/\/$/, "");
        const isAllowed = CLIENT_ORIGINS.includes(normalizedOrigin);
        return callback(isAllowed ? null : new Error("Not allowed by CORS"), isAllowed);
      },
      credentials: true,
    })
  );

  return app;
}
