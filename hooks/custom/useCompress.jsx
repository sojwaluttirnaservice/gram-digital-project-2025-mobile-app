// hooks/useCompress.js
import * as FileSystem from "expo-file-system";
import * as ImageManipulator from "expo-image-manipulator";
import { useCallback } from "react";

/**
 * React Native custom hook for compressing images below a specified size (in KB).
 * 
 * This hook leverages Expo's `ImageManipulator` and `FileSystem` APIs to:
 * - Iteratively reduce the image quality and/or width
 * - Ensure the resulting file size is below the given target size (default 100 KB)
 * - Return the compressed image URI along with its width and height
 * 
 * The compression process:
 * 1. Start with high quality (`0.9`) and width (`1200px`).
 * 2. Save and measure the file size using `FileSystem.getInfoAsync`.
 * 3. If file size > target, reduce quality in steps of `0.1`.
 * 4. Once quality reaches `0.1`, reset quality to `0.8` and shrink width by 20%.
 * 5. Repeat until the file is under the target size or width falls below 200px.
 * 
 * ⚠️ Safeguard: If the image cannot be compressed under the target size before 
 * reaching very small dimensions (<200px width), the last compressed result is returned.
 *
 * @returns {{
 *   compressImage: (
 *     uri: string,
 *     targetKB?: number
 *   ) => Promise<{ uri: string; width: number; height: number }>
 * }}
 *
 * @example
 * ```js
 * import useCompress from "@/hooks/useCompress";
 * 
 * const { compressImage } = useCompress();
 * 
 * const handleCompress = async () => {
 *   const compressed = await compressImage(imageUri, 80); // target = 80KB
 *   console.log("Compressed image:", compressed.uri, compressed.width, compressed.height);
 * };
 * ```
 */
const useCompress = () => {
    const compressImage = useCallback(
        /**
         * Compress an image to be under a specified file size in KB.
         *
         * @param {string} uri - Local URI of the image to compress (e.g., from ImagePicker).
         * @param {number} [targetKB=100] - Target size in kilobytes (default: 100KB).
         * @returns {Promise<{ uri: string; width: number; height: number }>} - 
         * A promise that resolves with the compressed image details:
         * - `uri`: local file path to the compressed image
         * - `width`: final image width in pixels
         * - `height`: final image height in pixels
         */
        async (uri, targetKB = 100) => {
            const MAX_SIZE = targetKB * 1024; // Convert KB → bytes for comparison
            let compressQuality = 0.9; // Start with high quality
            let width = 1200; // Start with a reasonable width
            let result = null;

            while (true) {
                // Perform image manipulation (resize + compress)
                result = await ImageManipulator.manipulateAsync(
                    uri,
                    [{ resize: { width } }], // only resize width, height auto-scales
                    {
                        compress: compressQuality, // quality between 0–1
                        format: ImageManipulator.SaveFormat.JPEG, // save as JPEG
                    }
                );

                // Check the file size of the new image
                const { size } = await FileSystem.getInfoAsync(result.uri);

                // If the compressed size meets requirement → return
                if (size <= MAX_SIZE) {
                    //console.log(`✅ Compressed under ${targetKB}KB at ${(size / 1024).toFixed(1)} KB`);
                    return result;
                }

                // If still too large, try lowering quality first
                if (compressQuality > 0.1) {
                    compressQuality -= 0.1; // decrease quality
                } else {
                    // If quality is too low, shrink width instead
                    width = Math.floor(width * 0.8); // reduce width by 20%
                    compressQuality = 0.8; // reset quality for next iteration
                }

                // Safeguard: Stop if width becomes too small
                if (width < 200) {
                    console.warn(
                        `⚠️ Could not compress under ${targetKB}KB, final size: ${(size / 1024).toFixed(1)} KB`
                    );
                    return result;
                }
            }
        },
        []
    );

    return { compressImage };
};

export default useCompress;
