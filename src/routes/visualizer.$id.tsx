import { useParams } from "react-router-dom";

const VisualizerId = () => {
    const { id } = useParams();
    return (
        <div className="visualizer-route" style={{ paddingTop: '100px', textAlign: 'center' }}>
            <h1>visualizerId: {id}</h1>
        </div>
    );
};

export default VisualizerId;