import "./App.css";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "../components/navbar.tsx";

export default function App() {
  const location = useLocation();
  const isVisualizer = location.pathname.includes('/visualizer');

  return (
    <div className="home">
      {!isVisualizer && <Navbar />}
      <main>
        <Outlet />
      </main>
    </div>
  );
}
