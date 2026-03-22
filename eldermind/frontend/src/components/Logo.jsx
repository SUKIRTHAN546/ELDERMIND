import React from 'react';
import logoUrl from '../assets/logo.png';

export default function Logo({ size = 48, layout = 'horizontal' }) {
  const isHorizontal = layout === 'horizontal';
  
  return (
    <div 
      style={{ 
        display: "flex", 
        flexDirection: isHorizontal ? "row" : "column", 
        alignItems: "center", 
        gap: isHorizontal ? "12px" : "8px" 
      }}
    >
      {/* ICON - Now strictly circular and properly clipped */}
      <div style={{ 
        width: size, 
        height: size, 
        borderRadius: "50%", 
        overflow: "hidden", 
        flexShrink: 0,
        boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#fff"
      }}>
        <img 
          src={logoUrl} 
          alt="ElderMind Logo" 
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover'
          }} 
        />
      </div>

      {/* TEXT */}
      <h1
        style={{
          fontSize: Math.max(20, size * (isHorizontal ? 0.45 : 0.35)) + "px",
          fontWeight: "800",
          color: "#1E3A8A", // Dark Navy
          margin: 0,
          letterSpacing: "-0.5px",
          fontFamily: "system-ui, -apple-system, sans-serif",
          whiteSpace: "nowrap"
        }}
      >
        Elder<span style={{ color: "#3B82F6" }}>Mind</span>
      </h1>
    </div>
  );
}