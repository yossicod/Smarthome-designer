import {useLocation, useNavigate, useOutletContext, useParams} from "react-router-dom";
import {useEffect, useState, useRef} from "react";
import {Download, RefreshCcw, Share2, X} from "lucide-react";
import {createProject, getProject} from "../../lib/puter.action.ts";
import {generate3DView} from "../../lib/ai.action.ts";
import {TRY_AGAIN_COOLDOWN_MS} from "../../lib/constants.ts";
import {isAllowedSourceImageUrl, sanitizeSelectedStyle} from "../../lib/image-security.ts";
import {cacheBustUrl} from "../../lib/utils.ts";
import type {AuthContext, DesignItem, VisualizerLocationState} from "../../types.ts";
import Button from "../../components/UI/Button.tsx";
import {ReactCompareSlider, ReactCompareSliderImage} from "react-compare-slider";

const VisualizerId = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const location = useLocation();
    const outletContext = useOutletContext<AuthContext | undefined>();
    const userId = outletContext?.userId ?? null;
    // Fast-path data from navigation state
    const state = location.state as VisualizerLocationState | null;
    
    const hasInitialGenerated = useRef(false);
    const generationLockRef = useRef(false);
    const lastTryAgainAtRef = useRef(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isProjectLoading, setIsProjectLoading] = useState(true)
    const [toast, setToast] = useState<string | null>(null);
    const [project, setProject] = useState<Partial<DesignItem> | null>(state ? {
        sourceImage: state.initialImage,
        renderedImage: state.initialRender,
        name: state.name
    } : null);
    
    const handleBack = () => navigate('/');

    useEffect(() => {
        if (!toast) return;
        const timer = window.setTimeout(() => setToast(null), 2200);
        return () => window.clearTimeout(timer);
    }, [toast]);

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key.toLowerCase() === 'e') {
                handleExport();
            }
            if (event.key.toLowerCase() === 's') {
                void handleShare();
            }
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [project?.renderedImage, project?.name]);

    const handleExport = () => {
        const currentImage = project?.renderedImage;
        if (!currentImage) {
            setToast('No rendered image available yet.');
            return;
        }

        const link = document.createElement('a');
        link.href = currentImage;
        link.download = `${displayName || 'rendered-image'}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setToast('Export started successfully.');
    };

    const handleShare = async () => {
        const shareUrl = window.location.href;
        const shareText = `Check out this SmartHome design: ${displayName}`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: displayName,
                    text: shareText,
                    url: shareUrl
                });
                setToast('Share dialog opened.');
                return;
            } catch (error) {
                if (error instanceof DOMException && error.name === 'AbortError') {
                    setToast('Share canceled.');
                    return;
                }
            }
        }

        const multiShareUrl = `https://www.addtoany.com/share#url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareText)}`;
        const opened = window.open(multiShareUrl, '_blank', 'noopener,noreferrer');

        if (opened) {
            setToast('Opening share options...');
            return;
        }

        try {
            await navigator.clipboard.writeText(shareUrl);
            setToast('Share link copied to clipboard.');
        } catch {
            setToast('Unable to open share options on this device.');
        }
    };

    const tryAcquireGeneration = (cooldownMs = 0) => {
        if (generationLockRef.current) {
            setToast('A render is already in progress.');
            return false;
        }
        if (cooldownMs > 0) {
            const elapsed = Date.now() - lastTryAgainAtRef.current;
            if (elapsed < cooldownMs) {
                const seconds = Math.ceil((cooldownMs - elapsed) / 1000);
                setToast(`Please wait ${seconds}s before trying again.`);
                return false;
            }
        }
        generationLockRef.current = true;
        setIsProcessing(true);
        return true;
    };

    const releaseGeneration = () => {
        generationLockRef.current = false;
        lastTryAgainAtRef.current = Date.now();
        setIsProcessing(false);
    };

    const handleTryAgain = async () => {
        if (!project?.sourceImage || !isAllowedSourceImageUrl(project.sourceImage)) {
            setToast('No valid source image available.');
            return;
        }

        if (!tryAcquireGeneration(TRY_AGAIN_COOLDOWN_MS)) return;

        const previousRendered = project.renderedImage;
        const item: Partial<DesignItem> = {
            ...project,
            id: id ?? project.id,
            sourceImage: project.sourceImage,
            selectedStyle: sanitizeSelectedStyle(
                project.selectedStyle ?? state?.selectedStyle ?? null,
            ),
        };

        if (!item.id || !item.sourceImage) {
            releaseGeneration();
            return;
        }

        try {
            const result = await generate3DView({
                sourceImage: item.sourceImage,
                selectedStyle: item.selectedStyle ?? null,
                mode: 'variation',
            });

            if (!result.renderedImage) {
                setToast('Could not generate a new design. Try again.');
                return;
            }

            const renderTimestamp = Date.now();
            setProject((prev) => ({
                ...prev,
                renderedImage: result.renderedImage,
                timestamp: renderTimestamp,
            }));

            const uploadItem: DesignItem = {
                ...(item as DesignItem),
                renderedImage: result.renderedImage,
                timestamp: renderTimestamp,
                renderedPath: result.renderedPath ?? null,
                ownerId: userId ?? item.ownerId ?? null,
                isPublic: item.isPublic ?? false,
            };

            const saved = await createProject({ item: uploadItem, visibility: 'private' });
            if (saved) {
                setProject(saved);
                setToast('New design generated.');
            } else {
                setProject((prev) => ({
                    ...prev,
                    renderedImage: previousRendered,
                }));
                setToast('Could not save the new design. Your previous render was restored.');
            }
        } catch (error) {
            console.error('Try again failed:', error);
            setProject((prev) => ({
                ...prev,
                renderedImage: previousRendered,
            }));
            setToast('Could not generate a new design. Try again.');
        } finally {
            releaseGeneration();
        }
    };

    const runGeneration = async (item: Partial<DesignItem>) => {
        if (!id || !item.sourceImage || !isAllowedSourceImageUrl(item.sourceImage)) return;
        if (!tryAcquireGeneration()) return;

        try {
            setIsProjectLoading(true);
            const safeStyle = sanitizeSelectedStyle(
                item.selectedStyle ?? project?.selectedStyle ?? state?.selectedStyle ?? null,
            );
            const result = await generate3DView({
                sourceImage: item.sourceImage,
                selectedStyle: safeStyle,
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
                    renderedPath: result.renderedPath ?? null,
                    ownerId: userId ?? item.ownerId ?? null,
                    selectedStyle: safeStyle,
                }
                const saved = await createProject({ item: uploadItem, visibility: "private" });
                if (saved) {
                    setProject(saved);
                    setIsProjectLoading(false)
                }
            }
        } catch (error) {
            console.error('Error generating 3D view:', error);
            setToast('Could not generate design. Please try again.');
        } finally {
            releaseGeneration();
            setIsProjectLoading(false);
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
            try {
                const fetchedProject = await getProject(id);

                if (!isMounted) return;

                if (fetchedProject) {
                    const safeSource = isAllowedSourceImageUrl(fetchedProject.sourceImage)
                        ? fetchedProject.sourceImage
                        : '';
                    setProject({
                        ...fetchedProject,
                        sourceImage: safeSource,
                        selectedStyle: sanitizeSelectedStyle(fetchedProject.selectedStyle),
                        renderedImage:
                            fetchedProject.renderedImage
                            && isAllowedSourceImageUrl(fetchedProject.renderedImage)
                                ? fetchedProject.renderedImage
                                : undefined,
                    });
                    if (!safeSource) {
                        setToast('This project has an invalid source image.');
                    }
                } else {
                    setProject(null);
                }
                hasInitialGenerated.current = false;
            } catch (error) {
                if (!isMounted) return;
                console.error('Failed to load project:', error);
            } finally {
                if (isMounted) {
                    setIsProjectLoading(false);
                }
            }
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
    }, [project, isProjectLoading, state?.selectedStyle]);

    if (isProjectLoading && !project) {
        return (
            <div className="visualizer-route">
                <div className="visualizer-skeleton">
                    <div className="skeleton-head" />
                    <div className="skeleton-body" />
                </div>
            </div>
        );
    }

    if (!isProjectLoading && !project) {
        return <div className="p-8 text-center text-red-500">Project not found</div>;
    }

    const displayName = project?.name || 'Untitled Project';
    const renderCacheVersion = project?.timestamp ?? null;
    const renderedImageSrc = cacheBustUrl(project?.renderedImage, renderCacheVersion);

    return (
        <div className="visualizer">
            {toast && (
                <div className="toast" role="status" aria-live="polite">
                    {toast}
                </div>
            )}
            <nav className={"topbar"}>
                <div className={"brand"}>
                    <img src="/logo.png" alt="Logo" className={"logo"} style={{ width: 'auto', height: '64px', objectFit: 'contain', mixBlendMode: 'multiply', filter: 'contrast(1.1) saturate(1.1)' }} />
                    <span className={"name"}>SmartHome Designer</span>
                </div>
                <Button variant={"ghost"} size={"sm"} onClick={handleBack} className={"exit"} title={"Exit editor"}>
                    <X className={"icon"} /> Exit Editor
                </Button>
            </nav>
            <section className={"content"}>
                <div className={"panel"}>
                    <div className={"command-center"}>
                        <div className={"command-title"}>Command Center</div>
                        <div className={"command-actions"}>
                            <button type="button" className={"command-pill"} onClick={handleExport} title={"Shortcut: E"}>Export (E)</button>
                            <button type="button" className={"command-pill"} onClick={() => void handleShare()} title={"Shortcut: S"}>Share (S)</button>
                            <button type="button" className={"command-pill"} onClick={handleBack}>Exit</button>
                            <button type="button" className={"command-pill"} onClick={() => void handleTryAgain()} disabled={isProcessing || !project?.sourceImage}>Try Again</button>
                        </div>
                        <div className={"quality-badge"}>{project?.renderedImage ? 'Quality: High' : 'Quality: Pending'}</div>
                    </div>
                    <div className={"panel-header"}>
                        <div className={"panel-meta"}>
                            <p>Project {project?.name || 'project'}</p>
                            <h2>{displayName}</h2>
                            <p className={"note"}>created by you</p>
                        </div>
                        <div className={"panel-actions"}>
                            <Button
                                size={"sm"}
                                onClick={handleExport}
                                className={"export"}
                                title={"Export rendered image"}
                                disabled={!project?.renderedImage}>
                                <Download className={"w-4 h-4 mr-2"} /> Export
                            </Button>
                            <Button size={"sm"} onClick={() => void handleShare()} className={"share"} title={"Share project"}>
                                <Share2 className={"w-4 h-4 mr-2"} /> Share
                            </Button>
                            <Button
                                size={"sm"}
                                className={"try-again"}
                                title={"Generate a new design"}
                                onClick={() => void handleTryAgain()}
                                disabled={isProcessing || !project?.sourceImage}>
                                <RefreshCcw className={"w-4 h-4 mr-2"} /> Try Again
                            </Button>

                        </div>

                    </div>
                    <div className={"project-stats"}>
                        <span>Style: {project?.selectedStyle || 'Not selected'}</span>
                        <span>Visibility: {project?.isPublic ? 'Community' : 'Private'}</span>
                        <span>Updated: {project?.timestamp ? new Date(project.timestamp).toLocaleDateString() : 'Today'}</span>
                    </div>
                    <div className={`render-area ${isProcessing ? 'is-processing' : ''}`}>
                        {project?.renderedImage ? (
                            <img
                                key={renderedImageSrc}
                                src={renderedImageSrc}
                                alt="Rendered Image"
                                className={"render-img"}
                            />
                        ) : (
                            <div className={"render-placeholder empty-state"}>
                                {project?.sourceImage && (
                                    <img src={project.sourceImage} alt={"Original"}
                                     className={"render-fallback"} />

                                )}
                                <div className={"empty-copy"}>
                                    <h4>Render is not ready yet</h4>
                                    <p>Your source image is loaded. AI rendering will appear here shortly.</p>
                                </div>
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
                <div className={"panel compare"}>
                    <div className={"panel-header"}>
                        <div className={"panel-meta"}>
                            <p>Comparison</p>
                            <h3>Before and After</h3>

                        </div>
                        <div className={"hint"}>
                            Drag to compare
                        </div>
                    </div>
                    <div className={"compare-stage"}>
                        <div className={"compare-label before"}>Before</div>
                        <div className={"compare-label after"}>After</div>
                        {project?.sourceImage && project.renderedImage ? (
                            <ReactCompareSlider
                                key={renderedImageSrc}
                                defaultValue={50}
                                style={{width: '100%', height: 'auto'}}
                                itemOne={
                                <ReactCompareSliderImage src={project.sourceImage} alt={"before"} className={"compare-img"} />
                                }
                                itemTwo={
                                    <ReactCompareSliderImage src={renderedImageSrc} alt={"after"} className={"compare-img"} />
                                }
                            />
                        ) : (
                            <div className={"compare-fallback"}>
                                {project?.sourceImage && (
                                    <img src={project.sourceImage} alt={"after"} className={"compare-img"} />
                                )}
                            </div>
                        )}
                    </div>
                    <div className={"history-timeline"}>
                        <h4>History Timeline</h4>
                        <div className={"timeline-items"}>
                            <div className={"timeline-item"}><span>Uploaded</span><small>{project?.timestamp ? new Date(project.timestamp).toLocaleTimeString() : 'Now'}</small></div>
                            <div className={"timeline-item"}><span>Style</span><small>{project?.selectedStyle || 'Not selected'}</small></div>
                            <div className={"timeline-item"}><span>Rendered</span><small>{project?.renderedImage ? 'Completed' : 'Pending'}</small></div>
                        </div>
                    </div>
                    <div className={"audit-panel"}>
                        <h4>Audit Panel</h4>
                        <ul>
                            <li>Uploaded source image</li>
                            <li>Applied style: {project?.selectedStyle || 'Default'}</li>
                            <li>Rendered state: {project?.renderedImage ? 'Completed' : 'In progress'}</li>
                        </ul>
                    </div>
                </div>

            </section>
            <div className={"sticky-action-bar"}>
                <button type="button" onClick={handleExport} title={"Shortcut: E"}>Export</button>
                <button type="button" onClick={() => void handleShare()} title={"Shortcut: S"}>Share</button>
                <button type="button" onClick={handleBack}>Exit</button>
                <button type="button" onClick={() => void handleTryAgain()} disabled={isProcessing || !project?.sourceImage}>Try Again</button>

            </div>
        </div>

    );
};

export default VisualizerId;