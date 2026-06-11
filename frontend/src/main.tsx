import { createRoot } from "react-dom/client";
import App from "./App";
import "@/shared/styles/index.css";
import { PermissionProvider } from "@/context/PermissionContext";

createRoot(document.getElementById("root")!).render(
  <PermissionProvider>
    <App />
  </PermissionProvider>
);
