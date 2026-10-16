import { LockOutlined } from "@mui/icons-material";

/** Shown to an Admin / Staff user who hasn't been granted any page yet. */
const NoAccess = () => (
  <section className="ui-page">
    <div className="ui-empty">
      <LockOutlined fontSize="large" aria-hidden />
      <h3>No pages assigned yet</h3>
      <p>
        Your account doesn't have access to any page yet. Ask your admin to grant
        the pages and hotels you need, then sign in again.
      </p>
    </div>
  </section>
);

export default NoAccess;
