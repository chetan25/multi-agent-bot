#!/usr/bin/env node

const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

// Check if certificates exist
const certPath = path.join(process.cwd(), "certs", "localhost.pem");
const keyPath = path.join(process.cwd(), "certs", "localhost-key.pem");

const hasCustomCerts = fs.existsSync(certPath) && fs.existsSync(keyPath);

if (!hasCustomCerts) {
  console.log(
    "⚠️  Custom certificates not found. Using Next.js built-in HTTPS..."
  );
  console.log('💡 Run "npm run setup:https" to generate custom certificates');
}

// Start Next.js development server
const nextProcess = spawn("npx", ["next", "dev"], {
  stdio: "inherit",
  env: {
    ...process.env,
    NODE_ENV: "development",
  },
});

nextProcess.on("close", (code) => {
  console.log(`🚀 Development server exited with code ${code}`);
  process.exit(code);
});

process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down development server...");
  nextProcess.kill("SIGINT");
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Shutting down development server...");
  nextProcess.kill("SIGTERM");
});
