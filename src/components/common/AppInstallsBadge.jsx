import React, { useEffect, useRef, useState } from "react";
import { InstallMobileRounded } from "@mui/icons-material";
import { getPwaInstallSummary } from "services";
import { InstallStepsDialog } from "components/common/InstallApp";

const REFRESH_MS = 5 * 60 * 1000;
const PLATFORM_LABELS = {
  android: "Android",
  ios: "iPhone / iPad",
  windows: "Windows",
  mac: "Mac",
  linux: "Linux",
  other: "Other",
};

/**
 * Admin-only pill at the top of every page: how many users installed the
 * app. Click for devices, last 7 days, platforms and the install steps.
 */
const AppInstallsBadge = () => {
  const [summary, setSummary] = useState(null);
  const [open, setOpen] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    let active = true;
    const load = () =>
      getPwaInstallSummary()
        .then((response) => active && response?.success && setSummary(response.data))
        .catch(() => {});
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  // Close the details when clicking elsewhere.
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (event) => {
      if (!wrapRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  if (!summary) return null;

  const users = Number(summary.users) || 0;
  const platforms = Object.entries(summary.by_platform || {}).sort((a, b) => b[1] - a[1]);

  return (
    <div className="installs-badge" ref={wrapRef}>
      <button
        type="button"
        className="installs-badge__pill"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        title="Users who installed the app"
      >
        <InstallMobileRounded fontSize="small" aria-hidden />
        <strong>{users}</strong> {users === 1 ? "user" : "users"} installed the app
      </button>

      {open && (
        <div className="installs-badge__panel" role="dialog" aria-label="App installs">
          <dl>
            <div>
              <dt>Users</dt>
              <dd>{users}</dd>
            </div>
            <div>
              <dt>Devices</dt>
              <dd>{Number(summary.devices) || 0}</dd>
            </div>
            <div>
              <dt>Last 7 days</dt>
              <dd>+{Number(summary.last_7_days) || 0}</dd>
            </div>
          </dl>
          {platforms.length > 0 && (
            <ul className="installs-badge__platforms">
              {platforms.map(([platform, count]) => (
                <li key={platform}>
                  <span>{PLATFORM_LABELS[platform] || platform}</span>
                  <strong>{count}</strong>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            className="ui-btn ui-btn--ghost ui-btn--sm installs-badge__steps"
            onClick={() => {
              setOpen(false);
              setShowSteps(true);
            }}
          >
            How users install it
          </button>
        </div>
      )}

      <InstallStepsDialog show={showSteps} onClose={() => setShowSteps(false)} />
    </div>
  );
};

export default AppInstallsBadge;
