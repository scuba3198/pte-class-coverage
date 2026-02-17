import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./presentation/styles/index.css";
import App from "./presentation/App.tsx";
import { AppProvider } from "./presentation/context/AppContext.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </StrictMode>,
);
