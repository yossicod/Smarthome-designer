 import {puter} from "@heyputer/puter.js";
import type {StoreHostedImageParams} from "../types.ts";
import {
    createHostingSlug,
    fetchBlobFromUrl, getHostedUrl,
    getImageExtension,
    HOSTING_CONFIG_KEY,
    imageUrlToPngBlob,
    isHostedUrl
} from "./utils.ts";



type HostingConfig = {subdomain: string;}
type HostedAsset = {url: string};
export const getOrCreateHostingConfig = async (): Promise<HostingConfig | null> => {
    const existing = (await puter.kv.get(HOSTING_CONFIG_KEY))  as HostingConfig | null
    if (existing?.subdomain) return {subdomain: existing.subdomain}
    const subdomain = createHostingSlug();
    try {
        const created = await puter.hosting.create(subdomain, '.');
        try {
            await puter.kv.set(HOSTING_CONFIG_KEY, created);
        } catch (kvError) {
            console.warn(`Failed to persist hosting config: ${kvError}`);
        }
        const record = {subdomain: created.subdomain}

        await puter.kv.set(HOSTING_CONFIG_KEY, record)
        return record
    } catch (e) {
        console.warn(`could not find domain: ${e}`)
        return null
    }
}
 export const uploadImageToHosting = async ({hosting, url, projectId, label}: StoreHostedImageParams): Promise<HostedAsset | null> => {
    if (!hosting || !url) return null
    if(isHostedUrl(url)) return {url}
    try {
        const resolved = label == "rendered"
            ? await imageUrlToPngBlob(url).then((blob) => blob ? {
                blob, contentType: 'image/png'
            } : null) : await fetchBlobFromUrl(url)
        if (!resolved) return null
        const contentType = resolved.contentType || resolved.blob.type || ''
        const ext = getImageExtension(contentType, url)
        const dir = `projects/${projectId}`
        const filePath = `${dir}/${label}.${ext}`
        const uploadFile = new File([resolved.blob],`${label}.${ext}`,{
            type: contentType
        })
        await puter.fs.mkdir(dir, {createMissingParents: true})
        await puter.fs.write(filePath, uploadFile)
        const hostedUrl = getHostedUrl({subdomain: hosting.subdomain}, filePath)
        return hostedUrl ? {url: hostedUrl} : null
     } catch (e) {
        console.warn(`Failed to store hosted image: ${e}`)
        return null

    }
}