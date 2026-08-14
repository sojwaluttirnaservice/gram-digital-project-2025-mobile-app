// components/FileInput.js
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import * as Sharing from "expo-sharing";
import React, {
    useCallback,
    useImperativeHandle,
    useMemo,
    useState
} from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Linking,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native";

/**
 * @typedef {Object} FileInputProps
 * @property {"all"|"image"|"file"} [mode] - Which pickers to allow. Default: "all"
 * @property {(file: object|null)=>void} [onPick] - Called whenever a file is chosen/cleared.
 * @property {(file: object|null)=>void} [onChange] - Alias for onPick (works with react-hook-form).
 * @property {(file: object|null)=>void} [onRemove] - Called when user removes file.
 * @property {object|null} [value] - Controlled value (normalized file object).
 * @property {string} [label] - Optional label shown above control.
 * @property {boolean} [showPreview] - Show thumbnail for images. Default true.
 * @property {boolean} [allowCamera] - Offer camera option when mode !== "file". Default true.
 * @property {boolean} [allowRemove] - Show remove (x) button. Default true.
 * @property {number} [maxFileSize] - Max file size in bytes (optional).
 * @property {string} [placeholder] - Placeholder text when nothing selected.
 * @property {string|string[]} [acceptTypes] - For documents: mime(s) or extensions.
 */

/**
 * FileInput component
 * @type {React.ForwardRefExoticComponent<React.PropsWithoutRef<FileInputProps> & React.RefAttributes<any>>}
 */
