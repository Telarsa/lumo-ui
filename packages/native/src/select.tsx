/**
 * Select — a single choice from a short list. React Native core ships no
 * cross-platform picker, so this is Lumo's own: a trigger (`role="combobox"`,
 * named by the REQUIRED `label`, showing the chosen option or the REQUIRED
 * `placeholder`) that opens a modal sheet (`role="listbox"`) of options
 * (`role="option"`, `aria-selected`). Everything announced is a prop; the
 * chosen option's text is the trigger's value. Direction and the writing
 * direction of every text come from the provider.
 */
import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, type PressableStateCallbackType, type StyleProp, type ViewStyle } from "react-native";
import { useLumoNative } from "./provider.tsx";
import { control, focus, radius } from "./tokens.ts";

export interface SelectOption {
  /** Stable identity; the value `onChange` reports. */
  id: string;
  /** The visible (and announced) text. */
  label: string;
  /** Shown but not choosable. */
  isDisabled?: boolean | undefined;
}

export interface SelectProps {
  /** The visible label — also the trigger's accessible name. REQUIRED. */
  label: string;
  /** Shown (and announced as the value) while nothing is chosen. REQUIRED — no English default. */
  placeholder: string;
  /** Announced name of the close action in the sheet. REQUIRED. */
  closeLabel: string;
  /** The choices, in order; a disabled option is shown but cannot be chosen. */
  options: readonly SelectOption[];
  /** Controlled selection: the chosen option's `id`. */
  value?: string | undefined;
  /** Initial selection when uncontrolled. */
  defaultValue?: string | undefined;
  /** Fired with the chosen option's `id`. */
  onChange?: ((id: string) => void) | undefined;
  /** Help text under the trigger; also read as its hint. */
  description?: string | undefined;
  /** The validation message; rendered under the trigger and announced. */
  errorMessage?: string | undefined;
  isDisabled?: boolean | undefined;
  /** The size step on the shared control scale (29 / 36 / 44 dp). */
  size?: "sm" | "md" | "lg" | undefined;
  style?: StyleProp<ViewStyle>;
  testID?: string | undefined;
}

const styles = StyleSheet.create({
  root: { gap: 6 },
  label: { fontWeight: "500" },
  trigger: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, borderWidth: 1, borderRadius: radius.md, paddingStart: 12, paddingEnd: 12 },
  scrim: { flex: 1, justifyContent: "flex-end" },
  sheet: { borderTopStartRadius: radius.lg, borderTopEndRadius: radius.lg, paddingBottom: 24, maxHeight: "70%" },
  sheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingStart: 16, paddingEnd: 16, paddingTop: 12, paddingBottom: 8 },
  option: { minHeight: control.lg, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingStart: 16, paddingEnd: 16 },
});

export function Select({
  label, placeholder, closeLabel, options, value, defaultValue, onChange, description, errorMessage, isDisabled = false, size = "md", style, testID,
}: SelectProps) {
  const { colours, direction, fontFamily } = useLumoNative();
  const [inner, setInner] = useState<string | undefined>(defaultValue);
  const [open, setOpen] = useState(false);
  const selectedId = value ?? inner;
  const selected = options.find((o) => o.id === selectedId);
  const invalid = errorMessage !== undefined;
  const fontSize = size === "lg" ? 16 : 14;
  const text = { writingDirection: direction, fontFamily } as const;
  const choose = (id: string) => {
    if (value === undefined) setInner(id);
    onChange?.(id);
    setOpen(false);
  };
  const triggerStyle = (state: PressableStateCallbackType): StyleProp<ViewStyle> => [
    styles.trigger,
    { height: control[size], backgroundColor: colours.surface, borderColor: invalid ? colours.critical : colours.borderControl },
    "focused" in state && state.focused === true ? { outlineWidth: focus.width, outlineOffset: focus.offset, outlineColor: colours.focus, outlineStyle: "solid" } : null,
    style,
  ];
  return (
    <View style={[styles.root, isDisabled ? { opacity: 0.5 } : null]}>
      <Text style={[styles.label, { fontSize, color: colours.fg, ...text }]}>{label}</Text>
      <Pressable
        role="combobox"
        accessibilityLabel={label}
        accessibilityValue={{ text: selected?.label ?? placeholder }}
        accessibilityState={{ disabled: isDisabled, expanded: open }}
        aria-expanded={open}
        {...(description === undefined ? {} : { accessibilityHint: description })}
        disabled={isDisabled}
        onPress={() => setOpen(true)}
        style={triggerStyle}
        testID={testID}
      >
        <Text style={{ fontSize, color: selected === undefined ? colours.fgSubtle : colours.fg, ...text }}>{selected?.label ?? placeholder}</Text>
        <Text aria-hidden style={{ color: colours.fgMuted }}>⌄</Text>
      </Pressable>
      {description === undefined ? null : <Text style={{ fontSize: 12, color: colours.fgMuted, ...text }}>{description}</Text>}
      {errorMessage === undefined ? null : (
        <Text accessibilityLiveRegion="polite" style={{ fontSize: 12, color: colours.critical, ...text }}>{errorMessage}</Text>
      )}
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)} accessibilityViewIsModal>
        <Pressable style={[styles.scrim, { backgroundColor: colours.scrim }]} onPress={() => setOpen(false)} accessibilityLabel={closeLabel} role="button">
          <Pressable onPress={() => undefined} style={[styles.sheet, { backgroundColor: colours.surface }]}>
            <View style={styles.sheetHeader}>
              <Text style={{ fontSize: 16, fontWeight: "600", color: colours.fg, ...text }}>{label}</Text>
              <Pressable role="button" accessibilityLabel={closeLabel} onPress={() => setOpen(false)} hitSlop={8}>
                <Text style={{ fontSize: 18, color: colours.fgMuted }} aria-hidden>✕</Text>
              </Pressable>
            </View>
            <ScrollView accessibilityRole="list" accessibilityLabel={label}>
              {options.map((o) => {
                const isSelected = o.id === selectedId;
                return (
                  <Pressable
                    key={o.id}
                    role="option"
                    aria-selected={isSelected}
                    accessibilityState={{ selected: isSelected, disabled: o.isDisabled === true }}
                    disabled={o.isDisabled === true}
                    onPress={() => choose(o.id)}
                    style={({ pressed }) => [styles.option, { backgroundColor: pressed ? colours.surfaceHover : "transparent", opacity: o.isDisabled ? 0.5 : 1 }]}
                  >
                    <Text style={{ fontSize: 16, color: colours.fg, fontWeight: isSelected ? "600" : "400", ...text }}>{o.label}</Text>
                    {isSelected ? <Text aria-hidden style={{ color: colours.accent }}>✓</Text> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
