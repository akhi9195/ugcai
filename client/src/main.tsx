import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { BrowserRouter } from "react-router-dom";

import { ThemeProvider } from "./context/ThemeContext";
import { ClerkWithTheme } from "./context/ClerkWithTheme";
// const PUBLISHABE_KEY = import.meta.env.VITE_CLERK_PLUBLISHABLE_KEY;

// if (!PUBLISHABE_KEY) throw new Error("Missing Clerk Publishable Key");

createRoot(document.getElementById("root")! as HTMLElement).render(
  <ThemeProvider>
    <ClerkWithTheme>
      <BrowserRouter>
        <App />
      </BrowserRouter>
      ,
    </ClerkWithTheme>
    ,
  </ThemeProvider>,
);
