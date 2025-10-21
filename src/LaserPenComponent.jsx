import React, { useRef, useEffect, useState } from "react";

export default function LaserPen({
  width = "100%",
  height = "100vh",
  enabled: enabledProp = false,
  color = "#ff2d55",
  lineWidth = 4.5,
  fadeSpeed = 0.05, // Increased from 0.03 for more complete fade
  delayBeforeFade = 1500,
} = {}) {
  const containerRef = useRef(null);
  const trailRef = useRef(null);
  const rafRef = useRef(null);
  const lastDrawTime = useRef(0); // ✅ Fixed: made it a ref instead of let
  const last = useRef({ x: 0, y: 0 });
  const drawing = useRef(false);
  const [enabled, setEnabled] = useState(enabledProp);

  // Sync controlled prop if changed
  useEffect(() => setEnabled(enabledProp), [enabledProp]);

  // Notify Electron about click-through state
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.setClickThrough(!enabled);
    }
  }, [enabled]);

  // Listen to Electron global shortcuts
  useEffect(() => {
    if (!window.electronAPI) return;

    const cleanupToggle = window.electronAPI.onToggleDrawing(() => {
      setEnabled((prev) => !prev);
    });

    const cleanupClear = window.electronAPI.onClearCanvas(() => {
      const canvas = trailRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    return () => {
      cleanupToggle();
      cleanupClear();
    };
  }, []);

  // Resize canvas to match display size
  function resizeCanvas(canvas) {
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext("2d");
      ctx.scale(dpr, dpr);
    }
  }

  // Setup drawing
  useEffect(() => {
    const canvas = trailRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    resizeCanvas(canvas);

    const onResize = () => resizeCanvas(canvas);
    window.addEventListener("resize", onResize);

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.shadowColor = color;
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = "source-over"; // Changed from "lighter" to avoid gaps

   const fade = (time) => {
  const elapsed = time - lastDrawTime.current;

  if (elapsed > delayBeforeFade) {
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = "rgba(0,0,0,0.1)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Hard clear every few frames to remove artifacts
    if (elapsed > delayBeforeFade + 1000) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    ctx.globalCompositeOperation = "source-over";
  }

  rafRef.current = requestAnimationFrame(fade);
};
    fade(performance.now());

    const onDown = (e) => {
      if (!enabled) return;
      drawing.current = true;
      const rect = canvas.getBoundingClientRect();
      last.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const onMove = (e) => {
      if (!drawing.current || !enabled) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Calculate distance for smoother lines
      const dx = x - last.current.x;
      const dy = y - last.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Interpolate points for smoother drawing
      const steps = Math.max(1, Math.floor(distance / 2));
      
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const ix = last.current.x + dx * t;
        const iy = last.current.y + dy * t;
        
        ctx.beginPath();
        ctx.arc(ix, iy, lineWidth / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = color;
      }

      last.current = { x, y };
      lastDrawTime.current = performance.now();
    };

    const onUp = () => (drawing.current = false);

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);

    return () => {
      window.removeEventListener("resize", onResize);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [color, lineWidth, fadeSpeed, enabled, delayBeforeFade]);

  const clearCanvas = () => {
    const canvas = trailRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div 
      className="w-full" 
      style={{ 
        width, 
        height,
        background: "transparent",
        position: "fixed",
        inset: 0,
        overflow: "hidden"
      }}
    >
      <div
        ref={containerRef}
        className="relative bg-transparent"
        style={{ 
          width: "100%",
          height: "100%",
          background: "transparent" 
        }}
      >
        {/* Canvas */}
        <canvas
          ref={trailRef}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            background: "transparent",
            cursor: enabled ? "crosshair" : "none",
            pointerEvents: enabled ? "auto" : "none",
          }}
        />

        {/* Control Panel */}
        <div style={{ 
          position: "absolute", 
          left: 12, 
          top: 12, 
          zIndex: 40,
          display: "flex",
          gap: "10px",
          alignItems: "center"
        }}>
          <button
            onClick={() => setEnabled((s) => !s)}
            style={{
              background: enabled ? "#22c55e" : "#000000ce",
              color: "#fff",
              border: "none",
              padding: "10px 16px",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "14px",
              transition: "all 0.2s",
              boxShadow: "0 2px 8px rgba(0,0,0,0.3)"
            }}
            aria-pressed={enabled}
          >
            {enabled ? "🔴 Laser ON" : "⚫ Laser OFF"}
          </button>

          {enabled && (
            <>
              <button
                onClick={clearCanvas}
                style={{
                  background: "#ef4444",
                  color: "#fff",
                  border: "none",
                  padding: "10px 16px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "14px",
                  transition: "all 0.2s",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.3)"
                }}
              >
                Clear
              </button>

              <div style={{
                background: "#000000ce",
                color: "#fff",
                padding: "8px 12px",
                borderRadius: "6px",
                fontSize: "12px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.3)"
              }}>
                Shortcuts: Ctrl+Shift+D (Toggle) | Ctrl+Shift+C (Clear) | Ctrl+Shift+Q (Quit)
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}