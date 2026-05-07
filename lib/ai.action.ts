import {Generate3DViewParams} from "../types.ts";
import {puter} from "@heyputer/puter.js";
import {RENDER_PROMPT} from "./constants.ts";

/**
 * Fetches an image from a URL and converts it to a Data URL.
 * 
 * @param url - The URL of the image to fetch.
 * @returns A Promise that resolves with the Data URL string.
 */
export const fetchAsDataUrl = async (url: string): Promise<string> => {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch image from ${url}: ${response.statusText}`);
    }

    const blob = await response.blob();

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === "string") {
                resolve(reader.result);
            } else {
                reject(new Error("FileReader result is not a string"));
            }
        };
        reader.onerror = () => {
            reject(new Error("Failed to read blob as Data URL"));
        };
        reader.readAsDataURL(blob);
    });
};
export const generate3DView = async ({ sourceImage}: Generate3DViewParams) => {
    const dataUrl = sourceImage.startsWith("data:")
        ? sourceImage : await fetchAsDataUrl(sourceImage);

    const base64Data = dataUrl.split(",")[1];
    const mimeType = dataUrl.split(";")[0].split(":")[1];
    if (!base64Data || !mimeType) {
        throw new Error("Invalid source image payload");
    }
    const response = await puter.ai.txt2img(RENDER_PROMPT, {
        provider: 'Gemini',
        model: 'Gemini-2.5-flash-image-preview',
        input_image: base64Data,
        input_image_mime_type: mimeType,
        ratio: { w: 1024, h: 1024}

    })

    const rawImageUrl = (response as HTMLImageElement).src ?? null
    if (!rawImageUrl) return { renderedImage: null, renderedPath: undefined }

    const renderedImage = rawImageUrl.startsWith("data:") ? rawImageUrl : await fetchAsDataUrl(rawImageUrl)
    return { renderedImage, renderedPath: undefined }
}