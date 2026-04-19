import "./App.css";
import { Outlet } from "react-router-dom";
import Navbar from "../components/navbar";

export default function App() {
  return (
    <div className="home">
      <Navbar />
      <main>
        {/* Write routed page content here */}
        <Outlet />
      </main>
    </div>
  );
}
