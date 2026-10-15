import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PopupModal from "components/common/PopupModal";
import ConfirmDialog from "components/common/ConfirmDialog";
import useGlobalMaster from "hooks/useGlobalMaster";
import useIncrementalRows from "hooks/useIncrementalRows";
import { getApiErrorMessage } from "utils/apiError";
import { MASTERS } from "./masterConfigs";
import SettingsBackLink from "pages/Settings/SettingsBackLink";

const listOf = (response) => {
  const value = response?.data ?? response?.rows ?? response;
  return Array.isArray(value) ? value : [];
};

const emptyFormOf = (fields) =>
  Object.fromEntries(fields.map((field) => [field.name, field.default ?? ""]));

/**
 * Settings → one master table (locations, statuses, spice levels…),
 * driven by a config in masterConfigs.js: columns, form fields, which
 * actions exist and when a row can't be deleted.
 */
const MasterPage = () => {
  const { master } = useParams();
  const config = MASTERS[master];
  const globalMaster = useGlobalMaster();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!config) return;
    setLoading(true);
    setError("");
    try {
      setRows(listOf(await config.api.list(config.listParams)));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError) || `Unable to load ${config.title.toLowerCase()}.`);
    } finally {
      setLoading(false);
    }
  }, [config]);

  useEffect(() => {
    setSearch("");
    setNotice("");
    setDialogOpen(false);
    load();
  }, [load]);

  const visible = useMemo(() => {
    if (!config) return [];
    const query = search.trim().toLowerCase();
    const sorted = config.sort ? [...rows].sort(config.sort) : rows;
    if (!query) return sorted;
    return sorted.filter((row) =>
      config
        .searchText(row)
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [rows, search, config]);
  const { shown, hasMore, scrollRef, sentinelRef } = useIncrementalRows(visible);

  if (!config) return <Navigate to="/settings" replace />;

  const canCreate = Boolean(config.api.create);
  const canDelete = Boolean(config.api.remove);

  const duplicateName = (() => {
    if (!config.uniqueField) return false;
    const value = String(form[config.uniqueField] || "").trim().toLowerCase();
    if (!value) return false;
    return rows.some(
      (row) =>
        row.id !== editing?.id &&
        String(config.uniqueValue ? config.uniqueValue(row) : row[config.uniqueField] || "")
          .trim()
          .toLowerCase() === value,
    );
  })();

  const openCreate = () => {
    setEditing(null);
    setForm(emptyFormOf(config.fields));
    setFormError("");
    setDialogOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm(config.toForm ? config.toForm(row) : { ...emptyFormOf(config.fields), ...row });
    setFormError("");
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (!saving) setDialogOpen(false);
  };

  const setField = (name, value) => setForm((current) => ({ ...current, [name]: value }));

  const missingRequired = config.fields.some(
    (field) => field.required && !String(form[field.name] ?? "").trim(),
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (missingRequired || duplicateName) return;
    const body = config.toBody(form);

    setSaving(true);
    setFormError("");
    try {
      if (editing) {
        await config.api.update(editing.id, body);
        setNotice(`${config.singular} updated.`);
      } else {
        await config.api.create(body);
        setNotice(`${config.singular} added.`);
      }
      setDialogOpen(false);
      await load();
      // Boards keep these lists in memory: refresh so new names show at once.
      if (config.refreshGlobal) globalMaster[config.refreshGlobal]?.();
    } catch (requestError) {
      setFormError(getApiErrorMessage(requestError) || `Unable to save this ${config.singular.toLowerCase()}.`);
    } finally {
      setSaving(false);
    }
  };

  const blockedReason = toDelete && config.inUse ? config.inUse(toDelete) : null;

  const confirmDelete = async () => {
    if (!toDelete) return;
    if (blockedReason) {
      setToDelete(null);
      return;
    }
    setDeleting(true);
    setError("");
    try {
      await config.api.remove(toDelete.id);
      setNotice(`${config.singular} deleted.`);
      setToDelete(null);
      await load();
    } catch (requestError) {
      setToDelete(null);
      setError(getApiErrorMessage(requestError) || `Unable to delete this ${config.singular.toLowerCase()}.`);
    } finally {
      setDeleting(false);
    }
  };

  const columnCount = config.columns.length + 1;

  return (
    <section className="ui-page">
      <SettingsBackLink />
      <header className="ui-header">
        <div>
          <span className="ui-kicker">Settings</span>
          <h1>{config.title}</h1>
          <p>{config.intro}</p>
        </div>
        {canCreate && (
          <div className="ui-header__actions">
            <button type="button" className="ui-btn ui-btn--primary" onClick={openCreate}>
              <AddRoundedIcon fontSize="small" /> Add {config.singular.toLowerCase()}
            </button>
          </div>
        )}
      </header>

      {config.systemNote && (
        <div className="ui-alert master-note" role="note">
          <LockOutlinedIcon fontSize="small" aria-hidden />
          <span>{config.systemNote}</span>
        </div>
      )}
      {error && (
        <div className="ui-alert ui-alert--danger" role="alert">
          <span>{error}</span>
          <button type="button" aria-label="Dismiss" onClick={() => setError("")}>
            ×
          </button>
        </div>
      )}
      {notice && (
        <div className="ui-alert ui-alert--success" role="status">
          <span>{notice}</span>
          <button type="button" aria-label="Dismiss" onClick={() => setNotice("")}>
            ×
          </button>
        </div>
      )}

      <div className="ui-toolbar">
        <label className="ui-search">
          <SearchRoundedIcon fontSize="small" aria-hidden />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={`Search ${config.title.toLowerCase()}`}
            aria-label={`Search ${config.title.toLowerCase()}`}
          />
        </label>
        <span className="ui-toolbar__count">
          {visible.length} {visible.length === 1 ? config.singular.toLowerCase() : config.title.toLowerCase()}
        </span>
      </div>

      <div ref={scrollRef} className="ui-panel ui-table-wrap ui-table-wrap--scroll">
        <table className="ui-table">
          <thead>
            <tr>
              {config.columns.map((column) => (
                <th key={column.label} className={column.align ? `is-${column.align}` : undefined}>
                  {column.label}
                </th>
              ))}
              <th className="is-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr className="ui-table__state">
                <td colSpan={columnCount}>Loading…</td>
              </tr>
            ) : visible.length === 0 ? (
              <tr className="ui-table__state">
                <td colSpan={columnCount}>Nothing found.</td>
              </tr>
            ) : (
              shown.map((row) => (
                <tr key={row.id}>
                  {config.columns.map((column) => (
                    <td
                      key={column.label}
                      className={[
                        column.strong && "is-strong",
                        column.muted && "is-muted",
                        column.desc && "ui-table__desc",
                        column.align && `is-${column.align}`,
                      ]
                        .filter(Boolean)
                        .join(" ") || undefined}
                    >
                      {column.render(row)}
                    </td>
                  ))}
                  <td className="is-right">
                    <button
                      type="button"
                      className="ui-icon-btn"
                      title="Edit"
                      aria-label={`Edit ${config.rowName(row)}`}
                      onClick={() => openEdit(row)}
                    >
                      <EditOutlinedIcon fontSize="small" />
                    </button>
                    {canDelete && (
                      <button
                        type="button"
                        className="ui-icon-btn ui-icon-btn--danger"
                        title="Delete"
                        aria-label={`Delete ${config.rowName(row)}`}
                        onClick={() => setToDelete(row)}
                      >
                        <DeleteOutlineRoundedIcon fontSize="small" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
            {!loading && hasMore && (
              <tr className="ui-table__more">
                <td ref={sentinelRef} colSpan={columnCount}>
                  Loading more…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <PopupModal
        show={dialogOpen}
        onClose={closeDialog}
        header
        title={editing ? `Edit ${config.singular.toLowerCase()}` : `Add ${config.singular.toLowerCase()}`}
        className="hotel-form__body"
        customClassName="hotel-form-dialog menu-editor-dialog category-dialog"
      >
        <form className="menu-editor" onSubmit={handleSubmit}>
          <div className="hotel-form">
            {formError && (
              <p className="menu-editor__alert" role="alert">
                {formError}
              </p>
            )}
            {editing && config.editHint && (
              <p className="hotel-form__hint master-edit-hint">{config.editHint(editing)}</p>
            )}
            <section className="hotel-form__section">
              <div className="hotel-form__grid">
                {config.fields.map((field) => {
                  const id = `master-${master}-${field.name}`;
                  const value = form[field.name] ?? "";
                  const invalid = field.name === config.uniqueField && duplicateName;
                  return field.type === "switch" ? (
                    <label
                      key={field.name}
                      className="menu-switch hotel-form__field--full"
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(value)}
                        onChange={(event) => setField(field.name, event.target.checked)}
                      />
                      <span className="menu-switch__track" aria-hidden />
                      <span>
                        <strong>{value ? field.onLabel : field.offLabel}</strong>
                        <small>{field.hint}</small>
                      </span>
                    </label>
                  ) : (
                    <div
                      key={field.name}
                      className={`hotel-form__field${field.full ? " hotel-form__field--full" : ""}`}
                    >
                      <label className="hotel-form__label" htmlFor={id}>
                        {field.label} {field.required && <sup>*</sup>}
                      </label>
                      {field.type === "textarea" ? (
                        <textarea
                          id={id}
                          className="hotel-form__input menu-editor__textarea"
                          value={value}
                          onChange={(event) => setField(field.name, event.target.value)}
                          rows={2}
                          placeholder={field.placeholder}
                        />
                      ) : field.type === "color" ? (
                        <span className="master-color">
                          <input
                            id={id}
                            type="color"
                            value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#64748B"}
                            onChange={(event) => setField(field.name, event.target.value.toUpperCase())}
                          />
                          <input
                            className="hotel-form__input"
                            value={value}
                            onChange={(event) => setField(field.name, event.target.value)}
                            placeholder="#0F766E"
                            aria-label={`${field.label} code`}
                            maxLength={7}
                          />
                        </span>
                      ) : (
                        <input
                          id={id}
                          type={field.type === "number" ? "number" : "text"}
                          min={field.type === "number" ? 0 : undefined}
                          className={`hotel-form__input${invalid ? " is-invalid" : ""}`}
                          value={value}
                          onChange={(event) => setField(field.name, event.target.value)}
                          placeholder={field.placeholder}
                          autoComplete="off"
                          aria-invalid={invalid || undefined}
                          autoFocus={field.autoFocus}
                          required={field.required}
                        />
                      )}
                      {invalid && (
                        <span className="hotel-form__error">
                          “{String(value).trim()}” already exists.
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          <div className="hotel-form__actions">
            <button
              type="button"
              className="hotel-form__btn hotel-form__btn--ghost"
              onClick={closeDialog}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="hotel-form__btn hotel-form__btn--primary"
              disabled={saving || missingRequired || duplicateName}
            >
              {saving && <span className="btn-spinner" aria-hidden />}
              {saving ? "Saving…" : editing ? "Save changes" : `Add ${config.singular.toLowerCase()}`}
            </button>
          </div>
        </form>
      </PopupModal>

      {canDelete && (
        <ConfirmDialog
          show={Boolean(toDelete)}
          tone={blockedReason ? "warning" : "danger"}
          title={
            blockedReason
              ? `“${toDelete ? config.rowName(toDelete) : ""}” is in use`
              : `Delete “${toDelete ? config.rowName(toDelete) : ""}”?`
          }
          message={blockedReason || `It will be removed from ${config.title.toLowerCase()}.`}
          confirmLabel={blockedReason ? "OK" : `Delete ${config.singular.toLowerCase()}`}
          loading={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </section>
  );
};

export default MasterPage;
