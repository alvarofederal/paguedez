import type { NextConfig } from "next";
import path from "path";

// Em git worktree, node_modules fica na raiz do projeto (3 níveis acima de .claude/worktrees/<name>)
const projectRoot = __dirname.includes(".claude") && __dirname.includes("worktrees")
  ? path.resolve(__dirname, "../../..")
  : __dirname

const nextConfig: NextConfig = {
  outputFileTracingRoot: projectRoot,

  // ✅ Headers de segurança HTTP (OWASP A05)
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "font-src 'self'",
              "img-src 'self' data: blob:",
              "connect-src 'self'",
              // canvas-confetti desenha os confetes num Web Worker criado a partir de blob:
              "worker-src 'self' blob:",
              "base-uri 'self'",
              "form-action 'self'",
              "upgrade-insecure-requests",
            ].join("; "),
          },
        ],
      },
    ]
  },

  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;
