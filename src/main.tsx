import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { ClerkProvider } from "@clerk/react";
import { dark } from "@clerk/themes";
const PUBLISHABE_KEY = import.meta.env.VITE_CLERK_PLUBLISHABLE_KEY;

// if (!PUBLISHABE_KEY) throw new Error("Missing Clerk Publishable Key");

createRoot(document.getElementById("root")! as HTMLElement).render(
  <ClerkProvider
    appearance={{
      theme: dark,
      variables: {
        colorPrimary: "$4f39f6",
        colorTextOnPrimaryBackground: "#ffffff",
      },
    }}
    publishableKey={PUBLISHABE_KEY}
  >
    <BrowserRouter>
      <App />
    </BrowserRouter>
    ,
  </ClerkProvider>,
);
