// ExpoButton.tsx
// Long-term, accessible, theme-friendly Button component for React Native (Expo)
// Production-ready version with safe defaults and theming

/*
This file now contains three variants so you can pick what works best in your app:
  1) Default Pressable-based Button (keeps previous defensive merging)
  2) TouchableOpacity-based Button (simpler, works reliably across RN versions)
  3) Gesture Handler Button (RectButton) for apps using react-native-gesture-handler — best for complex gestures & proper ripple on Android/iOS when configured.

Why add alternatives?
- Some environments or styling toolchains (nativewind/react-native-web) interact differently with Pressable.
- TouchableOpacity has long-standing consistent behavior and sometimes avoids subtle Pressable style merging quirks.
- react-native-gesture-handler's RectButton is recommended for apps that already use gesture-handler (better performance for complex lists/gestures).

I also added a short troubleshooting checklist and tips at the bottom.
*/

import * as Haptics from "expo-haptics";
import React from "react";
import {
    ActivityIndicator,
    Animated,
    GestureResponderEvent,
    Pressable,
    StyleProp,
    StyleSheet,
    Text,
    TextStyle,
    TouchableOpacity,
    View,
    ViewStyle,
} from "react-native";

// If you use react-native-gesture-handler, uncomment this import and the GH variant below
// import { RectButton } from 'react-native-gesture-handler';

export type ButtonVariant = "solid" | "outline" | "ghost" | "link";
export type ButtonSize = "sm" | "md" | "lg";

export const DEFAULT_COLOR_PRESETS = {
  primary: "#2563EB",
  secondary: "#6B7280",
  success: "#10B981",
  danger: "#EF4444",
  warning: "#F59E0B",
  info: "#0EA5E9",
  muted: "#E5E7EB",
} as const;

type ColorPresets = Record<string, string>;

export const COLOR_PRESETS: ColorPresets = { ...DEFAULT_COLOR_PRESETS };

export interface CommonButtonProps {
  children?: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  color?: string;
  textColor?: string;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
}

const SIZE_MAP = {
  sm: { paddingV: 8, paddingH: 10, fontSize: 14, radius: 8, minHeight: 36 },
  md: { paddingV: 12, paddingH: 16, fontSize: 16, radius: 10, minHeight: 44 },
  lg: { paddingV: 14, paddingH: 20, fontSize: 18, radius: 12, minHeight: 52 },
} as const;

function hexToRgba(hex: string, alpha = 1) {
  try {
    const h = hex.replace("#", "");
    const bigint = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  } catch {
    return `rgba(0,0,0,${alpha})`;
  }
}

const DEFAULT_COLOR = COLOR_PRESETS.primary;
function resolveColor(colorOrPreset?: string) {
  if (!colorOrPreset) return DEFAULT_COLOR;
  return COLOR_PRESETS[colorOrPreset] ?? colorOrPreset;
}

/* --------------------------------------------------
   1) Pressable-based production button (original)
   -------------------------------------------------- */
