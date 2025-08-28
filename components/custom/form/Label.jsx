import clsx from "clsx";
import React from "react";
import { Text, View } from "react-native";

/**
 * Label component for form inputs in React Native.
 *
 * Provides a styled and theme-consistent label for form fields.
 * Supports required indicators, accessibility bindings, and custom styling.
 * Unlike web `<label>`, React Native does not natively support `htmlFor`,
 * so this prop is included only for API parity (not functional).
 *
 * @component
 * @example
 * // Basic usage
 * <Label>Username</Label>
 *
 * @example
 * // With required indicator
 * <Label required>Email Address</Label>
 *
 * @param {Object} props - Label component props
 * @param {string} [props.htmlFor] - For API parity with web `<label>`. (Not functional in React Native)
 * @param {React.ReactNode} props.children - The text or elements to display inside the label.
 * @param {string} [props.className] - Optional additional Tailwind/NativeWind classes to style the label.
 * @param {boolean} [props.required=false] - If `true`, displays a red asterisk (*) to indicate a required field.
 * @param {string} [props.accessibilityLabel] - Accessible name for screen readers (overrides children if provided).
 * @param {string} [props.accessibilityDescribedBy] - ID of an element that describes the input for accessibility.
 * @param {Object} [props.rest] - Any additional props are spread to the underlying `<Text>` element.
 */
const Label = ({
    htmlFor,
    children,
    className = "",
    required = false,
    accessibilityLabel,
    accessibilityDescribedBy,
    ...rest
}) => {
    return (
        <View>
            <Text
                accessibilityLabel={accessibilityLabel}
                accessibilityHint={accessibilityDescribedBy}
                className={clsx(
                    "text-sm font-bold text-gray-800 tracking-wide mb-1",
                    className
                )}
                {...rest}
            >
                {children}
                {required && <Text className="text-red-500"> *</Text>}
            </Text>
        </View>
    );
};

export default Label;
