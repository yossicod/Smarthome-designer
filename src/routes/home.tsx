import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth.ts";
import { ArrowRight, ArrowUpRight, Clock, Layers } from "lucide-react";
import Button from "../../components/UI/Button.tsx";
import Upload from "../../components/upload.tsx";
import {useState} from "react";
import type {DesignItem} from "../../types.ts";
import {createProject} from "../../lib/puter.actino.ts";

export default function Home() {
    const navigate = useNavigate();
    const [projects, setProjects] = useState<DesignItem[]>([])

    const { authState, signIn } = useAuth();
    const { isSignedIn } = authState;

    const handleUploadComplete = async (data: string) => {
        const newId = Date.now().toString();
        const name = `Residence ${newId}`;
        const newItem = {
            id: newId, name, sourceImage: data, renderedImage: undefined, timestamp: Date.now(),
        }
        const saved = await createProject({item: newItem, visibility: "private"});
        if (!saved) {
            console.error("Failed to create project");
            return false;
        }
        setProjects((prev) => [saved, ...prev]);
        navigate(`/visualizer/${newId}`, {
            state: {
                initialImage: saved.sourceImage,
                initialRendered: saved.renderedImage,
                name
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
                    <div className={"projects-grid"}>
                        {projects.map(({id, name, renderedImage, sourceImage,
                        timestamp}) => (
                            <div className={"project-card group"}>
                                <div className={"preview"}>
                                    <img
                                        src={renderedImage || sourceImage}
                                        alt={"Project"}
                                    />
                                    <div className={"badge"}>
                                        <span>Community</span>
                                    </div>
                                </div>
                                <div className={"card-body"}>
                                    <div>
                                        <h3>{name}</h3>
                                        <div className={"meta"}>
                                            <Clock size={16} />
                                            <span style={{ fontSize: '1rem' }}>{new Date(timestamp).toLocaleDateString()}</span>
                                            <span style={{ fontSize: '1rem' }}>By YossiCode</span>
                                        </div>
                                    </div>
                                    <div className={"arrow"}>
                                        <ArrowUpRight size={25} />
                                    </div>
                                </div>
                            </div>
                            ))}

                    </div>
                </div>
            </section>
        </div>
    );
}