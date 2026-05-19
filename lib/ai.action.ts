import type {Generate3DViewParams} from "../types.ts";
import {puter} from "@heyputer/puter.js";
import {RENDER_PROMPT, RENDER_VARIATION_PROMPT, RENDER_NEGATIVE_PROMPT, MAX_SOURCE_IMAGE_BYTES} from "./constants.ts";
import {loadSourceImageAsDataUrl, sanitizeSelectedStyle} from "./image-security.ts";
import {isHostedUrl, prepareSourceImageForRender} from "./utils.ts";

const blobToDataUrl = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === "string") resolve(reader.result);
            else reject(new Error("FileReader result is not a string"));
        };
        reader.onerror = () => reject(new Error("Failed to read blob as Data URL"));
        reader.readAsDataURL(blob);
    });

/** Fetches AI output URLs (hosted Puter assets or data URLs only). */
const fetchAiOutputAsDataUrl = async (url: string): Promise<string> => {
    if (url.startsWith("data:")) return url;
    if (!isHostedUrl(url)) {
        throw new Error("AI output URL is not allowed");
    }
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch image from ${url}: ${response.statusText}`);
    }
    const blob = await response.blob();
    if (blob.size > MAX_SOURCE_IMAGE_BYTES) {
        throw new Error("Rendered image exceeds maximum allowed size");
    }
    return blobToDataUrl(blob);
};

const buildRenderPrompt = (selectedStyle: string | null | undefined, mode: Generate3DViewParams['mode']) => {
    const safeStyle = sanitizeSelectedStyle(selectedStyle);
    const basePrompt = mode === 'variation'
        ? `${RENDER_PROMPT}\n\n${RENDER_VARIATION_PROMPT}`
        : RENDER_PROMPT;
    return safeStyle ? `${basePrompt}\n\nStyle: ${safeStyle}` : basePrompt;
};

export const generate3DView = async ({ sourceImage, selectedStyle, mode = 'initial' }: Generate3DViewParams) => {
    const dataUrl = await loadSourceImageAsDataUrl(sourceImage);
    const { dataUrl: preparedUrl, width, height } = await prepareSourceImageForRender(dataUrl);

    const base64Data = preparedUrl.split(",")[1];
    const mimeType = preparedUrl.split(";")[0].split(":")[1];
    if (!base64Data || !mimeType) {
        throw new Error("Invalid source image payload");
    }
    const response = await puter.ai.txt2img(
        buildRenderPrompt(selectedStyle, mode),
        {
            provider: 'Gemini',
            model: 'Gemini-2.5-flash-image-preview',
            input_image: base64Data,
            input_image_mime_type: mimeType,
            negative_prompt: RENDER_NEGATIVE_PROMPT,
            ratio: { w: width, h: height },
        },
    );

    const rawImageUrl = (response as HTMLImageElement).src ?? null
    if (!rawImageUrl) return { renderedImage: null, renderedPath: undefined }

    const renderedImage = rawImageUrl.startsWith("data:")
        ? rawImageUrl
        : await fetchAiOutputAsDataUrl(rawImageUrl);
    return { renderedImage, renderedPath: undefined }
}