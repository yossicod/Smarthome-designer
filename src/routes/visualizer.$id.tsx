import {useLocation, useNavigate, useParams} from "react-router-dom";
import {useEffect, useState, useRef} from "react";
import {Clock, Download, Globe, Lock, RefreshCcw, Share2, X} from "lucide-react";
import {getProject} from "../lib/puter.action.ts";
import {generate3DView} from "../lib/ai.action.ts";
import type {DesignItem} from "../types.ts";
import Button from "../components/UI/Button.tsx";

const VisualizerId = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const location = useLocation();
    
    // Fast-path data from navigation state
    const state = location.state as { initialImage?: string; initialRender?: string; name?: string } | null;
    
    const hasInitialGenerated = useRef(false);
    const [isProcessing, setIsProcessing] = useState(false);
    
    const [project, setProject] = useState<Partial<DesignItem> | null>(state ? {
        sourceImage: state.initialImage,
        renderedImage: state.initialRender,
        name: state.name
    } : null);
    
    const [loading, setLoading] = useState(!project);
    const [error, setError] = useState<string | null>(null);
    const handleBack = () => navigate('/');

    const runGeneration = async (sourceImage: string) => {
        try {
            setIsProcessing(true);
            const result = await generate3DView({ sourceImage });
            if (result.renderedImage) {
                setProject(prev => ({
                    ...prev,
                    renderedImage: result.renderedImage
                }));
            }
        } catch (error) {
            console.error('Error generating 3D view:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    useEffect(() => {
        if (!id) return;

        let isMounted = true;

        const loadProject = async () => {
            try {
                const fetched = await getProject(id);
                if (isMounted) {
                    if (fetched) {
                        setProject(fetched);
                        
                        // If we have a source image but no rendered image yet, and haven't tried generating
                        if (fetched.sourceImage && !fetched.renderedImage && !hasInitialGenerated.current) {
                            hasInitialGenerated.current = true;
                            void runGeneration(fetched.sourceImage);
                        }
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
    const displayDate = project?.timestamp ? new Date(project.timestamp).toLocaleDateString() : '';

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