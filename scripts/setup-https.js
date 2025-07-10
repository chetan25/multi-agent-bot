#!/usr/bin/env node

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🔐 Setting up HTTPS for local development...");

// Check if mkcert is installed
try {
  execSync("mkcert -version", { stdio: "ignore" });
  console.log("✅ mkcert is already installed");
} catch (error) {
  console.log("❌ mkcert is not installed");
  console.log("📦 Installing mkcert...");

  // Install mkcert based on platform
  if (process.platform === "win32") {
    console.log("Please install mkcert manually on Windows:");
    console.log(
      "1. Download from: https://github.com/FiloSottile/mkcert/releases"
    );
    console.log("2. Or use chocolatey: choco install mkcert");
    console.log("3. Or use winget: winget install FiloSottile.mkcert");
    process.exit(1);
  } else if (process.platform === "darwin") {
    execSync("brew install mkcert", { stdio: "inherit" });
  } else {
    execSync("sudo apt install mkcert", { stdio: "inherit" });
  }
}

// Create certificates directory
const certsDir = path.join(__dirname, "..", "certs");
if (!fs.existsSync(certsDir)) {
  fs.mkdirSync(certsDir, { recursive: true });
}

// Generate certificates
console.log("🔑 Generating local certificates...");
execSync(
  `mkcert -key-file ${path.join(
    certsDir,
    "localhost-key.pem"
  )} -cert-file ${path.join(
    certsDir,
    "localhost.pem"
  )} localhost 127.0.0.1 ::1`,
  {
    stdio: "inherit",
    cwd: certsDir,
  }
);

console.log("✅ HTTPS certificates generated successfully!");
console.log("📁 Certificates saved in:", certsDir);
console.log("");
console.log("🚀 To start the development server with HTTPS:");
console.log("   npm run dev:https");
console.log("   or");
console.log("   pnpm dev:https");
