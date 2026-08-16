/**
 * Motion for the native components — React Native's own `Animated` (no
 * dependency; runs on the UI thread with `useNativeDriver` for transforms and
 * opacity, on JS for colours), the same durations and easing family the web
 * theme uses. Reduced motion is honoured: every animation collapses to an
 * instant set when the platform asks for it.
 */
import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Easing } from "react-native";

export const DURATION = { fast: 120, base: 180, slow: 260 } as const;
export const EASE = { out: Easing.bezier(0.16, 1, 0.3, 1), inOut: Easing.bezier(0.65, 0, 0.35, 1) } as const;

/** True when the platform's "reduce motion" setting is on (web: prefers-reduced-motion via RNW). */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let live = true;
    AccessibilityInfo.isReduceMotionEnabled?.().then((v) => { if (live) setReduced(v); }).catch(() => undefined);
    const sub = AccessibilityInfo.addEventListener?.("reduceMotionChanged", (v) => setReduced(v));
    return () => { live = false; sub?.remove?.(); };
  }, []);
  return reduced;
}

/** An Animated value that follows `to`, timed (or set instantly under reduced motion). */
export function useAnimatedTo(to: number, options: { duration?: number; easing?: (t: number) => number; native?: boolean } = {}): Animated.Value {
  const value = useRef(new Animated.Value(to)).current;
  const reduced = useReducedMotion();
  const { duration = DURATION.base, easing = EASE.out, native = true } = options;
  useEffect(() => {
    if (reduced) { value.setValue(to); return; }
    const anim = Animated.timing(value, { toValue: to, duration, easing, useNativeDriver: native });
    anim.start();
    return () => anim.stop();
  }, [to, duration, easing, native, reduced, value]);
  return value;
}

/** Press feedback: a scale that dips to `pressedScale` while pressed. */
export function usePressScale(pressed: boolean, pressedScale = 0.97): Animated.Value {
  return useAnimatedTo(pressed ? pressedScale : 1, { duration: DURATION.fast });
}

/** A value that starts at 0 on mount and animates to 1 — enter motion; instant under reduced motion. */
export function useMountProgress(duration = DURATION.base): Animated.Value {
  const value = useRef(new Animated.Value(0)).current;
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced) { value.setValue(1); return; }
    const anim = Animated.timing(value, { toValue: 1, duration, easing: EASE.out, useNativeDriver: true });
    anim.start();
    return () => anim.stop();
  }, [duration, reduced, value]);
  return value;
}
