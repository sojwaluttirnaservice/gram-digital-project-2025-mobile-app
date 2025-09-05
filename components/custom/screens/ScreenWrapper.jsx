// components/ScreenWrapper.js

import React from "react";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleProp,
    View,
    ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * ScreenWrapper
 *
 * A flexible wrapper for screen layouts that:
 * - Handles safe area insets (notches, status bar, etc.).
 * - Pushes content above the keyboard using KeyboardAvoidingView.
 * - Optionally wraps content in a ScrollView for scrollable layouts.
 *
 * @example
 * // Simple screen with View
 * <ScreenWrapper>
 *   <Text>Static content</Text>
 * </ScreenWrapper>
 *
 * @example
 * // Scrollable form screen
 * <ScreenWrapper scroll>
 *   <Form />
 * </ScreenWrapper>
 *
 * @param {object} props
 * @param {boolean} [props.scroll=false] - Wrap children in a ScrollView for scrollable content.
 * @param {React.ReactNode} props.children - Screen content.
 * @param {StyleProp<ViewStyle>} [props.style] - Styles applied to the container (ScrollView or View).
 * @param {StyleProp<ViewStyle>} [props.contentContainerStyle] - Inner content style (only applies if scroll is true).
 * @param {number} [props.keyboardOffset] - Manually override the keyboard offset.  
 *                                          Defaults to `safeArea.top + 64` on iOS, `StatusBar.currentHeight || 0` on Android.
 */
const ScreenWrapper = ({
    children,
    scroll = false,
    style,
    contentContainerStyle,
    keyboardOffset,
}) => {
    const insets = useSafeAreaInsets();

    // Calculate dynamic keyboard offset
    const dynamicKeyboardOffset =
        keyboardOffset !== undefined
            ? keyboardOffset
            : Platform.OS === "ios"
                ? insets.top + 64 // Adjust header height here if needed
                : StatusBar.currentHeight || 0;

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={dynamicKeyboardOffset}
        >
            {scroll ? (
                <ScrollView
                    style={[{ flex: 1 }, style]}
                    contentContainerStyle={[
                        { flexGrow: 1, paddingHorizontal: 8 },
                        contentContainerStyle,
                    ]}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {children}
                </ScrollView>
            ) : (
                <View style={[{ flex: 1 }, style]}>{children}</View>
            )}
        </KeyboardAvoidingView>
    );
};

export default ScreenWrapper;
