"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "./useReducedMotion";

const TILE_SIZE = 180;
const FPS = 12;

/**
 * Subtle animated film grain across the whole site. Draws low-resolution
 * noise to a small canvas and lets the browser upscale it, which is cheap
 * and reads as grain rather than a blurry texture.
 */
export function GrainOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    canvas.width = TILE_SIZE;
    canvas.height = TILE_SIZE;

    function draw() {
      const imageData = ctx!.createImageData(TILE_SIZE, TILE_SIZE);
      const buffer = imageData.data;
      for (let i = 0; i < buffer.length; i += 4) {
        const value = Math.random() * 255;
        buffer[i] = value;
        buffer[i + 1] = value;
        buffer[i + 2] = value;
        buffer[i + 3] = 22;
      }
      ctx!.putImageData(imageData, 0, 0);
    }

    draw();
    if (reducedMotion) return;

    let frameId: number;
    let lastDraw = 0;

    function loop(time: number) {
      frameId = requestAnimationFrame(loop);
      if (document.hidden) return;
      if (time - lastDraw < 1000 / FPS) return;
      lastDraw = time;
      draw();
    }

    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[70] h-full w-full opacity-[0.06] mix-blend-screen"
      style={{ imageRendering: "pixelated" }}
    />
  );
}
