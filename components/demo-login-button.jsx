"use client";

import { useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState } from "react";

const DEMO_EMAIL = "demo@bethere.com";
const DEMO_PASSWORD = "Demo@1234";

export default function DemoLoginButton() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDemoLogin = async () => {
    if (!isLoaded) return;

    setLoading(true);
    setError("");

    try {
      const result = await signIn.create({
        identifier: DEMO_EMAIL,
        password: DEMO_PASSWORD,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.push("/");
      }
    } catch (err) {
      console.error("Demo login failed:", err);
      setError(
        "Demo login failed. Please ensure the demo account exists in Clerk."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="demo-login-container">
      <div className="demo-login-card">
        {/* Decorative gradient border */}
        <div className="demo-card-glow" />

        <div className="demo-card-content">
          {/* Header */}
          <div className="demo-header">
            <div className="demo-badge">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
              <span>Quick Access</span>
            </div>
            <h3 className="demo-title">Demo Login</h3>
            <p className="demo-subtitle">
              Click below to instantly sign in with demo credentials
            </p>
          </div>

          {/* Credentials Display */}
          <div className="demo-credentials">
            <div className="demo-credential-row">
              <span className="demo-label">Email</span>
              <span className="demo-value">{DEMO_EMAIL}</span>
            </div>
            <div className="demo-divider" />
            <div className="demo-credential-row">
              <span className="demo-label">Password</span>
              <span className="demo-value">{DEMO_PASSWORD}</span>
            </div>
          </div>

          {/* Error message */}
          {error && <p className="demo-error">{error}</p>}

          {/* Button */}
          <button
            onClick={handleDemoLogin}
            disabled={loading || !isLoaded}
            className="demo-button"
          >
            {loading ? (
              <span className="demo-button-loading">
                <svg className="demo-spinner" viewBox="0 0 24 24">
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    strokeDasharray="31.4 31.4"
                    strokeLinecap="round"
                  />
                </svg>
                Signing in...
              </span>
            ) : (
              <span className="demo-button-content">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
                Sign in as Demo User
              </span>
            )}
          </button>
        </div>
      </div>

      <style jsx>{`
        .demo-login-container {
          width: 100%;
          max-width: 380px;
          margin-top: 1.5rem;
        }

        .demo-login-card {
          position: relative;
          border-radius: 16px;
          overflow: hidden;
        }

        .demo-card-glow {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            135deg,
            rgba(139, 92, 246, 0.3),
            rgba(236, 72, 153, 0.3),
            rgba(249, 115, 22, 0.3)
          );
          z-index: 0;
          animation: glowPulse 3s ease-in-out infinite;
        }

        @keyframes glowPulse {
          0%,
          100% {
            opacity: 0.6;
          }
          50% {
            opacity: 1;
          }
        }

        .demo-card-content {
          position: relative;
          z-index: 1;
          margin: 1px;
          background: rgba(15, 15, 20, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 15px;
          padding: 1.5rem;
        }

        .demo-header {
          text-align: center;
          margin-bottom: 1.25rem;
        }

        .demo-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          border-radius: 100px;
          background: linear-gradient(
            135deg,
            rgba(139, 92, 246, 0.15),
            rgba(236, 72, 153, 0.15)
          );
          border: 1px solid rgba(139, 92, 246, 0.25);
          color: rgb(196, 167, 255);
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 0.75rem;
        }

        .demo-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #fff;
          margin: 0 0 0.35rem 0;
          letter-spacing: -0.01em;
        }

        .demo-subtitle {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.45);
          margin: 0;
          line-height: 1.4;
        }

        .demo-credentials {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 0.75rem 1rem;
          margin-bottom: 1rem;
        }

        .demo-credential-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.4rem 0;
        }

        .demo-label {
          font-size: 0.75rem;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.4);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .demo-value {
          font-size: 0.85rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.9);
          font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;
        }

        .demo-divider {
          height: 1px;
          background: rgba(255, 255, 255, 0.06);
          margin: 0.25rem 0;
        }

        .demo-error {
          font-size: 0.78rem;
          color: #f87171;
          text-align: center;
          margin: 0 0 0.75rem 0;
          padding: 0.5rem;
          background: rgba(248, 113, 113, 0.08);
          border-radius: 8px;
          border: 1px solid rgba(248, 113, 113, 0.15);
        }

        .demo-button {
          width: 100%;
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 12px;
          background: linear-gradient(135deg, #8b5cf6, #ec4899, #f97316);
          color: white;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .demo-button::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.15),
            transparent
          );
          opacity: 0;
          transition: opacity 0.3s;
        }

        .demo-button:hover::before {
          opacity: 1;
        }

        .demo-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 30px rgba(139, 92, 246, 0.35),
            0 4px 15px rgba(236, 72, 153, 0.25);
        }

        .demo-button:active {
          transform: translateY(0);
        }

        .demo-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .demo-button-content,
        .demo-button-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .demo-spinner {
          width: 18px;
          height: 18px;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
