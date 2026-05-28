"use client";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

/**
 * useCountUp — animates a number from 0 to `target` using GSAP.
 * Returns a ref to attach to the element displaying the count.
 */
export function useCountUp(target: number, duration = 1.5, prefix = "", suffix = "") {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(`${prefix}0${suffix}`);

  useEffect(() => {
    const obj = { val: 0 };
    const tween = gsap.to(obj, {
      val: target,
      duration,
      ease: "power2.out",
      onUpdate: () => {
        const formatted =
          target >= 1000
            ? Math.round(obj.val).toLocaleString()
            : obj.val.toFixed(target % 1 !== 0 ? 1 : 0);
        setDisplay(`${prefix}${formatted}${suffix}`);
      },
    });
    return () => {
      tween.kill();
    };
  }, [target, duration, prefix, suffix]);

  return { ref, display };
}