const FileInput = React.forwardRef((props, ref) => {
    const {
        mode = "all",
        onPick,
        onChange,
        onRemove,
        value,
        label,
        showPreview = true,
        allowCamera = true,
        allowRemove = true,
        maxFileSize,
        placeholder = "Select file",
        acceptTypes = "*/*",
    } = props;
    const [internalFile, setInternalFile] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Use controlled `value` if provided, otherwise internal state
    const file = value ?? internalFile;

    // Utility: call both callbacks (if supplied) and update internal state if uncontrolled
    const emitPick = useCallback(
        (f) => {
            if (value === undefined) {
                // uncontrolled — update internal state
                setInternalFile(f);
            }
            onPick?.(f);
            onChange?.(f);
        },
        [onPick, onChange, value]
    );

    // Try to pick the best media constant to avoid deprecation warnings across expo versions.
    const MEDIA_IMAGES = useMemo(() => {
        // prefer new API if available
        if (ImagePicker?.MediaType && ImagePicker.MediaType.Images) return ImagePicker.MediaType.Images;
        // fallback to older constant, if present
        if (ImagePicker?.MediaTypeOptions && ImagePicker.MediaTypeOptions.Images) return ImagePicker.MediaTypeOptions.Images;
        // last resort: undefined (library will fallback)
        return undefined;
    }, []);

    /**
     * Normalize various picker outputs to a consistent shape:
     * { uri, name, size, mimeType, kind: 'image'|'video'|'file', width?, height? }
     */
    const normalizeFile = useCallback(async (raw) => {
        if (!raw) return null;

        // DocumentPicker result: { type: 'success'|'cancel', uri, name, size, mimeType }
        if (raw.type === "success" && raw.uri) {
            return {
                uri: raw.uri,
                name: raw.name || raw.uri.split("/").pop(),
                size: raw.size ?? null,
                mimeType: raw.mimeType ?? null,
                kind: "file",
            };
        }

        // ImagePicker result: { canceled: boolean, assets: [ { uri, fileName, fileSize, width, height, type } ] }
        if (raw.assets && raw.assets.length > 0) {
            const a = raw.assets[0];
            return {
                uri: a.uri,
                name: a.fileName || a.uri.split("/").pop(),
                size: a.fileSize ?? null,
                mimeType:
                    a.type === "image"
                        ? a.uri?.match(/\.(jpg|jpeg|png|gif)$/i)
                            ? `image/${a.uri.split(".").pop()}`
                            : "image/*"
                        : "video/*",
                width: a.width,
                height: a.height,
                kind: a.type === "image" ? "image" : "video",
            };
        }

        // Fallback: raw has uri/name
        if (raw.uri) {
            return {
                uri: raw.uri,
                name: raw.name || raw.uri.split("/").pop(),
                size: raw.size ?? null,
                mimeType: raw.mimeType ?? null,
                kind: "file",
            };
        }

        return null;
    }, []);

    const pickImageFromLibrary = useCallback(async () => {
        try {
            setModalOpen(false);
            setLoading(true);

            const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!perm.granted) {
                Alert.alert("Permission required", "Please allow access to your photos.");
                setLoading(false);
                return;
            }

            const res = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: MEDIA_IMAGES, // new API (best effort)
                quality: 0.9,
                allowsEditing: false,
            });

            if (!res.canceled) {
                const normalized = await normalizeFile(res);
                if (maxFileSize && normalized?.size && normalized.size > maxFileSize) {
                    Alert.alert("File too large", "Please pick a smaller file.");
                    setLoading(false);
                    return;
                }
                emitPick(normalized);
            }
        } catch (err) {
            console.error("pickImageFromLibrary:", err);
            Alert.alert("Error", "Could not pick image");
        } finally {
            setLoading(false);
        }
    }, [MEDIA_IMAGES, normalizeFile, emitPick, maxFileSize]);

    const takePhoto = useCallback(async () => {
        try {
            setModalOpen(false);
            setLoading(true);

            const perm = await ImagePicker.requestCameraPermissionsAsync();
            if (!perm.granted) {
                Alert.alert("Permission required", "Please allow camera access.");
                setLoading(false);
                return;
            }

            const res = await ImagePicker.launchCameraAsync({
                mediaTypes: MEDIA_IMAGES,
                quality: 0.9,
                allowsEditing: false,
            });

            if (!res.canceled) {
                const normalized = await normalizeFile(res);
                emitPick(normalized);
            }
        } catch (err) {
            console.error("takePhoto:", err);
            Alert.alert("Error", "Could not take photo");
        } finally {
            setLoading(false);
        }
    }, [MEDIA_IMAGES, normalizeFile, emitPick]);

    const pickDocument = useCallback(async () => {
        try {
            setModalOpen(false);
            setLoading(true);

            const res = await DocumentPicker.getDocumentAsync({
                copyToCacheDirectory: true,
                type: acceptTypes ?? "*/*",
            });

            if (res.type === "success") {
                const normalized = await normalizeFile(res);
                if (maxFileSize && normalized?.size && normalized.size > maxFileSize) {
                    Alert.alert("File too large", "Please pick a smaller file.");
                    setLoading(false);
                    return;
                }
                emitPick(normalized);
            }
        } catch (err) {
            console.error("pickDocument:", err);
            Alert.alert("Error", "Could not pick document");
        } finally {
            setLoading(false);
        }
    }, [normalizeFile, emitPick, maxFileSize, acceptTypes]);

    /**
     * Safe getBase64: handles file:// and content:// URIs by ensuring
     * we have a local file path we can read. For content URIs on Android
     * we attempt a download to cache first.
     */
    const getBase64 = useCallback(async () => {
        if (!file?.uri) return null;
        try {
            let uri = file.uri;

            // If content URI on Android (content://) - try downloading it to cache
            if (Platform.OS === "android" && uri.startsWith("content://")) {
                const dest = `${FileSystem.cacheDirectory}${file.name || `tmp-${Date.now()}`}`;
                try {
                    const d = await FileSystem.downloadAsync(uri, dest);
                    uri = d.uri;
                } catch (err) {
                    // fallback - try reading directly (may fail)
                    console.warn("downloadAsync for content:// failed:", err);
                }
            }

            const b64 = await FileSystem.readAsStringAsync(uri, {
                encoding: FileSystem.EncodingType.Base64,
            });
            return b64;
        } catch (err) {
            console.warn("getBase64 error:", err);
            Alert.alert("Error", "Could not read file as base64");
            return null;
        }
    }, [file]);

    /**
     * Try to open externally: Linking for http(s) or file://; fallback to Sharing.shareAsync
     */
    const openExternally = useCallback(async () => {
        if (!file?.uri) {
            return false;
        }
        try {
            await Linking.openURL(file.uri);
            return true;
        } catch (err) {
            try {
                if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(file.uri);
                    return true;
                }
            } catch (err2) {
                console.warn("openExternally fallback failed", err2);
            }
            return false;
        }
    }, [file]);

    // Imperative API exposed to parent via ref
    useImperativeHandle(
        ref,
        () => ({
            getFile: () => file,
            clear: () => {
                if (value === undefined) setInternalFile(null);
                emitPick(null);
            },
            getBase64,
            openExternally,
        }),
        [file, getBase64, openExternally, emitPick, value]
    );

    // UI helpers
    const showOptions = () => setModalOpen(true);
    const removeFile = () => {
        if (value === undefined) setInternalFile(null);
        emitPick(null);
        onRemove?.(file ?? null);
    };

    return (
        <View style={{ marginBottom: 12 }}>
            {label ? <Text style={styles.label}>{label}</Text> : null}

            <View style={styles.input}>
                {/* Tappable area for opening modal */}
                <Pressable style={styles.flexRow} onPress={showOptions}>
                    <Ionicons name="attach-outline" size={18} color="#6b7280" />
                    <Text style={styles.filename} numberOfLines={1}>
                        {file?.name || placeholder}
                    </Text>

                    {loading ? (
                        <ActivityIndicator />
                    ) : (
                        <>
                            {file && showPreview && file.kind === "image" ? (
                                <Image source={{ uri: file.uri }} style={styles.thumb} />
                            ) : null}

                            {/* Chevron only if no remove btn */}
                            {!file || !allowRemove ? (
                                <Ionicons name="chevron-down-outline" size={18} color="#6b7280" />
                            ) : null}
                        </>
                    )}
                </Pressable>

                {/* Remove button OUTSIDE Pressable */}
                {file && allowRemove && !loading ? (
                    <TouchableOpacity
                        onPress={removeFile}
                        style={styles.removeBtn}
                        accessibilityLabel="Remove file"
                    >
                        <Ionicons name="close" size={14} color="#fff" />
                    </TouchableOpacity>
                ) : null}
            </View>
            {/* Modal action sheet */}
            <Modal visible={modalOpen} transparent animationType="slide" onRequestClose={() => setModalOpen(false)}>
                {/* Backdrop - closes modal when tapped */}
                <TouchableWithoutFeedback onPress={() => setModalOpen(false)}>
                    <View style={styles.modalBackdrop} />
                </TouchableWithoutFeedback>

                <View style={styles.modal}>
                    {mode !== "file" && (
                        <TouchableOpacity style={styles.modalItem} onPress={pickImageFromLibrary}>
                            <Text style={styles.modalText}>Pick from gallery</Text>
                        </TouchableOpacity>
                    )}

                    {mode !== "file" && allowCamera && (
                        <TouchableOpacity style={styles.modalItem} onPress={takePhoto}>
                            <Text style={styles.modalText}>Take a photo</Text>
                        </TouchableOpacity>
                    )}

                    {mode !== "image" && (
                        <TouchableOpacity style={styles.modalItem} onPress={pickDocument}>
                            <Text style={styles.modalText}>Pick a document</Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity style={[styles.modalItem, { borderTopWidth: 1, borderTopColor: "#eee" }]} onPress={() => setModalOpen(false)}>
                        <Text style={[styles.modalText, { color: "#ef4444" }]}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        </View>
    );
}
);

// Fix ESLint react/display-name for forwardRef
FileInput.displayName = "FileInput";

const styles = StyleSheet.create({
    label: {
        marginBottom: 6,
        fontSize: 14,
        color: "#374151",
        fontWeight: "600",
    },
    input: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#D1D5DB",
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: "#fff",
    },
    flexRow: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1, // ensures filename + preview stretch
    },
    filename: {
        marginLeft: 8,
        flex: 1,
        color: "#111827",
    },
    thumb: {
        width: 36,
        height: 36,
        borderRadius: 6,
        marginLeft: 8,
    },
    removeBtn: {
        marginLeft: 8,
        backgroundColor: "#ef4444",
        borderRadius: 16,
        padding: 4,
        alignItems: "center",
        justifyContent: "center",
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.35)",
    },
    modal: {
        backgroundColor: "#fff",
        padding: 16,
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
    },
    modalItem: {
        paddingVertical: 14,
    },
    modalText: {
        fontSize: 16,
        color: "#111827",
    },
});

export default FileInput;
