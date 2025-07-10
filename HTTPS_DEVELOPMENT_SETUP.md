# HTTPS Development Setup

This guide explains how to set up HTTPS for local development of your Next.js application.

## 🚀 Quick Start

### Option 1: Built-in HTTPS (Simplest)

```bash
npm run dev:https
# or
pnpm dev:https
```

### Option 2: Custom Certificates (More Secure)

```bash
# 1. Install mkcert (if not already installed)
npm run setup:https

# 2. Start development server
npm run dev
```

## 📋 Prerequisites

### For Custom Certificates (Recommended)

1. **Install mkcert**:

   - **Windows**: Download from [mkcert releases](https://github.com/FiloSottile/mkcert/releases) or use:
     ```bash
     choco install mkcert
     # or
     winget install FiloSottile.mkcert
     ```
   - **macOS**: `brew install mkcert`
   - **Linux**: `sudo apt install mkcert`

2. **Trust the CA**:
   ```bash
   mkcert -install
   ```

## 🔧 Setup Instructions

### Step 1: Generate Certificates

```bash
npm run setup:https
```

This will:

- Check if mkcert is installed
- Create a `certs/` directory
- Generate certificates for `localhost`, `127.0.0.1`, and `::1`

### Step 2: Start Development Server

```bash
npm run dev
```

The server will automatically use HTTPS with your custom certificates.

## 🌐 Accessing Your App

Once the server is running, you can access your app at:

- **HTTPS**: `https://localhost:3000`
- **HTTP**: `http://localhost:3000` (fallback)

## 🔒 Security Benefits

### Custom Certificates (mkcert)

- ✅ **Trusted by browsers** - No security warnings
- ✅ **Valid for localhost** - Proper certificate validation
- ✅ **Secure development** - Real HTTPS behavior
- ✅ **API compatibility** - Works with OAuth and other HTTPS-required services

### Built-in HTTPS

- ⚠️ **Browser warnings** - Self-signed certificate warnings
- ✅ **Basic HTTPS** - Encrypted communication
- ✅ **Quick setup** - No additional tools required

## 🛠️ Configuration

### Next.js Config

The `next.config.ts` file is configured to:

- Use custom certificates if available
- Fall back to built-in HTTPS if certificates are missing
- Only enable HTTPS in development mode

### Environment Variables

No additional environment variables are required for HTTPS setup.

## 🔍 Troubleshooting

### Certificate Issues

```bash
# Regenerate certificates
rm -rf certs/
npm run setup:https
```

### Port Issues

If port 3000 is in use, Next.js will automatically try the next available port.

### Browser Security Warnings

- **Custom certificates**: Should work without warnings
- **Built-in HTTPS**: Accept the security warning in your browser

### OAuth/API Issues

Some services require HTTPS for OAuth callbacks. Custom certificates solve this.

## 📁 File Structure

```
multi-modal-chatbot/
├── certs/                    # Generated certificates (gitignored)
│   ├── localhost.pem        # Certificate file
│   └── localhost-key.pem    # Private key file
├── scripts/
│   ├── setup-https.js       # Certificate generation script
│   └── dev-server.js        # Custom development server
├── next.config.ts           # HTTPS configuration
└── package.json             # HTTPS scripts
```

## 🎯 Use Cases

### Required for:

- OAuth authentication (Google, GitHub, etc.)
- Service Workers
- WebRTC
- Secure cookies
- Some browser APIs

### Recommended for:

- General development
- Testing HTTPS-specific features
- Production-like environment

## 🔄 Scripts Reference

| Script                | Description                                    |
| --------------------- | ---------------------------------------------- |
| `npm run dev`         | Start development server (HTTPS if configured) |
| `npm run dev:https`   | Force HTTPS with built-in certificates         |
| `npm run setup:https` | Generate custom certificates                   |

## 🚨 Important Notes

1. **Certificates are local** - Only work on your machine
2. **Git ignored** - Certificates are not committed to version control
3. **Development only** - This setup is for local development only
4. **Browser trust** - Custom certificates need to be trusted by your browser

## 🔗 Related Documentation

- [Next.js HTTPS Configuration](https://nextjs.org/docs/app/building-your-application/configuring)
- [mkcert Documentation](https://github.com/FiloSottile/mkcert)
- [OAuth with HTTPS](https://developers.google.com/identity/protocols/oauth2)
