import {useLocation, useParams} from "react-router-dom";
import {useEffect, useState} from "react";
import {getProject} from "../../lib/puter.actino.ts";
import type {DesignItem} from "../../types.ts";

const VisualizerId = () => {
    const { id } = useParams();
    const location = useLocation();
    
    // Use location state as initial fast-path data
    const state = location.state as { initialImage?: string; initialRendered?: string; name?: string } | null;
    
    const [project, setProject] = useState<Partial<DesignItem> | null>(state ? {
        sourceImage: state.initialImage,
        renderedImage: state.initialRendered,
        name: state.name
    } : null);
    
    const [loading, setLoading] = useState(!project);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;

        let isMounted = true;

        const loadProject = async () => {
            // If we already have data from state, we can still fetch to ensure we have the latest/full data
            // but for now, if state exists and we have images, we might skip or just update silently.
            // The requirement says: load by id as primary, use state only as fast-path.
            
            try {
                const fetched = await getProject(id);
                if (isMounted) {
                    if (fetched) {
                        setProject(fetched);
                    } else if (!project) {
                        setError("Project not found");
                    }
                }
            } catch (err) {
                if (isMounted && !project) {
                    setError("Failed to load project");
                    console.error(err);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        void loadProject();

        return () => {
            isMounted = false;
        };
    }, [id]);

    if (loading && !project) {
        return <div className="p-8 text-center">Loading project...</div>;
    }

    if (error && !project) {
        return <div className="p-8 text-center text-red-500">{error}</div>;
    }

    const displayName = project?.name || 'Untitled Project';
    const displayImage = project?.renderedImage || project?.sourceImage;

    return (
        <section className="p-8">
            <h1 className="text-2xl font-bold mb-6">{displayName}</h1>
            <div className={"visualizer flex flex-col gap-8"}>
                {project?.sourceImage && (
                    <div className={"image-container"}>
                        <h2 className="text-xl font-semibold mb-2">Source Image</h2>
                        <img src={project.sourceImage} alt={"source"} className="max-w-full h-auto rounded-lg shadow-md" />
                    </div>
                )}
                {project?.renderedImage && (
                    <div className={"image-container"}>
                        <h2 className="text-xl font-semibold mb-2">Rendered Design</h2>
                        <img src={project.renderedImage} alt={"rendered"} className="max-w-full h-auto rounded-lg shadow-md" />
                    </div>
                )}
            </div>
        </section>
    );
};

export default VisualizerId;