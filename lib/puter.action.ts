// import puter from "@heyputer/puter.js";
// import type {CreateProjectParams, DesignItem} from "../types.ts";

import {puter} from "@heyputer/puter.js";
import type {CreateProjectParams, DesignItem} from "../types.ts";
import {getOrCreateHostingConfig, uploadImageToHosting} from "./puter.hosting.ts";
import {isHostedUrl, HOSTING_CONFIG_KEY} from "./utils.ts";

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
     const { item } = params;
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
         // Call the Puter worker to store project in kv
         await puter.kv.set(projectId, payload);
         return payload as DesignItem;
     } catch (e) {
         console.log('Failed to save project', e)
         return null
     }


 }

export const getProject = async (id: string): Promise<DesignItem | null> => {
    try {
        const item = await puter.kv.get(id);
        return item as DesignItem | null;
    } catch (e) {
        console.error("Failed to fetch project", e);
        return null;
    }
};

export const listAllProjects = async (): Promise<DesignItem[]> => {
    try {
        const items = await puter.kv.list();
        const projects: DesignItem[] = [];
        
        for (const item of items) {
            // Check if it's a project (has an ID that is likely a timestamp)
            // Note: Puter's list returns items which we then need to fetch if it's not the value itself
            // Actually, puter.kv.list() can be used with a prefix or to get all.
            // Let's assume we store projects with a specific prefix or just iterate and check types.
            // For now, let's fetch each one.
            if (item.key !== HOSTING_CONFIG_KEY) {
                const project = await getProject(item.key);
                if (project && project.id && project.timestamp) {
                    projects.push(project);
                }
            }
        }
        return projects.sort((a, b) => b.timestamp - a.timestamp);
    } catch (e) {
        console.error("Failed to list projects", e);
        return [];
    }
};