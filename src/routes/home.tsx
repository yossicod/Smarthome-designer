import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth.ts";
import { ArrowRight, ArrowUpRight, Clock, Layers, Lock, Globe } from "lucide-react";
import Button from "../components/UI/Button.tsx";
import Upload from "../components/upload.tsx";
import {useState, useEffect} from "react";
import type {DesignItem} from "../types.ts";
import {createProject, listAllProjects} from "../lib/puter.action.ts";

export default function Home() {
    const navigate = useNavigate();
    const [projects, setProjects] = useState<DesignItem[]>([])
    const [projectName, setProjectName] = useState("");
    const [visibility, setVisibility] = useState<"private" | "public">("private");
    const [isLoadingProjects, setIsLoadingProjects] = useState(true);

    const { authState, signIn } = useAuth();
    const { isSignedIn, userName } = authState;

    useEffect(() => {
        const fetchProjects = async () => {
            setIsLoadingProjects(true);
            const allProjects = await listAllProjects();
            setProjects(allProjects);
            setIsLoadingProjects(false);
        };
        fetchProjects();
    }, []);

    const handleUploadComplete = async (data: string) => {
        const newId = Date.now().toString();
        const finalName = projectName.trim() || `Residence ${newId}`;
        const newItem: DesignItem = {
            id: newId, 
            name: finalName, 
            sourceImage: data, 
            renderedImage: undefined, 
            timestamp: Date.now(),
            sharedBy: userName || "Anonymous"
        }
        const saved = await createProject({item: newItem, visibility});
        if (!saved) {
            console.error("Failed to create project");
            return false;
        }
        setProjects((prev) => [saved, ...prev]);
        navigate(`/visualizer/${newId}`, {
            state: {
                initialImage: saved.sourceImage,
                initialRender: saved.renderedImage,
                name: finalName
            }
        });
        return true;
    };

    return (
        <div className="home">
            <section className={"hero"}>
                <div className={"announce"}>
                    <div className={"dot"}>
                        <div className={"pulse"}></div>
                    </div>
                    <p>introducing smarthome designer 2.0</p>
                </div>
                <h1>Stop rendering, start creating: Transform sketches into reality at the speed of thought</h1>
                <p className={"subtitle"}>
                    Empower your imagination and build beautiful spaces at the speed
                    of thought with the world’s most advanced AI architectural designer
                </p>
                <div className={"actions"}>
                    <button 
                        className={"cta cursor-pointer"} 
                        onClick={() => {
                            if (!isSignedIn) {
                                void signIn();
                            } else {
                                const uploadSection = document.getElementById('upload');
                                if (uploadSection) {
                                    uploadSection.scrollIntoView({ behavior: 'smooth' });
                                }
                            }
                        }}
                    >
                        Start building <ArrowRight className={"icon"} />
                    </button>
                    <Button variant={"outline"} size={"lg"} className={"demo"}> Watch demo</Button>
                </div>

                <div id={"upload"} className={"upload-shell"}>
                    <div className={"grid-overlay"} />
                    <div className={"upload-card"}>
                        <div className={"upload-head"}>
                            <div className={"upload-icon"}>
                                <Layers className={"icon"} />
                            </div>
                            <h3> Upload your plan</h3>
                            <p> Supports JPG, PNG formats. Maximum file size is 50 MB.</p>
                        </div>
                        
                        <div className="mb-6 space-y-4 px-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                                <input 
                                    type="text" 
                                    placeholder="Enter project name..."
                                    value={projectName}
                                    onChange={(e) => setProjectName(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center cursor-pointer">
                                        <input 
                                            type="radio" 
                                            name="visibility" 
                                            value="private" 
                                            checked={visibility === "private"}
                                            onChange={() => setVisibility("private")}
                                            className="mr-2"
                                        />
                                        <span className="text-sm">Private</span>
                                    </label>
                                    <label className="flex items-center cursor-pointer">
                                        <input 
                                            type="radio" 
                                            name="visibility" 
                                            value="public" 
                                            checked={visibility === "public"}
                                            onChange={() => setVisibility("public")}
                                            className="mr-2"
                                        />
                                        <span className="text-sm">Public</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <Upload onComplete={handleUploadComplete} />

                    </div>
                </div>
            </section>
            <section className={"projects"}>
                <div className={"section-inner"}>
                    <div className={"section-head"}>
                        <div className={"copy"}>
                            <h2>Projects</h2>
                            <p>Your latest projects and shared community projects, all in one place.</p>
                        </div>
                    </div>
                    {isLoadingProjects ? (
                        <div className="p-8 text-center">Loading projects...</div>
                    ) : (
                        <div className={"projects-grid"}>
                            {projects.map(({id, name, renderedImage, sourceImage,
                            timestamp, isPublic, sharedBy}) => (
                                <div key={id} className={"project-card group cursor-pointer"} onClick={() => navigate(`/visualizer/${id}`)}>
                                    <div className={"preview"}>
                                        <img
                                            src={renderedImage || sourceImage}
                                            alt={"Project"}
                                        />
                                        <div className={`badge ${isPublic ? 'bg-green-500' : 'bg-gray-500'}`}>
                                            <span className="flex items-center gap-1">
                                                {isPublic ? <Globe size={12} /> : <Lock size={12} />}
                                                {isPublic ? 'Community' : 'Private'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className={"card-body"}>
                                        <div>
                                            <h3>{name}</h3>
                                            <div className={"meta"}>
                                                <Clock size={16} />
                                                <span style={{ fontSize: '1rem' }}>{new Date(timestamp).toLocaleDateString()}</span>
                                                <span style={{ fontSize: '1rem' }}>By {sharedBy || 'Unknown'}</span>
                                            </div>
                                        </div>
                                        <div className={"arrow"}>
                                            <ArrowUpRight size={25} />
                                        </div>
                                    </div>
                                </div>
                                ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}