// NOT WORKING

// NOT WORKING YET

// components/Dropdown.tsx
import React, { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, FlatList, Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";

/**
 * Simple Dropdown (modal-first) that visually matches the Input component.
 * - Children API: <Dropdown><Dropdown.Item label value /></Dropdown>
 * - Floating label via isLabelFloating / floatingLabel
 * - Default: useModal = true (press trigger -> modal list) for consistent UX
 */

/* --- types --- */
export type DropdownItemProps = {
    label: string;
    value: string | number;
    key?: string | number;
};

export interface DropdownProps {
    selectedValue?: string | number | null;
    onValueChange?: (value: string | number) => void;
    children?: ReactNode; // expected Dropdown.Item nodes
    label?: string;
    required?: boolean;
    isLabelFloating?: boolean;
    floatingLabel?: boolean;
    placeholder?: string;
    helper?: string;
    error?: string | null;
    disabled?: boolean;
    arrowColor?: string;
    /** Default true for consistent behavior. Set false to attempt inline fallback. */
    useModal?: boolean;
    testID?: string;
}

/* --- Main dropdown base --- */
function DropdownBase(props: DropdownProps) {
    const {
        selectedValue,
        onValueChange,
        children,
        label,
        required = false,
        isLabelFloating = false,
        floatingLabel = false,
        placeholder = "-- Select --",
        helper,
        error = null,
        disabled = false,
        // arrowColor kept for API compatibility (not used in modal-first)
        arrowColor = "#374151",
        // default to true for consistent UX across platforms
        useModal = true,
        testID,
    } = props;

    const enableFloating = Boolean(isLabelFloating || floatingLabel);

    // normalize children -> items list
    const items = useMemo<DropdownItemProps[]>(() => {
        const out: DropdownItemProps[] = [];
        React.Children.forEach(children, (child) => {
            if (!child) return;
            const p = (child as any).props;
            if (!p) return;
            if (p.label !== undefined || p.value !== undefined) {
                out.push({
                    label: p.label ?? String(p.value ?? ""),
                    value: p.value,
                    key: p.key ?? p.value,
                });
            }
        });
        return out;
    }, [children]);

    // modal state
    const [visible, setVisible] = useState(false);
    const [tempValue, setTempValue] = useState<string | number | null>(selectedValue ?? null);

    // floating label animation
    const floatStart =
        enableFloating &&
        ((selectedValue !== null && selectedValue !== "" && selectedValue !== undefined) || items.length > 0);
    const floatAnim = useRef(new Animated.Value(floatStart ? 1 : 0)).current;

    useEffect(() => {
        if (!enableFloating) return;
        const shouldFloat = Boolean(
            (selectedValue !== null && selectedValue !== "" && selectedValue !== undefined) || visible,
        );
        Animated.timing(floatAnim, {
            toValue: shouldFloat ? 1 : 0,
            duration: 160,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
        }).start();
    }, [enableFloating, selectedValue, visible, floatAnim]);

    const labelTranslateY = floatAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [6, -18],
    });
    const labelScale = floatAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 0.85],
    });
    const labelColor = error ? "#dc2626" : disabled ? "#9ca3af" : "#374151";

    // actions
    const open = () => {
        if (disabled) return;
        if (useModal) {
            setTempValue(selectedValue ?? null);
            setVisible(true);
        }
    };
    const confirmModal = () => {
        setVisible(false);
        if (tempValue !== null && tempValue !== undefined) onValueChange?.(tempValue);
    };
    const cancelModal = () => {
        setVisible(false);
        setTempValue(selectedValue ?? null);
    };

    // selected label (shows placeholder if not found)
    const selectedLabel = useMemo(() => {
        const f = items.find((it) => it.value === selectedValue);
        return f ? String(f.label) : placeholder;
    }, [items, selectedValue, placeholder]);

    // Inline fallback (very simple) when useModal === false
    const InlineFallback = () => (
        <View style={{ width: "100%" }}>
            {Platform.OS === "android" ? (
                <View style={styles.inlineList}>
                    {items.map((it) => (
                        <TouchableOpacity
                            key={String(it.key ?? it.value)}
                            onPress={() => onValueChange?.(it.value)}
                            style={styles.inlineItem}
                        >
                            <Text
                                style={[
                                    styles.itemText,
                                    it.value === selectedValue ? { fontWeight: "700" } : undefined,
                                ]}
                            >
                                {it.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            ) : (
                <Text style={styles.placeholderText}>
                    Inline selection not available on this platform. Use useModal={true}.
                </Text>
            )}
        </View>
    );

    return (
        <View style={{ width: "100%", position: "relative", overflow: "visible" }} testID={testID}>
            {/* floating label */}
            {enableFloating && label ? (
                <Animated.View
                    pointerEvents="none"
                    style={{
                        position: "absolute",
                        left: 12,
                        top: 12,
                        transform: [{ translateY: labelTranslateY }, { scale: labelScale }],
                        backgroundColor: "#fff",
                        paddingHorizontal: 4,
                        zIndex: 10,
                    }}
                >
                    <Text
                        style={{
                            fontSize: 13,
                            fontWeight: "600",
                            color: labelColor,
                        }}
                    >
                        {label}
                        {required ? <Text style={{ color: "#dc2626" }}> *</Text> : null}
                    </Text>
                </Animated.View>
            ) : null}

            {/* Trigger */}
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={open}
                disabled={disabled}
                style={[styles.control, enableFloating && label ? { paddingTop: 20 } : undefined]}
            >
                <Text
                    style={[
                        styles.selectedText,
                        selectedValue === null || selectedValue === undefined || selectedValue === ""
                            ? styles.placeholderText
                            : undefined,
                    ]}
                    numberOfLines={1}
                >
                    {selectedLabel}
                </Text>
                <Text style={styles.browseText}>▾</Text>
            </TouchableOpacity>

            {/* helper / error */}
            {error ? (
                <Text style={[styles.helperText, { color: "#dc2626" }]}>{error}</Text>
            ) : helper ? (
                <Text style={styles.helperText}>{helper}</Text>
            ) : null}

            {/* Modal list */}
            {useModal && (
                <Modal visible={visible} animationType="slide" transparent>
                    <View style={modalStyles.backdrop}>
                        <View style={modalStyles.card}>
                            <View style={modalStyles.header}>
                                <TouchableOpacity onPress={cancelModal}>
                                    <Text style={modalStyles.actionText}>Cancel</Text>
                                </TouchableOpacity>
                                <Text style={modalStyles.title}>{label ?? "Select"}</Text>
                                <TouchableOpacity onPress={confirmModal}>
                                    <Text style={[modalStyles.actionText, { fontWeight: "700" }]}>Done</Text>
                                </TouchableOpacity>
                            </View>

                            <FlatList
                                data={items}
                                keyExtractor={(it) => String(it.key ?? it.value)}
                                renderItem={({ item }) => {
                                    const sel = item.value === tempValue;
                                    return (
                                        <TouchableOpacity
                                            onPress={() => setTempValue(item.value)}
                                            style={[modalStyles.item, sel && modalStyles.itemSelected]}
                                        >
                                            <Text
                                                style={[
                                                    modalStyles.itemText,
                                                    sel && {
                                                        fontWeight: "700",
                                                    },
                                                ]}
                                            >
                                                {item.label}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                }}
                                ItemSeparatorComponent={() => <View style={modalStyles.sep} />}
                            />
                        </View>
                    </View>
                </Modal>
            )}

            {/* Inline fallback */}
            {!useModal && <InlineFallback />}
        </View>
    );
}

/* --- Item helper / static attach --- */
function DropdownItem({ label, value }: DropdownItemProps) {
    // helper only — DropdownBase reads children props
    return null;
}
const Dropdown = DropdownBase as typeof DropdownBase & {
    Item: typeof DropdownItem;
};
Dropdown.Item = DropdownItem;
export default Dropdown;

/* --- styles --- */
const styles = StyleSheet.create({
    control: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#d1d5db",
        backgroundColor: "#ffffff",
        paddingHorizontal: 12,
        minHeight: 48,
        justifyContent: "space-between",
    },
    selectedText: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 16,
        color: "#111827",
    },
    placeholderText: {
        color: "#9ca3af",
    },
    browseText: {
        marginLeft: 8,
        color: "#374151",
        fontSize: 16,
    },
    helperText: {
        marginTop: 6,
        fontSize: 12,
        color: "#6b7280",
    },

    // inline fallback
    inlineList: {
        borderWidth: 1,
        borderColor: "#d1d5db",
        borderRadius: 8,
        overflow: "hidden",
        backgroundColor: "#fff",
    },
    inlineItem: { padding: 12 },
    itemText: { color: "#111827" },
});

const modalStyles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.45)",
        justifyContent: "center",
        padding: 16,
    },
    card: {
        backgroundColor: "white",
        borderRadius: 12,
        maxHeight: "80%",
        overflow: "hidden",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        borderBottomWidth: 1,
        borderColor: "#eee",
        justifyContent: "space-between",
    },
    actionText: { color: "#2563eb", fontSize: 15 },
    title: { fontSize: 15, fontWeight: "600", color: "#111827" },
    item: { padding: 14, backgroundColor: "white" },
    itemSelected: { backgroundColor: "#f8fafc" },
    itemText: { fontSize: 15, color: "#111827" },
    sep: { height: 1, backgroundColor: "#f3f4f6" },
});