export const PressableButton: React.FC<CommonButtonProps & { onPress?: (e: GestureResponderEvent) => void }> = ({
  children,
  variant = "solid",
  size = "md",
  color,
  textColor,
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  style,
  textStyle,
  accessibilityLabel,
  onPress,
}) => {
  const s = SIZE_MAP[size];
  const isDisabled = disabled || loading;
  const resolvedColor = resolveColor(color);
  const scale = React.useRef(new Animated.Value(1)).current;

  const baseContainer: ViewStyle = {
    paddingVertical: s.paddingV,
    paddingHorizontal: s.paddingH,
    borderRadius: s.radius,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    minWidth: 64,
  };

  let variantStyle: ViewStyle = {};
  let computedTextColor = textColor;
  switch (variant) {
    case "solid":
      variantStyle = { backgroundColor: resolvedColor };
      computedTextColor = computedTextColor ?? "#fff";
      break;
    case "outline":
      variantStyle = { backgroundColor: "transparent", borderWidth: 1, borderColor: resolvedColor };
      computedTextColor = computedTextColor ?? resolvedColor;
      break;
    case "ghost":
      variantStyle = { backgroundColor: "transparent" };
      computedTextColor = computedTextColor ?? resolvedColor;
      break;
    case "link":
      variantStyle = { backgroundColor: "transparent", paddingVertical: 0, paddingHorizontal: 0 };
      computedTextColor = computedTextColor ?? resolvedColor;
      break;
    default:
      variantStyle = { backgroundColor: resolvedColor };
      computedTextColor = computedTextColor ?? "#fff";
  }

  const rippleColor = variant === "solid" ? hexToRgba("#000", 0.12) : hexToRgba(resolvedColor, 0.12);

  const onPressHandler = (e: GestureResponderEvent) => {
    if (isDisabled) return;
    try {
      Haptics.selectionAsync();
    } catch {}
    onPress?.(e);
  };

  const handlePressIn = () => Animated.spring(scale, { toValue: 0.985, useNativeDriver: true }).start();
  const handlePressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled: isDisabled }}
        android_ripple={{ color: rippleColor }}
        disabled={isDisabled}
        onPress={onPressHandler}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={({ pressed }) => {
          const merged = StyleSheet.flatten([
            styles.rowFallback,
            baseContainer,
            variantStyle,
            fullWidth && { alignSelf: "stretch" },
            pressed && !isDisabled ? { opacity: 0.92 } : undefined,
            isDisabled ? { opacity: 0.6 } : undefined,
            style,
          ]) as ViewStyle;

          if (merged.paddingVertical == null && merged.padding == null) merged.paddingVertical = s.paddingV;
          if (merged.paddingHorizontal == null && merged.padding == null) merged.paddingHorizontal = s.paddingH;
          if (variant === "solid" && !merged.backgroundColor) merged.backgroundColor = resolvedColor;

          return merged;
        }}
      >
        {loading ? (
          <ActivityIndicator size="small" color={variant === "solid" ? "#fff" : resolvedColor} />
        ) : (
          <>
            {leftIcon ? <View style={[styles.iconWrap, { marginRight: 8 }]}>{leftIcon}</View> : null}
            {typeof children === "string" || typeof children === "number" ? (
              <Text numberOfLines={1} style={[{ fontSize: s.fontSize, color: computedTextColor }, textStyle]}>
                {children}
              </Text>
            ) : (
              children
            )}
            {rightIcon ? <View style={[styles.iconWrap, { marginLeft: 8 }]}>{rightIcon}</View> : null}
          </>
        )}
      </Pressable>
    </Animated.View>
  );
};

/* --------------------------------------------------
   2) TouchableOpacity-based variant
   -------------------------------------------------- */
export const TouchableOpacityButton: React.FC<CommonButtonProps & { onPress?: () => void }> = ({
  children,
  variant = "solid",
  size = "md",
  color,
  textColor,
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  style,
  textStyle,
  accessibilityLabel,
  onPress,
}) => {
  const s = SIZE_MAP[size];
  const isDisabled = disabled || loading;
  const resolvedColor = resolveColor(color);

  const baseContainer: ViewStyle = {
    paddingVertical: s.paddingV,
    paddingHorizontal: s.paddingH,
    borderRadius: s.radius,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    minWidth: 64,
  };

  let variantStyle: ViewStyle = {};
  let computedTextColor = textColor;
  switch (variant) {
    case "solid":
      variantStyle = { backgroundColor: resolvedColor };
      computedTextColor = computedTextColor ?? "#fff";
      break;
    case "outline":
      variantStyle = { backgroundColor: "transparent", borderWidth: 1, borderColor: resolvedColor };
      computedTextColor = computedTextColor ?? resolvedColor;
      break;
    case "ghost":
      variantStyle = { backgroundColor: "transparent" };
      computedTextColor = computedTextColor ?? resolvedColor;
      break;
    case "link":
      variantStyle = { backgroundColor: "transparent", paddingVertical: 0, paddingHorizontal: 0 };
      computedTextColor = computedTextColor ?? resolvedColor;
      break;
    default:
      variantStyle = { backgroundColor: resolvedColor };
      computedTextColor = computedTextColor ?? "#fff";
  }

  const merged = StyleSheet.flatten([styles.rowFallback, baseContainer, variantStyle, fullWidth && { alignSelf: "stretch" }, style]) as ViewStyle;
  if (merged.paddingVertical == null && merged.padding == null) merged.paddingVertical = s.paddingV;
  if (merged.paddingHorizontal == null && merged.padding == null) merged.paddingHorizontal = s.paddingH;
  if (variant === "solid" && !merged.backgroundColor) merged.backgroundColor = resolvedColor;

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      activeOpacity={0.75}
      disabled={isDisabled}
      onPress={() => {
        if (isDisabled) return;
        try {
          Haptics.selectionAsync();
        } catch {}
        onPress?.();
      }}
      style={merged}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === "solid" ? "#fff" : resolvedColor} />
      ) : (
        <>
          {leftIcon ? <View style={[styles.iconWrap, { marginRight: 8 }]}>{leftIcon}</View> : null}
          {typeof children === "string" || typeof children === "number" ? (
            <Text numberOfLines={1} style={[{ fontSize: s.fontSize, color: computedTextColor }, textStyle]}>
              {children}
            </Text>
          ) : (
            children
          )}
          {rightIcon ? <View style={[styles.iconWrap, { marginLeft: 8 }]}>{rightIcon}</View> : null}
        </>
      )}
    </TouchableOpacity>
  );
};

