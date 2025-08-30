// components/ScreenWrapper.js
import React from "react";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    View,
} from "react-native";

/**
 * ScreenWrapper
 *
 * A flexible wrapper component for screens.
 *
 * Features:
 * - Wraps content in a KeyboardAvoidingView so inputs shift above the keyboard.
 * - Optionally adds a ScrollView for scrollable layouts.
 *
 * Usage:
 * - Use <ScreenWrapper> when screen already has FlatList/SectionList (default: no ScrollView).
 * - Use <ScreenWrapper scroll> when you want static forms or long content to be scrollable.
 *
 * @param {object} props
 * @param {boolean} [props.scroll=false]   - Enable ScrollView wrapping.
 * @param {React.ReactNode} props.children - Screen content.
 * @param {object} [props.style]           - Styles for container (applies to ScrollView or View).
 * @param {object} [props.contentContainerStyle] - Inner content style (only for ScrollView).
 * @param {number} [props.keyboardOffset=64] - Adjusts push offset when keyboard opens.
 */
const ScreenWrapper = ({
    children,
    scroll = false,
    style,
    contentContainerStyle,
    keyboardOffset = 64,
}) => {
    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={keyboardOffset}
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
