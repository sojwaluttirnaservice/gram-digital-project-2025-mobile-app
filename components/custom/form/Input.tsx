// components/Input.tsx
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import {
    Animated,
    Easing,
    Image,
    Platform,
    Pressable,
    StyleProp,
    Text,
    TextInput,
    TextInputProps,
    View,
    ViewStyle,
} from "react-native";
import { twMerge } from "tailwind-merge";

export type PickedAsset = {
    uri: string;
    name?: string;
    fileName?: string;
    type?: string;
    size?: number;
    [k: string]: any;
};

export type InputMode = "text" | "password" | "email" | "number" | "multiline" | "file" | "image";

export type InputChange = {
    value: string | null;
    files: PickedAsset[] | null;
    mode: InputMode;
};

export type InputHandle = {
    focus: () => void;
    blur: () => void;
    clear: () => void;
    getNativeRef: () => TextInput | null;
};

export interface InputProps extends Omit<TextInputProps, "onChange" | "value"> {
    mode?: InputMode;
    label?: string;
    required?: boolean;
    value?: string;
    defaultValue?: string;
    onChange?: (change: InputChange) => void;
    onChangeText?: (text: string) => void;
    error?: string;
    helper?: string;
    disabled?: boolean;
    readOnly?: boolean;
    multiline?: boolean;
    numberOfLines?: number;
    secureTextEntry?: boolean;
    accept?: string | string[];
    multiple?: boolean;
    maxFiles?: number;
    fileKinds?: "any" | "images" | "videos" | "media" | "plainText";
    imagePreview?: boolean;
    //   Left?: React.ComponentType | (() => JSX.Element);
    //   Right?: React.ComponentType | (() => JSX.Element);
    className?: string;
    inputClassName?: string;
    containerClassName?: string;
    testID?: string;
    isLabelFloating?: boolean;
    floatingLabel?: boolean;
    floatingLabelStyle?: StyleProp<ViewStyle>;
}

/**
 * Helper: merge className fragments safely and resolve conflicts via twMerge.
 * Accepts strings or undefined; filters falsy values.
 */
function mergeClass(...parts: (string | undefined | false | null)[]) {
    return twMerge(parts.filter(Boolean).join(" "));
}

