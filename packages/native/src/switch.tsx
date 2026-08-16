/**
 * Switch — the second Lumo native component, chosen because it is small and
 * DIRECTION-SENSITIVE (packages/native/README.md, step 4): the thumb travels
 * from the reading start to the reading end, so a Persian switch that is ON has
 * its thumb on the LEFT. The web switch solves that with logical `start-*`
 * classes; here it is React Native's logical `start` style, which the platform
 * mirrors under `I18nManager.isRTL` — the app-level switch the provider
 * deliberately does not flip (see provider.tsx).
 *
 * Contract, as on the web: named by its visible label (`children`) or, without
 * one, by a REQUIRED `accessibilityLabel` — the type does not allow neither;
 * `role="switch"` with `accessibilityState.checked`; sizes `md`/`lg` on the
 * web's measured geometry (track 30×16 / 42×22, thumb 14 / 20; `lg` keeps the
 * row at the 44 dp touch floor); disabled at 50 % opacity.
 */
import { useState, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View, type PressableStateCallbackType, type StyleProp, type ViewStyle } from "react-native";
import type { LumoNode } from "@lumo-ui/core";
import { useLumoNative } from "./provider.tsx";
import { focus } from "./tokens.ts";

interface SwitchBaseProps {
  /** Controlled state. */
  isSelected?: boolean | undefined;
  /** Initial state when uncontrolled. */
  defaultSelected?: boolean | undefined;
  /** Fired with the next state when the switch is toggled. */
  onChange?: ((isSelected: boolean) => void) | undefined;
  isDisabled?: boolean | undefined;
  /** `md` is the compact scale; `lg` keeps the row at the 44 dp touch floor. */
  size?: "md" | "lg" | undefined;
  /** Help text under the label. */
  description?: LumoNode;
  style?: StyleProp<ViewStyle>;
  testID?: string | undefined;
}

/** Named by its visible label, or by an explicit accessible name — never neither. */
export type SwitchProps = SwitchBaseProps &
  (
    | {
        children: LumoNode;
        /** An explicit accessible name, when the visible label should not be the announced one. */
        accessibilityLabel?: string | undefined;
      }
    | {
        children?: undefined;
        /** The accessible name — REQUIRED when there is no visible label. */
        accessibilityLabel: string;
      }
  );

const GEOMETRY = {
  md: { trackW: 30, trackH: 16, thumb: 14, on: 15, row: 36, text: 14 },
  lg: { trackW: 42, trackH: 22, thumb: 20, on: 21, row: 44, text: 16 },
} as const;

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  texts: { flex: 1, gap: 2 },
  track: { justifyContent: "center", borderRadius: 999, borderWidth: 1 },
  // `start`, not `left`: the platform mirrors it under I18nManager.isRTL.
  thumb: { position: "absolute", borderRadius: 999 },
});

export function Switch(props: SwitchProps) {
  const { isSelected, defaultSelected = false, onChange, isDisabled = false, size = "md", description, style, testID, children, accessibilityLabel } = props;
  const { colours, direction, fontFamily } = useLumoNative();
  const [inner, setInner] = useState(defaultSelected);
  const selected = isSelected ?? inner;
  const g = GEOMETRY[size];
  const toggle = () => {
    if (isDisabled) return;
    if (isSelected === undefined) setInner(!selected);
    onChange?.(!selected);
  };
  const rowStyle = (state: PressableStateCallbackType): StyleProp<ViewStyle> => [
    styles.row,
    { minHeight: g.row },
    "focused" in state && state.focused === true ? { outlineWidth: focus.width, outlineOffset: focus.offset, outlineColor: colours.focus, outlineStyle: "solid" } : null,
    isDisabled ? { opacity: 0.5 } : null,
    style,
  ];
  return (
    <Pressable
      role="switch"
      aria-checked={selected}
      accessibilityState={{ checked: selected, disabled: isDisabled }}
      {...(accessibilityLabel === undefined ? {} : { accessibilityLabel })}
      disabled={isDisabled}
      onPress={toggle}
      style={rowStyle}
      testID={testID}
    >
      {children === undefined && description === undefined ? null : (
        <View style={styles.texts}>
          {children === undefined ? null : <Text style={{ fontSize: g.text, fontWeight: "500", color: colours.fg, writingDirection: direction, fontFamily }}>{children as ReactNode}</Text>}
          {description === undefined ? null : <Text style={{ fontSize: 12, color: colours.fgMuted, writingDirection: direction, fontFamily }}>{description as ReactNode}</Text>}
        </View>
      )}
      <View
        style={[
          styles.track,
          { width: g.trackW, height: g.trackH, backgroundColor: selected ? colours.accent : colours.surfaceSunken, borderColor: selected ? colours.accent : colours.borderControl },
        ]}
      >
        <View style={[styles.thumb, { width: g.thumb, height: g.thumb, start: selected ? g.on : 1, backgroundColor: selected ? colours.accentFg : colours.fg }]} />
      </View>
    </Pressable>
  );
}
