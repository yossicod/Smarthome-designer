
import {useState, useEffect, useRef} from "react";
import {CheckCircle2, ImageIcon, UploadIcon} from "lucide-react";
import {useAuth} from "../src/context/useAuth.ts";
import {PROGRESS_INTERVAL_MS, PROGRESS_STEP, REDIRECT_DELAY_MS} from "../lib/constants.ts";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes

interface UploadProps {
    onComplete?: (data: string) => void;
}

const Upload = ({ onComplete }: UploadProps) => {
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [progress, setProgress] = useState(0);
    const {authState} = useAuth();
    const {isSignedIn} = authState;
    const uploadIntervalRef = useRef<number | null>(null);

    const processFile = (selectedFile: File) => {
        if (!isSignedIn) return;

        // Check file size before processing
        if (selectedFile.size > MAX_FILE_SIZE) {
            return;
        }

        setFile(selectedFile);
        setProgress(0);

        const reader = new FileReader();

        reader.onerror = () => {
            setFile(null);
            setProgress(0);
        };

        reader.onload = (e) => {
            const base64Data = e.target?.result as string;

            const interval = setInterval(() => {
                setProgress((prev) => {
                    if (prev >= 100) {
                        clearInterval(interval);
                        if (uploadIntervalRef.current) {
                            clearInterval(uploadIntervalRef.current);
                            uploadIntervalRef.current = null;
                        }
                        setTimeout(() => {
                            if (onComplete) {
                                onComplete(base64Data);
                            }
                        }, REDIRECT_DELAY_MS);
                        return 100;
                    }
                    return prev + PROGRESS_STEP;
                });
            }, PROGRESS_INTERVAL_MS);

            uploadIntervalRef.current = interval;
        };
        reader.readAsDataURL(selectedFile);
    };

    useEffect(() => {
        return () => {
            if (uploadIntervalRef.current) {
                clearInterval(uploadIntervalRef.current);
            }
        };
    }, []);

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isSignedIn) setIsDragging(true);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isSignedIn) setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (!isSignedIn) return;

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            processFile(files[0]);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!isSignedIn) return;

        const files = e.target.files;
        if (files && files.length > 0) {
            processFile(files[0]);
        }
    };

    return(
        <div className={"upload"}>
            {!file ? (
                <div 
                    className={`dropzone ${isDragging ? 'is-dragging' : ''}`}
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <input
                        type="file" 
                        className={"drop-input"} 
                        accept={".jpg,.jpeg,.png"} 
                        disabled={!isSignedIn}
                        onChange={handleFileChange}
                    />
                    <div className={"drop-content"}>
                        <div className={"drop-icon"}>
                            <UploadIcon size={30} />
                        </div>
                        <p>{isSignedIn ? (
                            "Click to upload or just drag and drop"
                        ) : (
                            "Sign in to upload files"
                        )}</p>
                        <p className={"help"}>Maximum file size is 50 MB.</p>
                    </div>
                </div>
            ) : (
                <div className={"upload-status"}>
                    <div className={"status-content"}>
                        <div className={"status-icon"}>
                            {progress === 100 ? (
                                <CheckCircle2 className={"check"} />
                            ) : (
                                <ImageIcon className={"image"}/>
                            )}
                        </div>
                        <h3>{file.name}</h3>
                        <div className={"progress"}>
                            <div className={"bar"} style={{width: `${progress}%`}}/>
                            <p className={"status-text"}>
                                {progress < 100 ? 'Analyzing Floor Plan...' : 'Redirecting...'}
                            </p>
                        </div>
                    </div>
                </div>
            )
            }
        </div>
    );
};

export default Upload;
