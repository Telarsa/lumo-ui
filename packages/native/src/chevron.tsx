import { View } from "react-native";

/**
 * A chevron drawn from two borders — vertically centred wherever it sits (a
 * text glyph carries ascender space and sat below centre on device), colour
 * from the caller, no icon dependency.
 */
export function Chevron({ size = 10, thickness = 1.5, color, direction = "down" }: { size?: number; thickness?: number; color: string; direction?: "down" | "up" }) {
  return (
    <View
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRightWidth: thickness,
        borderBottomWidth: thickness,
        borderColor: color,
        transform: [{ rotate: direction === "down" ? "45deg" : "225deg" }, { translateY: direction === "down" ? -size / 4 : size / 4 }],
      }}
    />
  );
}
