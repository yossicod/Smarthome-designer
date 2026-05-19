import {IMAGE_RENDER_DIMENSION} from "./constants.ts";

export const HOSTING_CONFIG_KEY = "roomify_hosting_config";
export const HOSTING_DOMAIN_SUFFIX = ".puter.site";

const roundDimension = (value: number) =>
    Math.max(256, Math.round(value / 8) * 8);

/** Keeps source aspect ratio; longest side capped at maxDim. */
export const computeRenderDimensions = (
    width: number,
    height: number,
    maxDim = IMAGE_RENDER_DIMENSION,
): { w: number; h: number } => {
    if (!width || !height) return { w: maxDim, h: maxDim };
    const scale = Math.min(1, maxDim / Math.max(width, height));
    return {
        w: roundDimension(width * scale),
        h: roundDimension(height * scale),
    };
};

const loadImageFromDataUrl = (dataUrl: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = dataUrl;
    });

/**
 * Fits the plan into a render canvas matching its aspect ratio (letterboxed).
 * Input/output dimensions align so the model does not stretch or overscale the building.
 */
export const prepareSourceImageForRender = async (
    dataUrl: string,
): Promise<{ dataUrl: string; width: number; height: number }> => {
    const img = await loadImageFromDataUrl(dataUrl);
    const srcW = img.naturalWidth || img.width;
    const srcH = img.naturalHeight || img.height;
    const { w, h } = computeRenderDimensions(srcW, srcH);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");

    ctx.fillStyle = "#f4f4f4";
    ctx.fillRect(0, 0, w, h);

    const fitScale = Math.min(w / srcW, h / srcH);
    const drawW = srcW * fitScale;
    const drawH = srcH * fitScale;
    const offsetX = (w - drawW) / 2;
    const offsetY = (h - drawH) / 2;
    ctx.drawImage(img, offsetX, offsetY, drawW, drawH);

    return { dataUrl: canvas.toDataURL("image/png"), width: w, height: h };
};

export const isHostedUrl = (value: unknown): value is string =>
    typeof value === "string" &&
    (() => {
        try {
            const hostname = new URL(value).hostname;
            return hostname === "puter.site" || hostname.endsWith(HOSTING_DOMAIN_SUFFIX);
        } catch {
            return false;
        }
    })();

export const createHostingSlug = () =>
    `roomify-${Date.now().toString(36)}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;

const normalizeHost = (subdomain: string) =>
    subdomain.endsWith(HOSTING_DOMAIN_SUFFIX)
        ? subdomain
        : `${subdomain}${HOSTING_DOMAIN_SUFFIX}`;

export const getHostedUrl = (
    hosting: { subdomain: string },
    filePath: string,
): string | null => {
    if (!hosting?.subdomain) return null;
    const host = normalizeHost(hosting.subdomain);
    return `https://${host}/${filePath}`;
};

export const getImageExtension = (contentType: string, url: string): string => {
    const type = (contentType || "").toLowerCase();
    const typeMatch = type.match(/image\/(png|jpe?g|webp|gif|svg\+xml|svg)/);
    if (typeMatch?.[1]) {
        const ext = typeMatch[1].toLowerCase();
        return ext === "jpeg" || ext === "jpg"
            ? "jpg"
            : ext === "svg+xml"
                ? "svg"
                : ext;
    }

    const dataMatch = url.match(/^data:image\/([a-z0-9+.-]+);/i);
    if (dataMatch?.[1]) {
        const ext = dataMatch[1].toLowerCase();
        return ext === "jpeg" ? "jpg" : ext;
    }

    const extMatch = url.match(/\.([a-z0-9]+)(?:$|[?#])/i);
    if (extMatch?.[1]) return extMatch[1].toLowerCase();

    return "png";
};

export const dataUrlToBlob = (
    dataUrl: string,
): { blob: Blob; contentType: string } | null => {
    try {
        const match = dataUrl.match(/^data:([^;]+)?(;base64)?,([\s\S]*)$/i);
        if (!match) return null;
        const contentType = match[1] || "";
        const isBase64 = !!match[2];
        const data = match[3] || "";
        const raw = isBase64
            ? atob(data.replace(/\s/g, ""))
            : decodeURIComponent(data);
        const bytes = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i += 1) {
            bytes[i] = raw.charCodeAt(i);
        }
        return { blob: new Blob([bytes], { type: contentType }), contentType };
    } catch {
        return null;
    }
};

export const fetchBlobFromUrl = async (
    url: string,
): Promise<{ blob: Blob; contentType: string } | null> => {
    if (url.startsWith("data:")) {
        return dataUrlToBlob(url);
    }

    if (!isHostedUrl(url)) {
        return null;
    }

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch image");
        return {
            blob: await response.blob(),
            contentType: response.headers.get("content-type") || "",
        };
    } catch {
        return null;
    }
};

export const imageUrlToPngBlob = async (url: string): Promise<Blob | null> => {
    if (typeof window === "undefined") return null;
    if (!url.startsWith("data:") && !isHostedUrl(url)) return null;

    try {
        const img = new Image();
        img.crossOrigin = "anonymous";

        const loaded = await new Promise<HTMLImageElement>((resolve, reject) => {
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error("Failed to load image"));
            img.src = url;
        });

        const width = loaded.naturalWidth || loaded.width;
        const height = loaded.naturalHeight || loaded.height;
        if (!width || !height) return null;

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;

        ctx.drawImage(loaded, 0, 0, width, height);

        return await new Promise<Blob | null>((resolve) => {
            canvas.toBlob((result) => resolve(result), "image/png");
        });
    } catch {
        return null;
    }
};

/** Appends a cache-busting query param so re-uploads to the same hosted path still refresh in the UI. */
export const cacheBustUrl = (url: string | null | undefined, version?: number | null): string => {
    if (!url) return "";
    if (!version) return url;
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}v=${version}`;
};