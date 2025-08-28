import React from "react";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView
} from "react-native";

/**
 * A simple wrapper that:
 * - Scrolls when content overflows
 * - Shifts UI when keyboard opens
 */
const ScreenWrapper = ({
    children,
    contentContainerStyle,
    style,
}) => {
    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={64} // adjust if you have a header
        >
            <ScrollView
                style={[{ flex: 1 }, style]}
                stickyHeaderIndices={[0]}
                contentContainerStyle={[{ flexGrow: 1, paddingInline: 4 }, contentContainerStyle]}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {children}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}


export default ScreenWrapper