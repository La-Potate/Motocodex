"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

/**
 * Hydration-safe wrapper around framer-motion's `useReducedMotion`.
 *
 * The underlying hook reads a media query that does not exist on the server, so
 * a component that branches its markup on it renders one tree during SSR and a
 * different one on the first client render — which React reports as a hydration
 * mismatch. This reports `false` until after mount, so the server HTML and the
 * first client render always agree, then flips to the real preference.
 */
export function useReducedMotionSafe(): boolean {
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return mounted && !!reduce;
}
