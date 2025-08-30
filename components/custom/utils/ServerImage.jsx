import { noImageFoundFallbackImage } from "@/access-files/access-images/fallbackImages";
import { Image } from "expo-image";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

/**
 * ServerImage Props
 * @typedef {Object} ServerImageProps
 * @property {string} src - Relative server image path (e.g., "/uploads/photo.jpg")
 * @property {string} [fallback] - Fallback image URI if loading fails
 * @property {string} [placeholder] - Optional placeholder while loading
 * @property {"lazy"|"eager"} [loading] - Lazy or eager loading (default: 'eager')
 * @property {string} [serverUrl] - Base server URL (default: http://192.168.1.12:5900)
 * @property {object} [style] - React Native style for container
 * @property {string} [className] - Tailwind className for container (nativewind)
 * @property {number} [blurRadius] - Blur effect while loading (default 0)
 * @property {string} [cachePolicy] - Cache policy for Expo Image ('memory', 'disk', 'none')
 * @property {function} [onError] - Callback on image load error
 * @property {function} [onLoadStart] - Callback when image starts loading
 * @property {function} [onLoadEnd] - Callback when image finishes loading
 * @property {object} [imageProps] - Additional props passed to the Image component
 */

/**
 * ServerImage
 * @param {ServerImageProps} props
 */
const ServerImage = ({
    src,
    fallback,
    placeholder,
    loading = "eager",
    serverUrl = "http://192.168.1.12:5900",
    style,
    className,
    blurRadius = 0,
    cachePolicy = "memory",
    onError,
    onLoadStart,
    onLoadEnd,
    ...imageProps
}) => {
    const [imageSrc, setImageSrc] = useState(src || placeholder);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setImageSrc(src || placeholder);
    }, [src, placeholder]);

    const fullUri = imageSrc?.startsWith("http") ? imageSrc : `${serverUrl}${imageSrc}`;

    // Optional: merge Tailwind className with inline styles
    const containerStyle = [styles.container, style];

    return (
        <View className={className} style={containerStyle}>
            {isLoading && (
                <ActivityIndicator
                    style={StyleSheet.absoluteFill}
                    size="small"
                    color="#999"
                />
            )}
            <Image
                source={fullUri}
                style={[StyleSheet.absoluteFill, style]}
                contentFit="cover"
                transition={300}
                loading={loading}
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
                    if (fallback) {
                        setImageSrc(fallback.startsWith("http") ? fallback : `${serverUrl}${fallback}`);
                    }else{
                        setImageSrc(noImageFoundFallbackImage)
                    }
                    setIsLoading(false);
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
        width: "100%",
        height: 200,
        overflow: "hidden",
        borderRadius: 8,
        backgroundColor: "#f0f0f0",
    },
});

export default ServerImage;
