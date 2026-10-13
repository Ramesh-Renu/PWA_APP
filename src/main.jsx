import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { registerSW } from "virtual:pwa-register";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { GlobalProvider } from "./store/context/GlobalProvider";
import { AppThemeProvider } from "theme/ThemeProvider";
import ToastDialog from "./components/common/ToastDialog";
// Listen for the browser's install offer from the very start.
import "utils/pwaInstall";

registerSW({
  onOfflineReady() {
    console.log("App is ready for offline use.");
  },
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <AppThemeProvider>
      <GlobalProvider>
        <BrowserRouter>
          <ToastDialog />
          <App />
        </BrowserRouter>
      </GlobalProvider>
    </AppThemeProvider>
  </React.StrictMode>
);

reportWebVitals();
