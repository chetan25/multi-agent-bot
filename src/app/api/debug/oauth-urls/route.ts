import { NextRequest, NextResponse } from "next/server";
import {
  getOAuthCallbackUrl,
  getBaseUrl,
  getHttpsConfig,
} from "@/lib/https-utils";

export async function GET(request: NextRequest) {
  const config = getHttpsConfig();

  return NextResponse.json({
    oauthCallbackUrl: getOAuthCallbackUrl(),
    baseUrl: getBaseUrl(),
    httpsConfig: config,
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      VERCEL_URL: process.env.VERCEL_URL,
      HTTPS: process.env.HTTPS,
      NEXT_PUBLIC_HTTPS: process.env.NEXT_PUBLIC_HTTPS,
    },
    request: {
      url: request.url,
      headers: Object.fromEntries(request.headers.entries()),
    },
  });
}
