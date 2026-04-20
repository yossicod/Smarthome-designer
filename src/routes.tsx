import { type RouteObject } from "react-router-dom";
import App from "./App";
import Home from "./routes/home";
import VisualizerId from "./routes/visualizer.$id";

const routes: RouteObject[] = [
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "visualizer/:id",
        element: <VisualizerId />,
      },
    ],
  },
];

export default routes;
