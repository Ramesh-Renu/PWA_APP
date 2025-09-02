import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { GlobalProvider } from "./store/context/GlobalProvider";
import ToastDialog from "./components/common/ToastDialog";
import { I18nextProvider, initReactI18next } from "react-i18next";
import i18n from "i18next";
import translate_EN from "translations/EN.json";

// TRANSLATOR
i18n.use(initReactI18next).init({
  interpolation: { escapeValue: false },
  lng: "en",
  resources: {
    en: { ...translate_EN },
  },
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <I18nextProvider i18n={i18n}>
      <GlobalProvider>
        {" "}
        {/* ✅ Wrap Global Context around Router */}
        <BrowserRouter>
          <ToastDialog />
          <App />
        </BrowserRouter>
      </GlobalProvider>
    </I18nextProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
