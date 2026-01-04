/* eslint-disable react-hooks/rules-of-hooks */
import React from "react";
import { useNavigate } from "react-router-dom";
import { Trophy, Layout, Users } from "lucide-react";

const Home = () => {
  const navigate = useNavigate();

  const navButtons = [
    {
      path: "/control",
      text: "Control Panel",
      gradient: "linear-gradient(135deg, #3B82F6, #2563EB)",
      hoverGradient: "linear-gradient(135deg, #2563EB, #1D4ED8)",
      icon: Layout,
    },
    {
      path: "/scoreboard",
      text: "Scoreboard",
      gradient: "linear-gradient(135deg, #10B981, #059669)",
      hoverGradient: "linear-gradient(135deg, #059669, #047857)",
      icon: Trophy,
    },
    {
      path: "/players",
      text: "Manage Team",
      gradient: "linear-gradient(135deg, #F59E0B, #D97706)",
      hoverGradient: "linear-gradient(135deg, #D97706, #B45309)",
      icon: Users,
    },
    {
      path: "/lineup",
      text: "Line Up",
      gradient: "linear-gradient(135deg, #8B5CF6, #7C3AED)",
      hoverGradient: "linear-gradient(135deg, #7C3AED, #6D28D9)",
      icon: Layout,
    },
  ];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)",
        padding: "1rem",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "500px",
          padding: "clamp(2rem, 5vw, 3rem)",
          background: "rgba(255, 255, 255, 0.98)",
          borderRadius: "1.5rem",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          backdropFilter: "blur(10px)",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div
            style={{
              fontSize: "clamp(2.5rem, 8vw, 4rem)",
              marginBottom: "0.5rem",
            }}
          >
            🏐
          </div>
          <h1
            style={{
              fontSize: "clamp(1.75rem, 5vw, 2.25rem)",
              fontWeight: "bold",
              background: "linear-gradient(135deg, #3B82F6, #10B981)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              marginBottom: "0.5rem",
            }}
          >
            Volleyball Manager
          </h1>
          <p
            style={{
              fontSize: "clamp(0.875rem, 2vw, 1rem)",
              color: "#64748b",
            }}
          >
            Match Management System
          </p>
        </div>

        {/* Navigation Buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {navButtons.map(
            ({ path, text, gradient, hoverGradient, icon: Icon }) => {
              const [isHovered, setIsHovered] = React.useState(false);

              return (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                  style={{
                    width: "100%",
                    padding: "clamp(1rem, 3vw, 1.25rem)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: isHovered ? hoverGradient : gradient,
                    color: "white",
                    fontWeight: "600",
                    fontSize: "clamp(1rem, 2.5vw, 1.125rem)",
                    border: "none",
                    borderRadius: "1rem",
                    boxShadow: isHovered
                      ? "0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
                      : "0 10px 15px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                    cursor: "pointer",
                    transform: isHovered ? "translateY(-2px)" : "translateY(0)",
                    transition: "all 0.2s ease-in-out",
                    outline: "none",
                  }}
                >
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                    }}
                  >
                    <Icon
                      style={{
                        width: "clamp(1.25rem, 4vw, 1.5rem)",
                        height: "clamp(1.25rem, 4vw, 1.5rem)",
                        opacity: 0.9,
                      }}
                    />
                    {text}
                  </span>
                  <svg
                    style={{
                      width: "clamp(1.25rem, 4vw, 1.5rem)",
                      height: "clamp(1.25rem, 4vw, 1.5rem)",
                      transform: isHovered
                        ? "translateX(4px)"
                        : "translateX(0)",
                      transition: "transform 0.2s ease-in-out",
                    }}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              );
            }
          )}
        </div>

        {/* Feature Cards */}
        <div
          style={{
            marginTop: "2rem",
            padding: "1.5rem",
            background: "linear-gradient(135deg, #f1f5f9, #e2e8f0)",
            borderRadius: "1rem",
            border: "1px solid #e2e8f0",
          }}
        >
          <h3
            style={{
              fontSize: "clamp(1rem, 2.5vw, 1.125rem)",
              fontWeight: "600",
              color: "#334155",
              marginBottom: "1rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <span>✨</span>
            Features
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.75rem",
              fontSize: "clamp(0.813rem, 2vw, 0.875rem)",
              color: "#64748b",
            }}
          >
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <span style={{ fontSize: "1.25rem" }}>⚡</span>
              <span>Real-time Sync</span>
            </div>
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <span style={{ fontSize: "1.25rem" }}>⌨️</span>
              <span>Keyboard Support</span>
            </div>
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <span style={{ fontSize: "1.25rem" }}>📱</span>
              <span>Mobile Ready</span>
            </div>
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <span style={{ fontSize: "1.25rem" }}>🎨</span>
              <span>Custom Colors</span>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div
          style={{
            marginTop: "2rem",
            padding: "1rem",
            background: "rgba(59, 130, 246, 0.05)",
            borderRadius: "0.75rem",
            border: "1px solid rgba(59, 130, 246, 0.1)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "0.75rem",
              fontSize: "clamp(0.813rem, 2vw, 0.875rem)",
              color: "#475569",
            }}
          >
            <span style={{ fontSize: "1.25rem", flexShrink: 0 }}>💡</span>
            <div>
              <strong
                style={{
                  color: "#334155",
                  display: "block",
                  marginBottom: "0.25rem",
                }}
              >
                Quick Start:
              </strong>
              <span>
                Open <strong>Control Panel</strong> on one device and{" "}
                <strong>Scoreboard</strong> on another for the best experience.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Version Badge - Updated to "Created by Touch" */}
      <div
        style={{
          marginTop: "2rem",
          padding: "0.5rem 1.25rem",
          background: "rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(10px)",
          borderRadius: "9999px",
          fontSize: "clamp(0.75rem, 2vw, 0.875rem)",
          color: "rgba(255, 255, 255, 0.9)", // Increased opacity for better readability
          border: "1px solid rgba(255, 255, 255, 0.2)",
          fontWeight: "500",
          letterSpacing: "0.025em",
        }}
      >
        Created by{" "}
        <span style={{ color: "#60A5FA", fontWeight: "bold" }}>Touch</span>
      </div>
    </div>
  );
};

export default Home;
