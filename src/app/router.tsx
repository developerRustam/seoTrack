import { Navigate, createHashRouter } from "react-router-dom";
import { AppLayout } from "../layout/AppLayout";
import { LoginPage } from "../pages/login/LoginPage";
import { ProjectDetailsPage } from "../pages/projects/project-details/ui/ProjectDetailsPage";
import { ProjectsPage } from "../pages/projects/ProjectsPage";
import { ProjectAdd } from "../pages/projects/ProjectAdd";
import { RegisterPage } from "../pages/register/RegisterPage";
import { ProtectedRoute } from "./ProtectedRoute";

export const router = createHashRouter([
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/projects" replace /> },
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },

      {
        element: <ProtectedRoute />,
        children: [
          { path: "projects", element: <ProjectsPage /> },
          { path: "projects/add", element: <ProjectAdd /> },
          { path: "projects/:id", element: <ProjectDetailsPage /> },
          { path: "projects/:id/history/:historyId", element: <ProjectDetailsPage /> },
        ],
      },

      { path: "*", element: <Navigate to="/projects" replace /> },
    ],
  },
]);

