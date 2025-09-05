// components/Autocomplete.js
import clsx from "clsx";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Keyboard,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native";

/**
 * Autocomplete Component
 *
 * A flexible autocomplete input with dropdown suggestions.
 * Provides sensible defaults, but allows full customization
 * of rendering, styling, and behavior.
 *
 * Props:
 * @param {Array<any>}   [data=[]]                 List of suggestion items.
 * @param {string}       value                     Current input value (controlled).
 * @param {(text:string)=>void} onChange           Fired when input text changes.
 * @param {(item:any)=>void}    onSelect           Fired when a suggestion is selected.
 * @param {string}       [placeholder="Type to search..."] Placeholder text.
 * @param {boolean}      [loading=false]          Show a loading indicator under input.
 * @param {number}       [maxEntries=10]          Max items to feed into FlatList (soft limit).
 * @param {boolean}      [fillInputOnSelect=true] If true, writes selection into the input.
 * @param {boolean}      [closeOnSelect=true]     If true, closes dropdown + dismisses keyboard on select.
 * @param {number}       [maxDropdownHeight=240]  Max height (px) for dropdown before it scrolls.
 *
 * Custom renderers:
 * @param {(args:{ placeholder:string, value:string, onChangeText:(t:string)=>void })=>React.ReactNode} [renderInput]
 * @param {(args:{ item:any, index?:number, onSelect:()=>void })=>React.ReactNode}                       [renderItem]
 * @param {()=>React.ReactNode} [renderEmpty]
 *
 * Tailwind classes:
 * @param {string} [containerClass]
 * @param {string} [inputClass]
 * @param {string} [listClass]
 * @param {string} [itemClass]
 * @param {string} [overlayClass]                Tailwind classes for the backdrop overlay when open.
 *
 * RN style overrides:
 * @param {object} [containerStyle]
 * @param {object} [inputStyle]
 * @param {object} [listStyle]
 * @param {object} [itemStyle]
 * @param {object} [overlayStyle]                Style for the backdrop overlay when open.
 *
 * Value mapper:
 * @param {(item:any)=>string} [getDisplayValue] Maps item -> string shown in input (default: title|label|String(item)).
 */
const Autocomplete = ({
    data = [],
    value,
    onChange,
    onSelect,
    placeholder = "Type to search...",
    loading = false,
    maxEntries = 10,
    fillInputOnSelect = true,
    closeOnSelect = true,
    maxDropdownHeight = 240,

    // Custom renderers
    renderItem,
    renderInput,
    renderEmpty,

    // Tailwind class overrides
    containerClass = "",
    inputClass = "",
    listClass = "",
    itemClass = "",
    overlayClass = "",

    // RN style overrides
    containerStyle,
    inputStyle,
    listStyle,
    itemStyle,
    overlayStyle,

    // Maps selection -> string shown in input
    getDisplayValue = (item) => item?.title || item?.label || String(item ?? ""),
}) => {
    const [showList, setShowList] = useState(false);

    /** Handle input typing */
    const handleChange = useCallback(
        (text, fromSelect = false) => {
            onChange(text);
            if (!fromSelect) setShowList(true); // open only when user types
        },
        [onChange]
    );


    /** Handle selecting an item */
    const handleSelect = useCallback(
        (item) => {
            if (fillInputOnSelect) {
                handleChange(getDisplayValue(item), true); // write selection but don't re-open
            }
            onSelect?.(item);

            if (closeOnSelect) {
                setShowList(false);
                Keyboard.dismiss();
            }
        },
        [fillInputOnSelect, closeOnSelect, handleChange, getDisplayValue, onSelect]
    );

    /** Default item renderer — always accept { item, onSelect } */
    const defaultRenderItem = ({ item, onSelect }) => (
        <TouchableOpacity
            className={clsx(
                "p-3 border-b border-gray-200 bg-white active:bg-gray-100",
                itemClass
            )}
            style={itemStyle}
            onPress={onSelect}
        >
            <Text className="text-gray-800">{getDisplayValue(item)}</Text>
        </TouchableOpacity>
    );

    /** Default input renderer */
    const defaultRenderInput = (props) => (
        <TextInput
            {...props}
            placeholder={props.placeholder}
            value={props.value ?? ""}
            onChangeText={props.onChangeText}
            className={clsx(
                "border border-gray-300 rounded-xl p-3 text-base bg-white",
                inputClass
            )}
            style={inputStyle}
        />
    );

    /** Backdrop to dismiss when dropdown is open (avoids swallowing child presses) */
    const Backdrop = () =>
        showList ? (
            <TouchableWithoutFeedback
                onPress={() => {
                    setShowList(false);
                    Keyboard.dismiss();
                }}
            >
                <View
                    className={clsx("absolute inset-0", overlayClass)}
                    style={[StyleSheet.absoluteFillObject, overlayStyle]}
                />
            </TouchableWithoutFeedback>
        ) : null;

    return (
        <View className={clsx("w-full relative", containerClass)} style={containerStyle}>
            {/* Dismiss overlay (only when open) */}
            <Backdrop />

            {/* Input */}
            {renderInput
                ? renderInput({
                    placeholder,
                    value,
                    onChangeText: handleChange,
                })
                : defaultRenderInput({
                    placeholder,
                    value,
                    onChangeText: handleChange,
                })}

            {/* Loading indicator */}
            {loading && (
                <View className="mt-2 flex-row items-center">
                    <ActivityIndicator size="small" />
                    <Text className="ml-2 text-gray-500 text-sm">Loading...</Text>
                </View>
            )}

            {/* Dropdown */}
            {showList && (
                <View
                    className={clsx(
                        "absolute top-full left-0 right-0 z-50 border border-gray-300 rounded-xl mt-1 bg-white",
                        listClass
                    )}
                    style={[{ maxHeight: maxDropdownHeight }, listStyle]}
                >
                    {data.length > 0 ? (
                        <FlatList
                            data={data.slice(0, maxEntries)}
                            keyExtractor={(_, index) => index.toString()}
                            renderItem={({ item, index }) =>
                                renderItem
                                    ? renderItem({ item, index, onSelect: () => handleSelect(item) })
                                    : defaultRenderItem({ item, index, onSelect: () => handleSelect(item) })
                            }
                            keyboardShouldPersistTaps="always"   // ensure taps register with keyboard open
                            nestedScrollEnabled                   // allow scroll within scroll
                            showsVerticalScrollIndicator
                        />
                    ) : (
                        renderEmpty?.() ?? (
                            <Text className="p-3 text-gray-400 text-sm">No results found</Text>
                        )
                    )}
                </View>
            )}
        </View>
    );
};

export default Autocomplete;