/* --------------------------------------------------
   3) Gesture Handler variant (RectButton)
   -------------------------------------------------- */
// If your app uses react-native-gesture-handler, RectButton often provides smoother taps and works well in complex lists.
// Uncomment and use this only if you have 'react-native-gesture-handler' installed and configured.

/*
export const GHRectButton: React.FC<CommonButtonProps & { onPress?: () => void }> = ({
  children,
  variant = 'solid',
  size = 'md',
  color,
  textColor,
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  style,
  textStyle,
  accessibilityLabel,
  onPress,
}) => {
  const s = SIZE_MAP[size];
  const isDisabled = disabled || loading;
  const resolvedColor = resolveColor(color);

  const baseContainer: ViewStyle = {
    paddingVertical: s.paddingV,
    paddingHorizontal: s.paddingH,
    borderRadius: s.radius,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    minWidth: 64,
  };

  // same variant resolution as others
  let variantStyle: ViewStyle = {};
  let computedTextColor = textColor;
  switch (variant) {
    case 'solid': variantStyle = { backgroundColor: resolvedColor }; computedTextColor = computedTextColor ?? '#fff'; break;
    case 'outline': variantStyle = { backgroundColor: 'transparent', borderWidth: 1, borderColor: resolvedColor }; computedTextColor = computedTextColor ?? resolvedColor; break;
    case 'ghost': variantStyle = { backgroundColor: 'transparent' }; computedTextColor = computedTextColor ?? resolvedColor; break;
    case 'link': variantStyle = { backgroundColor: 'transparent', paddingVertical: 0, paddingHorizontal: 0 }; computedTextColor = computedTextColor ?? resolvedColor; break;
    default: variantStyle = { backgroundColor: resolvedColor }; computedTextColor = computedTextColor ?? '#fff';
  }

  const merged = StyleSheet.flatten([styles.rowFallback, baseContainer, variantStyle, fullWidth && { alignSelf: 'stretch' }, style]) as ViewStyle;
  if (merged.paddingVertical == null && merged.padding == null) merged.paddingVertical = s.paddingV;
  if (merged.paddingHorizontal == null && merged.padding == null) merged.paddingHorizontal = s.paddingH;
  if (variant === 'solid' && !merged.backgroundColor) merged.backgroundColor = resolvedColor;

  return (
    <RectButton
      style={merged}
      enabled={!isDisabled}
      onPress={() => {
        if (isDisabled) return;
        try { Haptics.selectionAsync(); } catch {}
        onPress?.();
      }}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'solid' ? '#fff' : resolvedColor} />
      ) : (
        <>
          {leftIcon ? <View style={[styles.iconWrap, { marginRight: 8 }]}>{leftIcon}</View> : null}
          {typeof children === 'string' || typeof children === 'number' ? (
            <Text numberOfLines={1} style={[{ fontSize: s.fontSize, color: computedTextColor }, textStyle]}>{children}</Text>
          ) : (
            children
          )}
          {rightIcon ? <View style={[styles.iconWrap, { marginLeft: 8 }]}>{rightIcon}</View> : null}
        </>
      )}
    </RectButton>
  );
};
*/

const styles = StyleSheet.create({
  iconWrap: {
    justifyContent: "center",
    alignItems: "center",
  },
  rowFallback: {
    flexDirection: "row",
    alignItems: "center",
  },
});

export default PressableButton;

/* Troubleshooting checklist (quick):

1) Parent styles: check parent doesn't set `overflow: 'hidden'`, `height: 0`, or `alignItems: 'stretch'` that collapses child.
2) Variant 'link' sets padding 0: if you passed link, you'll see it appear 'invisible'. Add `style={{ paddingHorizontal: 8 }}`.
3) Consumer style overriding: if you pass `style={{ padding: 0 }}` it intentionally removes padding — pass explicit padding if you want it.
4) NativeWind / className: if you use nativewind, avoid passing `className` to this component unless you create a nativewind wrapper; `style` is more reliable.
5) React Native Web: behavior differs on web — use `TouchableOpacity` for consistent behavior across web/ios/android.
6) Metro caching: clear cache with `expo start -c`.

Recommended next steps:
- If your app uses gesture-handler, enable GHRectButton (uncomment imports & code) and use that as default for lists.
- If you want a nativewind wrapper, I can add `className` mapping that forwards to style.
- If styles still don't apply, paste the usage code (the parent screen) and I will find the exact override.
*/
