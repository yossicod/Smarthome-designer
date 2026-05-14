// import puter from "@heyputer/puter.js";
// import type {CreateProjectParams, DesignItem} from "../types.ts";

import {puter} from "@heyputer/puter.js";
import type {CreateProjectParams, DesignItem} from "../types.ts";
import {getOrCreateHostingConfig, uploadImageToHosting} from "./puter.hosting.ts";
import {isHostedUrl} from "./utils.ts";
import {PUTER_WORKER_URL} from "./constants.ts";

export const signIn = async () => await puter.auth.signIn();
  export const signOut = async () =>  puter.auth.signOut();
 export const  getCurrentUser =async () => {
    try {
        return await puter.auth.getUser();
    } catch {
        return null

    }
 }
 export const createProject = async (params: CreateProjectParams):
  Promise<DesignItem | null | undefined> => {
     if(!PUTER_WORKER_URL) {
         console.warn('Missing VITE_PUTER_WORKER_URL; skip history fetch')
         return null
     }
     const { item, visibility = "private"} = params;
     const projectId = item.id;
     const hosting = await getOrCreateHostingConfig();
     const hostedSource = projectId ?
         await uploadImageToHosting({hosting, url: item.sourceImage, projectId, label: "source"}) : null;
     const hostedRendered = projectId && item.renderedImage ?
         await uploadImageToHosting({hosting, url: item.renderedImage, projectId, label: "rendered"}) : null;
     const resolvedSource = hostedSource ?.url || (isHostedUrl(item.sourceImage) ?
     item.sourceImage: '')
     if (!resolvedSource){
         console.warn('Faild to host source image, skipping save')
         return null
     }
     const resolvedRender = hostedRendered?.url
     ? hostedRendered ?.url
     : item.renderedImage && isHostedUrl(item.renderedImage)
     ? item.renderedImage : undefined;

     const {
         sourcePath: _sourcePath,
         renderedPath: _renderedPath,
         publicPath: _publicPath,
         ...rest
     } = item

     const payload =  {
         ...rest,
         sourceImage: resolvedSource,
         renderedImage: resolvedRender,
         isPublic: item.isPublic ?? (params.visibility === "public"),
     }
     try {
         const response = await puter.workers.exec(`${PUTER_WORKER_URL}/api/projects/save`, {
             method: "POST",
             headers: { "Content-Type": "application/json" },
             body: JSON.stringify({ project: payload, visibility })
         })
         if (!response.ok) {
             console.error('Failed to save project', await response.text())
             return null
         }
         const data = (await response.json()) as {  project: DesignItem | null}
         await puter.kv.set(projectId, payload);
         return data.project ?? null
     } catch (e) {
         console.log('Failed to save project', e)
         return null
     }


 }

export const getProject = async (id: string): Promise<DesignItem | null> => {
    if (!PUTER_WORKER_URL) {
        console.warn("Missing VITE_PUTER_WORKER_URL; skipping project fetch.");
        return null;
    }

    try {
        const response = await puter.workers.exec(
            `${PUTER_WORKER_URL}/api/projects/get?id=${encodeURIComponent(id)}`,
            { method: "GET" },
        );

        if (!response.ok) {
            console.error("Failed to fetch project:", await response.text());
            return null;
        }

        const data = (await response.json()) as { project?: DesignItem | null };
        return data?.project ?? null;
    } catch (e) {
        console.error("Failed to fetch project", e);
        return null;
    }
}

export const listAllProjects = async (): Promise<DesignItem[]> => {
    if (!PUTER_WORKER_URL) {
        console.warn('Missing VITE_PUTER_WORKER_URL; skip history fetch')
        return []
    }

    try {
        const response = await puter.workers.exec(`${PUTER_WORKER_URL}/api/projects/list`, { method: "GET" })
        if (!response.ok) {
            console.error('Failed to fetch history', await response.text())
            return []
        }

        const data = (await response.json()) as { projects?: DesignItem[] | null }
        const projects = Array.isArray(data.projects) ? data.projects : []
        return projects.sort((a, b) => b.timestamp - a.timestamp);
    } catch (e) {
        console.error("Failed to list projects", e);
        return [];
    }
};