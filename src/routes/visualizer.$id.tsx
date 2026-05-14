import {useLocation, useNavigate, useOutletContext, useParams} from "react-router-dom";
import {useEffect, useState, useRef} from "react";
import {Download, RefreshCcw, Share2, X} from "lucide-react";
import {createProject, getProject} from "../../lib/puter.action.ts";
import {generate3DView} from "../../lib/ai.action.ts";
import type {AuthContext, DesignItem} from "../../types.ts";
import Button from "../../components/UI/Button.tsx";

const VisualizerId = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const location = useLocation();
    const { userId } = useOutletContext<AuthContext>()
    // Fast-path data from navigation state
    const state = location.state as { initialImage?: string; initialRender?: string; name?: string; selectedStyle?: string } | null;
    
    const hasInitialGenerated = useRef(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isProjectLoading, setIsProjectLoading] = useState(true)
    const [project, setProject] = useState<Partial<DesignItem> | null>(state ? {
        sourceImage: state.initialImage,
        renderedImage: state.initialRender,
        name: state.name
    } : null);
    
    const handleBack = () => navigate('/');

    const runGeneration = async (item: Partial<DesignItem>) => {
        if (!id || !item.sourceImage) return;
        try {
            setIsProjectLoading(true)
            setIsProcessing(true);
            const result = await generate3DView({
                sourceImage: item.sourceImage,
                selectedStyle: project?.selectedStyle ?? state?.selectedStyle ?? null
            });

            if (result.renderedImage) {
                setProject((prev: Partial<DesignItem> | null) => ({
                    ...prev,
                    renderedImage: result.renderedImage
                }));
                if (!item.id || !item.sourceImage) {
                    setIsProjectLoading(false)
                    return;
                }
                const uploadItem: DesignItem = {
                    ...item,
                    id: item.id,
                    sourceImage: item.sourceImage,
                    renderedImage: result.renderedImage,
                    timestamp: Date.now(),
                    isPublic: item.isPublic || false,
                    renderedPath: result.renderedImage,
                    ownerId: item.ownerId || userId || null
                }
                const saved = await createProject({ item: uploadItem, visibility: "private" });
                if (saved) {
                    setProject(saved);
                    setIsProjectLoading(false)
                }
            }
        } catch (error) {
            console.error('Error generating 3D view:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    useEffect(() => {
        let isMounted = true;

        const loadProject = async () => {
            if (!id) {
                setIsProjectLoading(false);
                return;
            }

            setIsProjectLoading(true);

            const fetchedProject = await getProject(id);

            if (!isMounted) return;

            setProject(fetchedProject);
            setIsProjectLoading(false);
            hasInitialGenerated.current = false;
        };

        loadProject();

        return () => {
            isMounted = false;
        };
    }, [id]);

    useEffect(() => {
        if (
            isProjectLoading ||
            hasInitialGenerated.current ||
            !project?.sourceImage
        )
            return;

        if (project.renderedImage) {
            hasInitialGenerated.current = true;
            return;
        }

        hasInitialGenerated.current = true;
        void runGeneration(project);
    }, [project, isProjectLoading]);

    if (isProjectLoading && !project) {
        return <div className="p-8 text-center">Loading project...</div>;
    }

    if (!isProjectLoading && !project) {
        return <div className="p-8 text-center text-red-500">Project not found</div>;
    }

    const displayName = project?.name || 'Untitled Project';

    return (
        <div className="visualizer">
            <nav className={"topbar"}>
                <div className={"brand"}>
                    <img src="/logo.png" alt="Logo" className={"logo"} style={{ width: 'auto', height: '64px', objectFit: 'contain', mixBlendMode: 'multiply', filter: 'contrast(1.1) saturate(1.1)' }} />
                    <span className={"name"}>SmartHome Designer</span>
                </div>
                <Button variant={"ghost"} size={"sm"} onClick={handleBack} className={"exit"}>
                    <X className={"icon"} /> Exit Editor
                </Button>
            </nav>
            <section className={"content"}>
                <div className={"panel"}>
                    <div className={"panel-header"}>
                        <div className={"panel-meta"}>
                            <p>Project {project?.name || 'project'}</p>
                            <h2>{displayName}</h2>
                            <p className={"note"}>created by you</p>
                        </div>
                        <div className={"panel-actions"}>
                            <Button
                                size={"sm"}
                                onClick={() =>{}}
                                className={"export"}
                                disabled={!project?.renderedImage}>
                                <Download className={"w-4 h-4 mr-2"} /> Export
                            </Button>
                            <Button size={"sm"} onClick={() =>{}} className={"share"}>
                                <Share2 className={"w-4 h-4 mr-2"} /> Share
                            </Button>
                        </div>
                    </div>
                    <div className={`render-area ${isProcessing ? 'is-processing' : ''}`}>
                        {project?.renderedImage ? (
                            <img src={project?.renderedImage} alt="Rendered Image" className={"render-img"} />
                        ) : (
                            <div className={"render-placeholder"}>
                                {project?.sourceImage && (
                                    <img src={project.sourceImage} alt={"Original"}
                                     className={"render-fallback"} />

                                )}
                            </div>

                            )}
                        {isProcessing && (
                            <div className={"render-overlay"}>
                                <div className={"rendering-card"}>
                                    <RefreshCcw className={"spinner"}/>
                                    <span className={"title"}>
                                        Rendering..
                                    </span>
                                    <span className={"subtitle"}>
                                        Generating your 3D visualization.
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>

    );
};

export default VisualizerId;