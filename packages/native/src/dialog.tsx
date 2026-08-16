/**
 * Dialog — the first Lumo native component on an ENGINE: `@rn-primitives/dialog`
 * (decision §29). The engine owns what a hand-built Pressable cannot honestly
 * carry: the modal contract on device (`role="dialog"`, `aria-modal`, focus
 * moved into the content, the accessibility-escape gesture, Android's back
 * button) and, on the web, Radix's dialog (focus trap, Escape, `aria-labelledby`
 * / `aria-describedby`, portal to the document). Lumo owns the contract on top:
 * `label` and `closeLabel` are REQUIRED (an ✕ is not a name); every text takes
 * the locale's writing direction; the close control sits at the inline END, so
 * it is top-left in Persian; the card and scrim wear the tokens.
 *
 * Composition, deliberately smaller than the web's four layers because the
 * engine's parts already are the layers:
 *
 *     <Dialog label="…" closeLabel="…" trigger={<Button>…</Button>}>
 *       <Text>…</Text>
 *       <DialogClose><Button variant="outline">…</Button></DialogClose>
 *     </Dialog>
 *
 * The overlay portal needs a host on device: `LumoNativeProvider` mounts the
 * engine's `PortalHost` after the app's tree (nothing on web, where Radix
 * portals to the document).
 */
import * as DialogPrimitive from "@rn-primitives/dialog";
import { useId, type ReactNode } from "react";
import { Animated, Platform, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { useMountProgress } from "./motion.ts";
import type { LumoNode } from "@lumo-ui/core";
import { IconButton } from "./button.tsx";
import { useLumoNative } from "./provider.tsx";
import { radius } from "./tokens.ts";

export interface DialogProps {
  /** The dialog's accessible name and visible heading. REQUIRED. */
  label: string;
  /** The ✕ button's accessible name. REQUIRED — an ✕ is not a name. */
  closeLabel: string;
  /** Read after the name; rendered under the heading. */
  description?: string | undefined;
  /** The element that opens the dialog — a `Button`, usually. It receives the engine's press and `aria-expanded`. */
  trigger: ReactNode;
  /** Controlled open state. */
  isOpen?: boolean | undefined;
  /** Initial state when uncontrolled. */
  defaultOpen?: boolean | undefined;
  /** Fired when the engine wants to open or close (trigger, ✕, scrim, Escape, back button, close controls). */
  onOpenChange?: ((isOpen: boolean) => void) | undefined;
  /** The body. */
  children?: LumoNode;
  /** `sm` 24 rem, `md` 28 rem, `lg` 36 rem — never wider than the screen minus its margins. */
  size?: "sm" | "md" | "lg" | undefined;
}

const WIDTH = { sm: 384, md: 448, lg: 576 } as const;

const styles = StyleSheet.create({
  overlay: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, alignItems: "center", justifyContent: "center", padding: 16 },
  card: { width: "100%", borderRadius: radius.lg, borderWidth: 1, padding: 20, gap: 12 },
  header: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  title: { flex: 1, fontSize: 18, fontWeight: "600", lineHeight: 26 },
});

export function Dialog({ label, closeLabel, description, trigger, isOpen, defaultOpen, onOpenChange, children, size = "md" }: DialogProps) {
  const { colours, direction, fontFamily } = useLumoNative();
  const titleId = useId();
  const descriptionId = useId();
  const text = { writingDirection: direction, fontFamily } as const;
  return (
    <DialogPrimitive.Root
      {...(isOpen === undefined ? {} : { open: isOpen })}
      {...(defaultOpen === undefined ? {} : { defaultOpen })}
      {...(onOpenChange === undefined ? {} : { onOpenChange })}
    >
      <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        {/* Flat style objects wherever the WEB engine slots a part into Radix (it merges `style` by object spread; an array becomes `{0:…}`). */}
        <DialogPrimitive.Overlay style={StyleSheet.flatten([styles.overlay, { backgroundColor: colours.scrim }])}>
          <DialogPrimitive.Content
            asChild
            aria-label={label}
            // The idrefs are for the NATIVE engine (its Content wires none). On
            // the web Radix assigns its own ids to Title/Description and wires
            // them on ITS dialog element — ours here would dangle (the gate's
            // `resolved-idrefs` caught exactly that on the first render).
            {...(Platform.OS === "web" ? {} : { "aria-labelledby": titleId, ...(description === undefined ? {} : { "aria-describedby": descriptionId }) })}
          >
            <EnterMotion style={StyleSheet.flatten([styles.card, { maxWidth: WIDTH[size], backgroundColor: colours.surface, borderColor: colours.border }])}>
            <View style={styles.header}>
              <DialogPrimitive.Title nativeID={titleId} style={StyleSheet.flatten([styles.title, { color: colours.fg, ...text }])}>
                {label}
              </DialogPrimitive.Title>
              {/* At the inline END by flex order under the app's direction: top-left in Persian, top-right in English. */}
              <DialogPrimitive.Close asChild>
                <IconButton label={closeLabel} size="sm">
                  <Text aria-hidden style={{ fontSize: 16, color: colours.fgMuted }}>✕</Text>
                </IconButton>
              </DialogPrimitive.Close>
            </View>
            {description === undefined ? null : (
              <DialogPrimitive.Description nativeID={descriptionId} style={StyleSheet.flatten({ fontSize: 14, color: colours.fgMuted, ...text })}>
                {description}
              </DialogPrimitive.Description>
            )}
            {children as ReactNode}
            </EnterMotion>
          </DialogPrimitive.Content>
        </DialogPrimitive.Overlay>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/** The card enters with a fade and a scale from 96 % — the web dialog's motion — on mount; instant under reduced motion. */
function EnterMotion({ style, children }: { style: StyleProp<ViewStyle>; children: ReactNode }) {
  const t = useMountProgress();
  return (
    <Animated.View style={[style, { opacity: t, transform: [{ scale: t.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) }] }]}>
      {children}
    </Animated.View>
  );
}

/** Wraps a control that closes the dialog (a footer button): the engine adds the press. */
export function DialogClose({ children }: { children: ReactNode }) {
  return <DialogPrimitive.Close asChild>{children}</DialogPrimitive.Close>;
}
