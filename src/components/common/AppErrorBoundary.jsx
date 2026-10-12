import React from "react";

const RELOAD_FLAG = "chunkReloadAt";

// A lazily loaded page whose file changed or was removed since the app was
// opened (new deploy, or the dev server rebuilt it).
const isChunkLoadError = (error) =>
  /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|ChunkLoadError/i.test(
    String(error?.message || error),
  );

/**
 * Shows a readable error with a Reload button instead of a blank screen.
 * Chunk-load errors reload the page once automatically. Pass `resetKey`
 * (e.g. the path) so navigating elsewhere clears the error.
 */
class AppErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Page crashed:", error, info?.componentStack);

    if (isChunkLoadError(error)) {
      let last = 0;
      try {
        last = Number(sessionStorage.getItem(RELOAD_FLAG)) || 0;
      } catch {
        // storage unavailable
      }
      // Reload once; if it fails again within a minute, show the error.
      if (Date.now() - last > 60_000) {
        try {
          sessionStorage.setItem(RELOAD_FLAG, String(Date.now()));
        } catch {
          // storage unavailable
        }
        window.location.reload();
      }
    }
  }

  componentDidUpdate(prevProps) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const chunk = isChunkLoadError(error);
    return (
      <div className="app-crash" role="alert">
        <div className="app-crash__card">
          <h2>{chunk ? "A newer version is available" : "Something went wrong on this page"}</h2>
          <p>
            {chunk
              ? "This page was updated. Reload to get the latest version."
              : "Reload the page to try again. If it keeps happening, share the details below."}
          </p>
          {!chunk && <pre>{String(error?.message || error)}</pre>}
          <button
            type="button"
            className="ui-btn ui-btn--primary"
            onClick={() => window.location.reload()}
          >
            Reload page
          </button>
        </div>
      </div>
    );
  }
}

export default AppErrorBoundary;