const Input = forwardRef<InputHandle, InputProps>(function Input(props, ref) {
    const {
        mode = "text",
        label,
        required = false,
        placeholder,
        value,
        defaultValue,
        onChange,
        onChangeText,
        error,
        helper,
        disabled = false,
        readOnly = false,
        multiline = false,
        numberOfLines,
        secureTextEntry,
        accept,
        multiple = false,
        maxFiles = 4,
        fileKinds = "any",
        imagePreview = true,
        // Left,
        // Right,
        className = "",
        inputClassName = "",
        containerClassName = "",
        testID,
        isLabelFloating = false,
        floatingLabel = false,
        floatingLabelStyle,
        ...rest
    } = props;

    const enableFloating = Boolean(isLabelFloating || floatingLabel);

    const inputRef = useRef<TextInput | null>(null);
    useImperativeHandle(ref, () => ({
        focus: () => inputRef.current?.focus(),
        blur: () => inputRef.current?.blur(),
        clear: () => inputRef.current?.clear(),
        getNativeRef: () => inputRef.current,
    }));

    const [internalText, setInternalText] = useState<string>(defaultValue ?? "");
    const text = value != null ? value : internalText;

    const [files, setFiles] = useState<PickedAsset[]>([]);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [focused, setFocused] = useState(false);

    const isTextMode = mode !== "file" && mode !== "image";

    const keyboardType = useMemo(() => {
        switch (mode) {
            case "email":
                return "email-address";
            case "number":
                return Platform.OS === "ios" ? "number-pad" : "numeric";
            default:
                return "default";
        }
    }, [mode]);

    const isPasswordMode = mode === "password" || Boolean(secureTextEntry);
    const finalSecure = secureTextEntry !== undefined ? Boolean(secureTextEntry) : (mode === "password" ? !isPasswordVisible : false);

    const handleTextChange = (t: string) => {
        if (value == null) setInternalText(t);
        onChangeText?.(t);
        onChange?.({ value: t, files: null, mode });
    };

    const fileTypeFromPreset = (): string | string[] => {
        if (Array.isArray(accept) && accept.length) return accept;
        if (typeof accept === "string" && accept) return [accept];

        switch (fileKinds) {
            case "images":
                return ["image/*"];
            case "videos":
                return ["video/*"];
            case "media":
                return ["image/*", "video/*"];
            case "plainText":
                return ["text/*"];
            default:
                return "*/*";
        }
    };

    const pickFileAsync = async () => {
        try {
            if (mode === "image") {
                const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (!permission.granted) return;

                const res = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsMultipleSelection: Boolean(multiple),
                    quality: 0.9,
                });

                if ("canceled" in (res as any) && (res as any).canceled) return;
                const assets: PickedAsset[] = (res as any).assets ?? [res as any];
                setFiles(assets);
                onChange?.({ value: null, files: assets, mode });
            } else {
                const res = await DocumentPicker.getDocumentAsync({
                    multiple,
                    type: fileTypeFromPreset(),
                    copyToCacheDirectory: true,
                } as any);

                if ("canceled" in (res as any) && (res as any).canceled) return;

                const picked = Array.isArray((res as any).assets) ? (res as any).assets : [res];
                const normalized: PickedAsset[] = picked.map((p: any) => ({
                    uri: p.uri ?? p.file ?? p.uri,
                    name: p.name ?? p.fileName,
                    ...p,
                }));
                setFiles(normalized);
                onChange?.({ value: null, files: normalized, mode });
            }
        } catch (e) {
            console.warn("Picker error:", e);
        }
    };

    // Floating label animation
    const startFloat = enableFloating && ((text && text.length > 0) || files.length > 0);
    const floatAnim = useRef(new Animated.Value(startFloat ? 1 : 0)).current;

    useEffect(() => {
        if (!enableFloating) return;
        const shouldFloat = Boolean((text && String(text).length > 0) || files.length > 0 || focused);
        Animated.timing(floatAnim, {
            toValue: shouldFloat ? 1 : 0,
            duration: 160,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
        }).start();
    }, [text, files.length, focused, enableFloating, floatAnim]);

    const labelTranslateY = floatAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [6, -18],
    });
    const labelScale = floatAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 0.86],
    });
    const labelColor = error ? "#dc2626" : focused ? "black" : "gray";

    // Merge classes using helper (no clsx here)
    const rootClass = mergeClass("w-full", containerClassName);
    const wrapperClass = mergeClass(
        "flex-row items-center rounded-lg border bg-white px-3",
        disabled ? "opacity-50" : undefined,
        className,
    );
    const inputClass = mergeClass("flex-1 py-3 text-slate-900 text-base font-medium", inputClassName);

    return (
        <View className={rootClass} testID={testID} style={{ position: "relative" }}>
            {/* Floating label */}
            {label && enableFloating ? (
                <Animated.View
                    pointerEvents="none"
                    style={[
                        {
                            position: "absolute",
                            left: 12,
                            top: 10,
                            transform: [{ translateY: labelTranslateY }, { scale: labelScale }],
                            zIndex: 10,
                            backgroundColor: "white",
                            paddingHorizontal: 4,
                            alignSelf: "flex-start",
                        },
                        floatingLabelStyle as any,
                    ]}
                >
                    <Text
                        style={{
                            color: labelColor,
                            fontSize: 14,
                            fontWeight: "500",
                        }}
                    >
                        {label}
                        {required ? <Text style={{ color: "#dc2626" }}> *</Text> : null}
                    </Text>
                </Animated.View>
            ) : null}

            {/* Text-like input */}
            {isTextMode ? (
                <View
                    className={wrapperClass}
                    style={{
                        borderColor: error ? "#dc2626" : "#d1d5db",
                        paddingTop: enableFloating && label ? 20 : undefined,
                    }}
                >
                    {/* {Left ? <View className="mr-2">{<Left />}</View> : null} */}

                    <TextInput
                        ref={inputRef}
                        className={inputClass}
                        style={[{ color: "#0f172a", letterSpacing: finalSecure ? 4 : 0 }, rest.style]}
                        placeholder={enableFloating ? (placeholder ?? "") : placeholder}
                        placeholderTextColor="#9ca3af"
                        editable={!disabled && !readOnly}
                        value={text}
                        onChangeText={handleTextChange}
                        keyboardType={keyboardType as any}
                        secureTextEntry={finalSecure}
                        autoCapitalize={mode === "email" || isPasswordMode ? "none" : "sentences"}
                        autoCorrect={mode !== "email" && !isPasswordMode}
                        multiline={multiline || mode === "multiline"}
                        numberOfLines={numberOfLines}
                        returnKeyType="done"
                        onFocus={(e) => {
                            setFocused(true);
                            rest.onFocus?.(e);
                        }}
                        onBlur={(e) => {
                            setFocused(false);
                            rest.onBlur?.(e);
                        }}
                        {...(rest as TextInputProps)}
                    />

                    {mode === "password" && secureTextEntry === undefined ? (
                        <Pressable
                            onPress={() => setIsPasswordVisible((v) => !v)}
                            accessibilityRole="button"
                            accessibilityLabel={isPasswordVisible ? "Hide password" : "Show password"}
                        >
                            <Text className="ml-2">{isPasswordVisible ? "🙈" : "👁️"}</Text>
                        </Pressable>
                    ) : null}

                    {/* {Right ? <View className="ml-2">{<Right />}</View> : null} */}
                </View>
            ) : (
                /* file/image mode */
                <View
                    className={mergeClass(
                        "rounded-lg border bg-white px-3 py-3",
                        disabled ? "opacity-50" : undefined,
                        className,
                    )}
                    style={{ borderColor: error ? "#dc2626" : "#d1d5db" }}
                >
                    <Pressable
                        onPress={pickFileAsync}
                        disabled={disabled}
                        className="flex-row items-center justify-between"
                        accessibilityRole="button"
                        accessibilityLabel={mode === "image" ? "Pick image" : "Pick file"}
                    >
                        <Text className="text-base">
                            {files?.length
                                ? `${files.length} selected`
                                : placeholder || (mode === "image" ? "Choose image" : "Choose file")}
                        </Text>
                        <Text className="text-blue-600 font-semibold">Browse</Text>
                    </Pressable>

                    {files?.length ? (
                        <View className="mt-2">
                            {mode === "image" && imagePreview ? (
                                <View className="flex-row flex-wrap gap-2">
                                    {files.slice(0, maxFiles).map((f, idx) => (
                                        <Image
                                            key={idx}
                                            source={{ uri: f.uri }}
                                            className="h-20 w-20 rounded-md"
                                            style={{
                                                height: 80,
                                                width: 80,
                                                borderRadius: 8,
                                                marginRight: 8,
                                                marginBottom: 8,
                                            }}
                                        />
                                    ))}
                                </View>
                            ) : (
                                files.slice(0, maxFiles).map((f, idx) => (
                                    <Text key={idx} className="text-xs text-gray-600">
                                        {f.name || f.fileName || f.uri?.split("/").pop()}
                                    </Text>
                                ))
                            )}
                        </View>
                    ) : null}
                </View>
            )}

            {/* non-floating label (below input) */}
            {label && !enableFloating ? (
                <Text className="mb-1 mt-2 text-sm font-medium text-gray-800">
                    {label}
                    {required ? <Text className="text-red-500"> *</Text> : null}
                </Text>
            ) : null}

            {error ? (
                <Text className="mt-1 text-xs text-red-600">{error}</Text>
            ) : helper ? (
                <Text className="mt-1 text-xs text-gray-500">{helper}</Text>
            ) : null}
        </View>
    );
});

export default Input;
