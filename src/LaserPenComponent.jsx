import React, { useRef, useEffect, useState } from "react";

export default function LaserPen({
  width = "100%",
  height = 400,
  enabled: enabledProp = false, // toggle button controlled
  color = "#ff2d55", // laser color
  lineWidth = 4.5, // thickness of stroke
  fadeSpeed = 0.03, // how quickly the trail fades
} = {}) {
  const containerRef = useRef(null);
  const trailRef = useRef(null);
  const rafRef = useRef(null);
  const delayBeforeFade = 1500; 
  let lastDrawTime = 0;

  const last = useRef({ x: 0, y: 0 });
  const drawing = useRef(false);
  const [enabled, setEnabled] = useState(enabledProp);

  // sync controlled prop if changed
  useEffect(() => setEnabled(enabledProp), [enabledProp]);

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
    const ctx = canvas.getContext("2d");
    resizeCanvas(canvas);

    const onResize = () => resizeCanvas(canvas);
    window.addEventListener("resize", onResize);

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.shadowColor = color;
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = "lighter";

    const fade = (time) => {
  // calculate time since last draw
  const elapsed = time - lastDrawTime;

  // only start fading after the delay has passed
  if (elapsed > delayBeforeFade) {
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = `rgba(0, 0, 0, ${fadeSpeed})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = "lighter";
  }

  rafRef.current = requestAnimationFrame(fade);
};
    fade();

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

      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      ctx.moveTo(last.current.x, last.current.y);
      ctx.lineTo(x, y);
      ctx.stroke();
      last.current = { x, y };
       lastDrawTime = performance.now();
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
      cancelAnimationFrame(rafRef.current);
    };
  }, [color, lineWidth, fadeSpeed, enabled]);

  return (
    <div className="w-full" style={{ width, background: "transparent" }}>
      <div
        ref={containerRef}
        className="relative bg-transparent rounded-md overflow-hidden"
        style={{ height, background: "transparent" }}
      >
        {/* canvas */}
        <canvas
          ref={trailRef}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            background: "transparent",
            cursor: "default",
          }}
        />

        {/* toggle button */}
        <div style={{ position: "absolute", left: 12, top: 12, zIndex: 40 }}>
          <button
            onClick={() => setEnabled((s) => !s)}
            style={{background:"#000000ce", color:"#fff", border:"none", padding:"10px", borderRadius:"5px"}}
            aria-pressed={enabled}
          >
            {enabled ? "Laser ON" : "Laser OFF"}
          </button>
        </div>
      </div>
    </div>
  );
}
