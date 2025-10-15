import { GoogleConfig } from "@/services/common/types";


export const DEBUG_ON = false; // Set to false in production

export const RESET_ONBOARDING = false;

export const LOG_TRUNCATE_LIMIT = 500;

export const TOKEN_EXPIRY: number | null = null; // (in seconds) OR null to use expires_in from the OAuth call

export const googleConfig: GoogleConfig = {
  REDIRECT_URI: "com.caremapdemo.mygooglessoapp:/oauth2redirect",
  GOOGLE_IOS_CLIENT_ID: "8428479757-2uv68303sr7u2n1gqf0jcnr93tkdggto.apps.googleusercontent.com",
  GOOGLE_ANDROID_CLIENT_ID: "8428479757-koit87f26ulgm8cakiba05cbihv1rgg0.apps.googleusercontent.com",
};

export const SQLITE_DB_NAME = "caremap_db.db";