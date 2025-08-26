// components/Input.jsx
import clsx from "clsx";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import React, {
    forwardRef,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
} from "react";
import { Image, Platform, Pressable, Text, TextInput, View } from "react-native";

/**
 * A versatile Input for React Native + Expo.
 *
 * Supports:
 * - modes: text | password | email | number | multiline | file | image
 * - label/required/helper/error
 * - left/right accessories
 * - file & image picking (with preview)
 * - NativeWind className
 *
 * @typedef {Object} InputChange
 * @property {string|null} value - Current text value (for text-like modes).
 * @property {Array<any>|null} files - Selected files/assets (for file/image modes).
 * @property {"text"|"password"|"email"|"number"|"multiline"|"file"|"image"} mode
 */

/**
 * @param {Object} props
 * @param {"text"|"password"|"email"|"number"|"multiline"|"file"|"image"} [props.mode="text"] - Input behavior.
 * @param {string} [props.label] - Top label text.
 * @param {boolean} [props.required=false] - Shows * indicator.
 * @param {string} [props.placeholder] - Placeholder text.
 * @param {string} [props.value] - Controlled value (text-like modes).
 * @param {string} [props.defaultValue] - Uncontrolled initial value.
 * @param {(change: InputChange) => void} [props.onChange] - Unified change callback.
 * @param {(text: string) => void} [props.onChangeText] - Text-only change callback.
 * @param {string} [props.error] - Error message.
 * @param {string} [props.helper] - Helper/description text.
 * @param {boolean} [props.disabled=false]
 * @param {boolean} [props.readOnly=false]
 * @param {boolean} [props.multiline=false] - Forces multiline for text-like modes.
 * @param {number} [props.numberOfLines]
 * @param {boolean} [props.secureTextEntry] - Overrides secure behavior (non-password).
 * @param {string|string[]} [props.accept] - MIME(s) for file mode, e.g. "application/pdf" or ["image/*"].
 * @param {boolean} [props.multiple=false] - Allow multiple selection (file/image modes).
 * @param {number} [props.maxFiles=4] - Max items to preview.
 * @param {"any"|"images"|"videos"|"media"|"plainText"} [props.fileKinds="any"] - Quick presets for file filters.
 * @param {boolean} [props.imagePreview=true] - Show thumbnails for image mode.
 * @param {React.ComponentType|(() => JSX.Element)} [props.Left] - Left accessory.
 * @param {React.ComponentType|(() => JSX.Element)} [props.Right] - Right accessory.
 * @param {string} [props.className] - Tailwind classes for the input wrapper.
 * @param {string} [props.inputClassName] - Tailwind classes for the inner TextInput.
 * @param {string} [props.containerClassName] - Tailwind classes for the outer container.
 * @param {string} [props.testID]
 * @param {...any} [rest] - Any valid TextInput props get forwarded.
 */
const Input2 = forwardRef(function Input(props, ref) {
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
        Left,
        Right,
        className = "",
        inputClassName = "",
        containerClassName = "",
        testID,
        ...rest
    } = props;

    const inputRef = useRef(null);
    useImperativeHandle(ref, () => ({
        focus: () => inputRef.current?.focus(),
        blur: () => inputRef.current?.blur(),
        clear: () => inputRef.current?.clear(),
        getNativeRef: () => inputRef.current,
    }));

    // Controlled vs uncontrolled text
    const [internalText, setInternalText] = useState(defaultValue ?? "");
    const text = value != null ? value : internalText;

    // Files/images selected
    const [files, setFiles] = useState([]);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const isTextMode = mode !== "file" && mode !== "image";

    const keyboardType = useMemo(() => {
        switch (mode) {
            case "email":
                return "email-address";
            case "number":
                // NOTE: iOS "number-pad", Android "numeric" both work fine.
                return Platform.OS === "ios" ? "number-pad" : "numeric";
            default:
                return "default";
        }
    }, [mode]);

    const finalSecure =
        mode === "password" ? !isPasswordVisible : Boolean(secureTextEntry);

    const handleTextChange = (t) => {
        if (value == null) setInternalText(t);
        onChangeText?.(t);
        onChange?.({ value: t, files: null, mode });
    };

    const fileTypeFromPreset = () => {
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
                    allowsMultipleSelection: multiple,
                    quality: 0.9,
                });
                if (res.canceled) return;

                const assets = res.assets || [];
                setFiles(assets);
                onChange?.({ value: null, files: assets, mode });
            } else {
                const res = await DocumentPicker.getDocumentAsync({
                    multiple,
                    type: fileTypeFromPreset(),
                    copyToCacheDirectory: true,
                });
                if (res.canceled) return;

                // expo-document-picker v11 returns { assets: [...] }.
                // Older versions return single object.
                const picked = Array.isArray(res.assets) ? res.assets : [res];
                setFiles(picked);
                onChange?.({ value: null, files: picked, mode });
            }
        } catch (e) {
            console.warn("Picker error:", e);
        }
    };

    return (
        <View className={clsx("w-full", containerClassName)} testID={testID}>
            {label ? (
                <Text className="mb-1 text-sm font-medium text-gray-800">
                    {label}
                    {required ? <Text className="text-red-500"> *</Text> : null}
                </Text>
            ) : null}

            {isTextMode ? (
                <View
                    className={clsx(
                        "flex-row items-center rounded-lg border border-gray-300 bg-white px-3",
                        disabled && "opacity-50",
                        className
                    )}
                >
                    {Left ? <View className="mr-2">{<Left />}</View> : null}

                    <TextInput
                        ref={inputRef}
                        className={clsx("flex-1 py-3", inputClassName)}
                        placeholder={placeholder}
                        editable={!disabled && !readOnly}
                        value={text}
                        onChangeText={handleTextChange}
                        keyboardType={keyboardType}
                        secureTextEntry={finalSecure}
                        autoCapitalize={
                            mode === "email" || mode === "password" ? "none" : "sentences"
                        }
                        autoCorrect={mode !== "email" && mode !== "password"}
                        multiline={multiline || mode === "multiline"}
                        numberOfLines={numberOfLines}
                        returnKeyType="done"
                        {...rest}
                    />

                    {mode === "password" ? (
                        <Pressable
                            onPress={() => setIsPasswordVisible((v) => !v)}
                            accessibilityRole="button"
                            accessibilityLabel={isPasswordVisible ? "Hide password" : "Show password"}
                        >
                            <Text className="ml-2">{isPasswordVisible ? "🙈" : "👁️"}</Text>
                        </Pressable>
                    ) : null}

                    {Right ? <View className="ml-2">{<Right />}</View> : null}
                </View>
            ) : (
                <View
                    className={clsx(
                        "rounded-lg border border-gray-300 bg-white px-3 py-3",
                        disabled && "opacity-50",
                        className
                    )}
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

                    {/* Preview / filenames */}
                    {files?.length ? (
                        <View className="mt-2">
                            {mode === "image" && imagePreview ? (
                                <View className="flex-row flex-wrap gap-2">
                                    {files.slice(0, maxFiles).map((f, idx) => (
                                        <Image
                                            key={idx}
                                            source={{ uri: f.uri }}
                                            className="h-20 w-20 rounded-md"
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

            {error ? (
                <Text className="mt-1 text-xs text-red-600">{error}</Text>
            ) : helper ? (
                <Text className="mt-1 text-xs text-gray-500">{helper}</Text>
            ) : null}
        </View>
    );
});

export default Input2;
