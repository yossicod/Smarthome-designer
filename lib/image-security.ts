import {
    ALLOWED_STYLES,
    MAX_SOURCE_IMAGE_BYTES,
    IMAGE_FETCH_TIMEOUT_MS,
} from "./constants.ts";
import { dataUrlToBlob, isHostedUrl } from "./utils.ts";

export const sanitizeSelectedStyle = (
    style: string | null | undefined,
): string | null => {
    if (!style || typeof style !== "string") return null;
    const trimmed = style.trim();
    return (ALLOWED_STYLES as readonly string[]).includes(trimmed) ? trimmed : null;
};

export const isAllowedSourceImageUrl = (url: unknown): url is string => {
    if (typeof url !== "string" || !url) return false;
    if (url.startsWith("data:image/")) {
        const parsed = dataUrlToBlob(url);
        return !!parsed && parsed.blob.size <= MAX_SOURCE_IMAGE_BYTES;
    }
    return isHostedUrl(url);
};

const blobToDataUrl = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === "string") resolve(reader.result);
            else reject(new Error("Failed to read image"));
        };
        reader.onerror = () => reject(new Error("Failed to read image"));
        reader.readAsDataURL(blob);
    });

export const loadSourceImageAsDataUrl = async (url: string): Promise<string> => {
    if (!isAllowedSourceImageUrl(url)) {
        throw new Error("Source image URL is not allowed");
    }

    if (url.startsWith("data:")) return url;

    const controller = new AbortController();
    const timeoutId = window.setTimeout(
        () => controller.abort(),
        IMAGE_FETCH_TIMEOUT_MS,
    );

    try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.statusText}`);
        }

        const blob = await response.blob();
        if (blob.size > MAX_SOURCE_IMAGE_BYTES) {
            throw new Error("Source image exceeds maximum allowed size");
        }

        return await blobToDataUrl(blob);
    } finally {
        window.clearTimeout(timeoutId);
    }
};
