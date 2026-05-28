"use client";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";

/**
 * usePageAnimation — attaches a GSAP entrance timeline to the ref container.
 * Call `animate()` inside useEffect on mount.
 */
export function usePageAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      // Fade in all [data-animate] children staggered
      gsap.fromTo(
        "[data-animate]",
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.55,
          stagger: 0.08,
          ease: "power2.out",
          clearProps: "transform",
        }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return containerRef;
}

/**
 * useSidebarAnimation — staggers sidebar nav links in from the left.
 */
export function useSidebarAnimation() {
  const sidebarRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!sidebarRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-sidebar-item]",
        { opacity: 0, x: -16 },
        {
          opacity: 1,
          x: 0,
          duration: 0.4,
          stagger: 0.06,
          ease: "power2.out",
          delay: 0.1,
        }
      );
    }, sidebarRef);
    return () => ctx.revert();
  }, []);

  return sidebarRef;
}
