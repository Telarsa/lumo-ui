/**
 * TextField — a labelled `TextInput` with the web field's contract: `label` is
 * REQUIRED (visible, and the input's accessible name — native platforms do not
 * associate a label element with an input the way `<label for>` does, so the
 * name is set on the input itself), `description` becomes the accessibility
 * hint, `errorMessage` renders below and is announced as a live region,
 * `isInvalid` colours the border and joins the hint. Geometry from the shared
 * control scale; text follows the locale's writing direction and aligns to its
 * reading start explicitly (`textAlign` is physical in React Native).
 */
import { useState, type ReactNode } from "react";
import { StyleSheet, Text, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from "react-native";
import type { LumoNode } from "@lumo-ui/core";
import { useLumoNative } from "./provider.tsx";
import { control, focus, radius } from "./tokens.ts";

export interface TextFieldProps {
  /** The visible label — also the input's accessible name. REQUIRED. */
  label: string;
  /** Help text under the field; also read as the input's hint. */
  description?: string | undefined;
  /** The validation message; rendered under the field and announced. */
  errorMessage?: string | undefined;
  /** Marks the field invalid (critical border; the error joins the hint) without an error message. */
  isInvalid?: boolean | undefined;
  isDisabled?: boolean | undefined;
  /** The value can be read and selected but not edited. */
  isReadOnly?: boolean | undefined;
  /** Shows the required marker after the label. Validation itself is the form's. */
  isRequired?: boolean | undefined;
  placeholder?: string | undefined;
  /** Controlled value. */
  value?: string | undefined;
  /** Initial value when uncontrolled. */
  defaultValue?: string | undefined;
  /** Fired with the new text on every edit. */
  onChange?: ((value: string) => void) | undefined;
  /** The size step on the shared control scale (29 / 36 / 44 dp). */
  size?: "sm" | "md" | "lg" | undefined;
  /** Keyboard and content hint, passed through to `TextInput`. */
  inputMode?: TextInputProps["inputMode"];
  /** The platform keyboard to show, passed through to `TextInput`. */
  keyboardType?: TextInputProps["keyboardType"];
  /** Autofill hint, passed through to `TextInput`. */
  autoComplete?: TextInputProps["autoComplete"];
  /** Masks the text (passwords). */
  secureTextEntry?: boolean | undefined;
  /** Maximum number of characters. */
  maxLength?: number | undefined;
  /** The return key's label, passed through to `TextInput`. */
  returnKeyType?: TextInputProps["returnKeyType"];
  /** Fired when the return key is pressed. */
  onSubmitEditing?: TextInputProps["onSubmitEditing"];
  style?: StyleProp<ViewStyle>;
  testID?: string | undefined;
  /** Rendered after the input in the same row (a unit, a clear button). */
  children?: LumoNode;
}

const styles = StyleSheet.create({
  root: { gap: 6 },
  label: { fontWeight: "500" },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  input: { flex: 1, borderWidth: 1, borderRadius: radius.md, paddingStart: 12, paddingEnd: 12 },
});

export function TextField({
  label, description, errorMessage, isInvalid = false, isDisabled = false, isReadOnly = false, isRequired = false,
  placeholder, value, defaultValue, onChange, size = "md", inputMode, keyboardType, autoComplete, secureTextEntry,
  maxLength, returnKeyType, onSubmitEditing, style, testID, children,
}: TextFieldProps) {
  const { colours, direction, fontFamily } = useLumoNative();
  const [focused, setFocused] = useState(false);
  const invalid = isInvalid || errorMessage !== undefined;
  const fontSize = size === "lg" ? 16 : 14;
  const hint = [description, invalid ? errorMessage : undefined].filter((s): s is string => s !== undefined && s !== "").join(". ");
  return (
    <View style={[styles.root, isDisabled ? { opacity: 0.5 } : null, style]}>
      <Text style={[styles.label, { fontSize, color: colours.fg, writingDirection: direction, fontFamily }]}>
        {label}
        {isRequired ? <Text style={{ color: colours.critical }}> *</Text> : null}
      </Text>
      <View style={styles.row}>
        <TextInput
          accessibilityLabel={label}
          {...(hint === "" ? {} : { accessibilityHint: hint })}
          accessibilityState={{ disabled: isDisabled }}
          aria-disabled={isDisabled}
          editable={!isDisabled && !isReadOnly}
          placeholder={placeholder}
          placeholderTextColor={colours.fgSubtle}
          value={value}
          defaultValue={defaultValue}
          onChangeText={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          inputMode={inputMode}
          keyboardType={keyboardType}
          autoComplete={autoComplete}
          secureTextEntry={secureTextEntry}
          maxLength={maxLength}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          testID={testID}
          style={[
            styles.input,
            {
              height: control[size],
              fontSize,
              color: colours.fg,
              backgroundColor: colours.surface,
              borderColor: invalid ? colours.critical : focused ? colours.focus : colours.borderControl,
              writingDirection: direction,
              textAlign: direction === "rtl" ? "right" : "left",
              fontFamily,
            },
            focused ? { outlineWidth: focus.width, outlineOffset: focus.offset, outlineColor: colours.focus, outlineStyle: "solid" } : null,
          ]}
        />
        {children as ReactNode}
      </View>
      {description === undefined ? null : (
        <Text style={{ fontSize: 12, color: colours.fgMuted, writingDirection: direction, fontFamily }}>{description}</Text>
      )}
      {invalid && errorMessage !== undefined ? (
        <Text accessibilityLiveRegion="polite" style={{ fontSize: 12, color: colours.critical, writingDirection: direction, fontFamily }}>
          {errorMessage}
        </Text>
      ) : null}
    </View>
  );
}
