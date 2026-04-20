import { useNavigate } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Clock, Layers } from "lucide-react";
import Button from "../../components/UI/Button.tsx";
import Upload from "../../components/upload.tsx";

export default function Home() {
    const navigate = useNavigate();

    const handleUploadComplete = async (data: string) => {
        const newId = Date.now().toString();
        navigate(`/visualizer/${newId}`, { state: { floorPlan: data } });
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
                    <a href={"#upload"} className={"cta"}>Start building <ArrowRight className={"icon"} /></a>
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
                            <p> Supports JPG, PNG, formats up to 10MB</p>
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
                        <div className={"project-card group"}>
                            <div className={"preview"}>
                                <img
                                    src={"https://roomify-mlhuk267-dfwu1i.puter.site/projects/1770803585402/rendered.png"}
                                    alt={"Project "}
                                />
                                <div className={"badge"}>
                                    <span>Community</span>
                                </div>
                            </div>
                            <div className={"card-body"}>
                                <div>
                                    <h3> Project Israel</h3>
                                    <div className={"meta"}>
                                        <Clock size={16} />
                                        <span style={{ fontSize: '1rem' }}>{new Date('2026-04-19').toLocaleDateString()}</span>
                                        <span style={{ fontSize: '1rem' }}>By YossiCode</span>
                                    </div>
                                </div>
                                <div className={"arrow"}>
                                    <ArrowUpRight size={25} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
