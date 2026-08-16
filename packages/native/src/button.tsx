/**
 * Button — the first Lumo native component. The web button's contract on
 * `Pressable` + `Text`: four variants and three sizes on the shared control
 * scale, disabled by prop (announced through `accessibilityState`), children
 * typed `LumoNode` so a raw number cannot reach the screen unformatted, and
 * `IconButton` whose `label` is REQUIRED — an icon is not a name.
 *
 * Geometry mirrors packages/ui/src/button.variants.ts: heights from the control
 * scale (29/36/44 dp), logical (start/end) padding 12/16/24, text 14/14/16.
 * States: pressed = the web's hover fill (a finger has no hover), focused = the
 * focus ring (keyboard / switch access), disabled = 50 % opacity.
 */
import type { ReactNode } from "react";
import { useState } from "react";
import { Animated, Pressable, StyleSheet, Text, type GestureResponderEvent, type PressableProps, type PressableStateCallbackType, type StyleProp, type TextStyle, type ViewStyle } from "react-native";
import { usePressScale } from "./motion.ts";
import type { LumoNode } from "@lumo-ui/core";
import { useLumoNative } from "./provider.tsx";
import { control, focus, radius } from "./tokens.ts";

export type ButtonVariant = "solid" | "outline" | "ghost" | "critical";
export type ButtonSize = "sm" | "md" | "lg";

/**
 * What an ENGINE hands a button it slots (a dialog trigger, a close control):
 * the press it composes, the state it announces, its ids. Forwarded to the
 * Pressable — this is how `<Dialog trigger={<Button/>}>` gets `aria-expanded`
 * and the open press. `style` and the announced strings stay Lumo's own props.
 */
type EngineProps = Omit<PressableProps, "style" | "children" | "onPress" | "disabled" | "role" | "accessibilityLabel" | "accessibilityHint" | "accessibilityState" | "testID">;

interface ButtonBaseProps extends EngineProps {
  /** The emphasis: filled primary, quiet secondary, bare ghost, or the critical treatment. */
  variant?: ButtonVariant | undefined;
  /** The size step on the shared control scale. `lg` meets the 44 dp touch-target floor. */
  size?: ButtonSize | undefined;
  isDisabled?: boolean | undefined;
  /** Fired when the button is pressed (tap, or keyboard/switch activation). Not fired while disabled. */
  onPress?: ((event: GestureResponderEvent) => void) | undefined;
  /** Announced context after the name (VoiceOver: "…, button, <hint>"). Write it in the app's language. */
  accessibilityHint?: string | undefined;
  style?: StyleProp<ViewStyle>;
  testID?: string | undefined;
}

export interface ButtonProps extends ButtonBaseProps {
  /** The visible label — also the accessible name. */
  children: LumoNode;
}

export interface IconButtonProps extends ButtonBaseProps {
  /** The accessible name. REQUIRED — an icon has none. */
  label: string;
  /** The icon. */
  children: ReactNode;
}

const SIZE = {
  sm: { height: control.sm, paddingStart: 12, paddingEnd: 12, fontSize: 14 },
  md: { height: control.md, paddingStart: 16, paddingEnd: 16, fontSize: 14 },
  lg: { height: control.lg, paddingStart: 24, paddingEnd: 24, fontSize: 16 },
} as const;

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "transparent",
  },
  text: { fontWeight: "500" },
});

/** Fill/text/border for a variant in a state, from the scheme's semantic colours. */
function paint(variant: ButtonVariant, state: PressableStateCallbackType, colours: ReturnType<typeof useLumoNative>["colours"]) {
  const active = state.pressed || ("hovered" in state && state.hovered === true);
  switch (variant) {
    case "solid":
      return { backgroundColor: active ? colours.accentHover : colours.accent, color: colours.accentFg, borderColor: "transparent" };
    case "outline":
      return { backgroundColor: active ? colours.surfaceHover : colours.surface, color: colours.fg, borderColor: colours.borderControl };
    case "ghost":
      return { backgroundColor: active ? colours.surfaceHover : "transparent", color: colours.fg, borderColor: "transparent" };
    case "critical":
      return { backgroundColor: colours.critical, color: colours.bg, borderColor: "transparent" };
  }
}

function useButtonStyle(variant: ButtonVariant, size: ButtonSize, isDisabled: boolean, extra: StyleProp<ViewStyle>) {
  const { colours } = useLumoNative();
  return (state: PressableStateCallbackType): StyleProp<ViewStyle> => {
    const p = paint(variant, state, colours);
    const s = SIZE[size];
    const focused = "focused" in state && state.focused === true;
    return [
      styles.base,
      { height: s.height, paddingStart: s.paddingStart, paddingEnd: s.paddingEnd, backgroundColor: p.backgroundColor, borderColor: p.borderColor },
      focused ? { outlineWidth: focus.width, outlineOffset: focus.offset, outlineColor: colours.focus, outlineStyle: "solid" } : null,
      isDisabled ? { opacity: 0.5 } : null,
      extra,
    ];
  };
}

export function Button({ variant = "solid", size = "md", isDisabled = false, onPress, accessibilityHint, style, testID, children, ...engine }: ButtonProps) {
  const { colours, direction, fontFamily } = useLumoNative();
  const styleFor = useButtonStyle(variant, size, isDisabled, style);
  const textStyle: TextStyle = { ...styles.text, fontSize: SIZE[size].fontSize, writingDirection: direction, fontFamily };
  // Press feedback: the fill changes (below) AND the button dips to 97 % — the
  // motion a finger expects; the web's `active:translate-y-px` in another form.
  const [pressed, setPressed] = useState(false);
  const scale = usePressScale(pressed);
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        {...engine}
        role="button"
        accessibilityState={{ disabled: isDisabled }}
        disabled={isDisabled}
        onPress={isDisabled ? undefined : onPress}
        onPressIn={(e) => { setPressed(true); engine.onPressIn?.(e); }}
        onPressOut={(e) => { setPressed(false); engine.onPressOut?.(e); }}
        style={styleFor}
        testID={testID}
        {...(accessibilityHint === undefined ? {} : { accessibilityHint })}
      >
        {(state) => <Text style={[textStyle, { color: paint(variant, state, colours).color }]}>{children as ReactNode}</Text>}
      </Pressable>
    </Animated.View>
  );
}

export function IconButton({ label, variant = "ghost", size = "md", isDisabled = false, onPress, accessibilityHint, style, testID, children, ...engine }: IconButtonProps) {
  const styleFor = useButtonStyle(variant, size, isDisabled, [{ width: SIZE[size].height, paddingStart: 0, paddingEnd: 0 }, style]);
  const [pressed, setPressed] = useState(false);
  const scale = usePressScale(pressed, 0.94);
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        {...engine}
        role="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: isDisabled }}
        disabled={isDisabled}
        onPress={isDisabled ? undefined : onPress}
        onPressIn={(e) => { setPressed(true); engine.onPressIn?.(e); }}
        onPressOut={(e) => { setPressed(false); engine.onPressOut?.(e); }}
        style={styleFor}
        testID={testID}
        {...(accessibilityHint === undefined ? {} : { accessibilityHint })}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
