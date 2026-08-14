// components/custom/utils/ServerImage.jsx
import { noImageFoundFallbackImage } from "@/access-files/access-images/fallbackImages";
import { Image } from "expo-image";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useSelector } from "react-redux";
import { twMerge } from "tailwind-merge";

/**
 * Normalize a source value to something expo-image accepts:
 * - local asset (require(...)) -> number (return as-is)
 * - absolute URL/file URI string -> string (return as-is)
 * - relative path string -> prefix with serverUrl and return full string
 * - object with { uri } -> return as-is
 *
 * @param {string|number|{uri:string}|null|undefined} value
 * @param {string} serverUrl
 * @returns {string|number|{uri:string}|null}
 */
const resolveSource = (value, serverUrl) => {
    if (!value) return null;

    // local asset (require(...)) => number
    if (typeof value === "number") return value;

    // object with uri already
    if (typeof value === "object" && value.uri) return value;

    if (typeof value === "string") {
        const s = value.trim();
        if (!s) return null;

        // absolute urls / file uris / asset uris
        if (
            s.startsWith("http://") ||
            s.startsWith("https://") ||
            s.startsWith("file://") ||
            s.startsWith("asset://")
        ) {
            return s;
        }

        // relative path -> prefix server url (ensure leading slash)
        const path = s.startsWith("/") ? s : `/${s}`;
        return `${serverUrl}${path}`;
    }

    return null;
};

/**
 * @typedef {Object} ServerImageProps
 * @property {string|number|{uri:string}} src - Primary source (server-relative path, absolute URL, local require, or {uri})
 * @property {string|number|{uri:string}} [fallback] - Fallback to use when primary fails (local require or URL)
 * @property {string|number|{uri:string}} [placeholder] - Placeholder shown before load (optional)
 * @property {object} [containerStyle] - Style applied to the outer container view (RN style object)
 * @property {object} [imageStyle] - Style applied to the Image (RN style object)
 * @property {string} [className] - tailwind class for container (nativewind) — optional
 * @property {string} [imageClassName] - tailwind class for image (nativewind) — optional
 * @property {number} [blurRadius] - Blur radius (default 0)
 * @property {"memory"|"disk"|"none"} [cachePolicy] - Expo image cache policy (default 'memory')
 * @property {(event?: any)=>void} [onError] - callback when image fails to load
 * @property {(event?: any)=>void} [onLoadStart] - callback when load starts
 * @property {(event?: any)=>void} [onLoadEnd] - callback when load ends
 */

/**
 * ServerImage
 *
 * Robust image component that:
 * - resolves relative server paths to absolute URLs using `serverUrl` from redux
 * - accepts local assets (require(...)), remote urls, or { uri } objects
 * - shows placeholder and an activity indicator while loading
 * - falls back to a provided fallback or default asset on error
 * - never lets the fallback get overwritten by a stale `src` (bug fix)
 *
 * NOTE: `loading` (lazy|eager) from web is a no-op for `expo-image` and not used here.
 *
 * @param {ServerImageProps} props
 */
const ServerImage = ({
    src,
    fallback,
    placeholder,
    containerStyle,
    imageStyle,
    className,
    imageClassName,
    blurRadius = 0,
    cachePolicy = "memory",
    onError,
    onLoadStart,
    onLoadEnd,
    ...imageProps
}) => {
    const { serverUrl } = useSelector((s) => s.connection ?? { serverUrl: "" });

    // resolved values from props (do NOT mutate these when a load error occurs)
    const resolvedPrimary = useMemo(() => resolveSource(src, serverUrl), [src, serverUrl]);
    const resolvedPlaceholder = useMemo(
        () => resolveSource(placeholder ?? null, serverUrl),
        [placeholder, serverUrl]
    );
    const resolvedFallbackProp = useMemo(() => resolveSource(fallback ?? null, serverUrl), [
        fallback,
        serverUrl,
    ]);
    const resolvedDefaultFallback = useMemo(
        () => resolveSource(noImageFoundFallbackImage, serverUrl),
        [serverUrl]
    );

    // internal state: `activeSource` is what we pass to expo-image.
    // Unlike earlier versions, once we switch to a fallback due to an error,
    // we *do not* override it until `src` actually changes (avoids override loops).
    const [activeSource, setActiveSource] = useState(
        resolvedPrimary ?? resolvedPlaceholder ?? resolvedFallbackProp ?? resolvedDefaultFallback
    );
    const [isLoading, setIsLoading] = useState(true);
    const [erroredForSrc, setErroredForSrc] = useState(null); // record which primary src errored

    // When the incoming src actually changes (different reference), adopt it and reset error state
    useEffect(() => {
        // If primary changed and is different from erroredForSrc, reset to primary/placeholder
        if (resolvedPrimary && resolvedPrimary !== erroredForSrc) {
            setActiveSource(resolvedPrimary);
            setErroredForSrc(null);
            setIsLoading(true);
            return;
        }

        // If no primary, but placeholder exists, use placeholder
        if (!resolvedPrimary && resolvedPlaceholder) {
            setActiveSource(resolvedPlaceholder);
            setErroredForSrc(null);
            setIsLoading(true);
            return;
        }

        // otherwise keep whatever is active (don't override a fallback previously set by error)
    }, [resolvedPrimary, resolvedPlaceholder, erroredForSrc]);

    // Build stable recyclingKey so expo-image reliably re-renders when source changes
    const recyclingKey = useMemo(() => {
        try {
            if (typeof activeSource === "number") return `asset:${activeSource}`;
            if (typeof activeSource === "string") return activeSource;
            if (typeof activeSource === "object" && activeSource?.uri) return activeSource.uri;
            return undefined;
        } catch {
            return undefined;
        }
    }, [activeSource]);

    // merge tailwind classNames if provided (twMerge lets user pass conflicting classes safely)
    const containerClass = twMerge(className ?? "");
    const imgClass = twMerge(imageClassName ?? "");

    return (
        <View className={containerClass} style={[styles.container, containerStyle]}>
            {isLoading && (
                <ActivityIndicator style={StyleSheet.absoluteFill} size="small" color="#999" />
            )}

            <Image
                // expo-image accepts string | number | { uri }
                source={activeSource}
                recyclingKey={recyclingKey}
                style={[{ width: "100%", height: "100%" }, imageStyle]}
                className={imgClass}
                contentFit="cover"
                transition={300}
                blurRadius={blurRadius}
                cachePolicy={cachePolicy}
                onLoadStart={(e) => {
                    setIsLoading(true);
                    onLoadStart?.(e);
                }}
                onLoadEnd={(e) => {
                    setIsLoading(false);
                    onLoadEnd?.(e);
                }}
                onError={(e) => {
                    // If the primary src failed, set fallback (prefer explicit fallback prop)
                    // and mark that the `resolvedPrimary` failed so we don't override later.
                    setIsLoading(false);

                    // If primary exists and wasn't equal to resolvedFallbackProp/default, set fallback
                    const chosenFallback = resolvedFallbackProp ?? resolvedDefaultFallback;
                    if (chosenFallback && chosenFallback !== activeSource) {
                        setActiveSource(chosenFallback);
                    }

                    // Mark the primary as errored so useEffect doesn't overwrite fallback with a stale src
                    if (resolvedPrimary) setErroredForSrc(resolvedPrimary);

                    onError?.(e);
                }}
                {...imageProps}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: "relative",
        overflow: "hidden",
        borderRadius: 8,
        backgroundColor: "#f0f0f0",
        width: "100%",
        height: 200,
    },
});

export default ServerImage;
