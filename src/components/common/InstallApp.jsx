import React, { useEffect, useState } from "react";
import {
  CloseRounded,
  GetAppRounded,
  InstallMobileRounded,
} from "@mui/icons-material";
import PopupModal from "components/common/PopupModal";
import {
  getInstallState,
  promptInstall,
  reportInstalledDevice,
  subscribeInstall,
} from "utils/pwaInstall";

const DISMISS_KEY = "pwa_banner_dismissed_until";
const DISMISS_DAYS = 14;

// Step-by-step install guide per platform.
export const INSTALL_STEPS = {
  android: {
    label: "Android",
    steps: [
      "Open the app in Chrome.",
      "Tap the ⋮ menu (top right).",
      "Tap “Install app” (or “Add to Home screen”).",
      "Tap “Install”. The Table Booking icon appears on your home screen.",
    ],
  },
  ios: {
    label: "iPhone / iPad",
    steps: [
      "Open the app in Safari (other iPhone browsers can't install apps).",
      "Tap the Share button (□ with an arrow ↑) at the bottom.",
      "Scroll down and tap “Add to Home Screen”.",
      "Tap “Add”. The Table Booking icon appears on your home screen.",
    ],
  },
  desktop: {
    label: "Computer",
    steps: [
      "Open the app in Chrome or Edge.",
      "Click the install icon (⊕ / monitor with an arrow) at the right end of the address bar,",
      "or open the browser menu and choose “Install Table Booking”.",
      "Click “Install”. The app opens in its own window and gets a desktop / Start-menu icon.",
    ],
  },
};

const stepsKeyFor = (platform) =>
  platform === "ios" ? "ios" : platform === "android" ? "android" : "desktop";

const useInstallState = () => {
  const [state, setState] = useState(getInstallState);
  useEffect(() => subscribeInstall(setState), []);
  return state;
};

/** Popup with the install steps (current device's platform first). */
export const InstallStepsDialog = ({ show, onClose }) => {
  const { platform, canPrompt } = useInstallState();
  const [tab, setTab] = useState(stepsKeyFor(platform));

  useEffect(() => {
    if (show) setTab(stepsKeyFor(platform));
  }, [show, platform]);

  return (
    <PopupModal
      show={show}
      onClose={onClose}
      header
      title="Install the Table Booking app"
      className="hotel-form__body"
      customClassName="hotel-form-dialog install-dialog"
    >
      <div className="install-dialog__body">
        <p className="install-dialog__intro">
          Get the app on your home screen: it opens in one tap, full screen, and
          keeps working with a weak connection.
        </p>

        {canPrompt && (
          <button
            type="button"
            className="ui-btn ui-btn--primary install-dialog__one-click"
            onClick={async () => {
              const outcome = await promptInstall();
              if (outcome === "accepted") onClose();
            }}
          >
            <GetAppRounded fontSize="small" /> Install now
          </button>
        )}

        <div className="install-dialog__tabs" role="tablist" aria-label="Device">
          {Object.entries(INSTALL_STEPS).map(([key, { label }]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              className={`order-chip${tab === key ? " is-active" : ""}`}
              onClick={() => setTab(key)}
            >
              {label}
              {key === stepsKeyFor(platform) ? " (this device)" : ""}
            </button>
          ))}
        </div>

        <ol className="install-dialog__steps">
          {INSTALL_STEPS[tab].steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </div>
      <div className="hotel-form__actions">
        <button type="button" className="hotel-form__btn hotel-form__btn--ghost" onClick={onClose}>
          Close
        </button>
      </div>
    </PopupModal>
  );
};

/**
 * Banner telling the user the app can be installed (hidden when it already
 * runs installed, or for 14 days after "Not now"). Also reports installed
 * devices for the admin install count.
 */
const InstallAppBanner = () => {
  const state = useInstallState();
  const [showSteps, setShowSteps] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return Number(localStorage.getItem(DISMISS_KEY) || 0) > Date.now();
    } catch {
      return false;
    }
  });

  // Count this device when it runs as the installed app.
  useEffect(() => {
    reportInstalledDevice();
  }, [state.installed]);

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(
        DISMISS_KEY,
        String(Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000),
      );
    } catch {
      // Hidden for this visit only.
    }
  };

  const install = async () => {
    if (state.canPrompt) {
      await promptInstall();
    } else {
      setShowSteps(true);
    }
  };

  if (state.installed) return null;

  return (
    <>
      {!dismissed && (
        <div className="install-banner" role="region" aria-label="Install the app">
          <span className="install-banner__icon" aria-hidden>
            <InstallMobileRounded />
          </span>
          <span className="install-banner__text">
            <strong>Install the Table Booking app</strong>
            <small>One tap from your home screen, full screen, works on weak networks.</small>
          </span>
          <span className="install-banner__actions">
            <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={install}>
              <GetAppRounded fontSize="small" /> {state.canPrompt ? "Install" : "How to install"}
            </button>
            {state.canPrompt && (
              <button
                type="button"
                className="install-banner__link"
                onClick={() => setShowSteps(true)}
              >
                Steps
              </button>
            )}
            <button
              type="button"
              className="install-banner__close"
              aria-label="Not now"
              title="Not now"
              onClick={dismiss}
            >
              <CloseRounded fontSize="small" />
            </button>
          </span>
        </div>
      )}
      <InstallStepsDialog show={showSteps} onClose={() => setShowSteps(false)} />
    </>
  );
};

export default InstallAppBanner;
