import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initConsoleFilter } from "./utils/consoleFilter";

// Filter out harmless third-party console errors (Google Play, analytics, etc.)
initConsoleFilter();

createRoot(document.getElementById("root")!).render(<App />);
