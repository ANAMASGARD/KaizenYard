"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useFullscreen<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(document.fullscreenElement === ref.current);
    }

    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, []);

  const toggle = useCallback(async () => {
    const el = ref.current;
    if (!el) return;

    try {
      if (document.fullscreenElement === el) {
        await document.exitFullscreen();
      } else if (!document.fullscreenElement) {
        await el.requestFullscreen();
      } else {
        await document.exitFullscreen();
        await el.requestFullscreen();
      }
    } catch {
      // Browser blocked fullscreen — ignore.
    }
  }, []);

  const exit = useCallback(async () => {
    if (document.fullscreenElement === ref.current) {
      await document.exitFullscreen();
    }
  }, []);

  return { ref, isFullscreen, toggle, exit };
}
