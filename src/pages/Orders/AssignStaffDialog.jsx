import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckRounded, SearchRounded } from "@mui/icons-material";
import PopupModal from "components/common/PopupModal";
import StaffAvatar from "pages/Settings/Staff/StaffAvatar";

/**
 * Pick a cook or server for an order (config from staffConfig.js). Lists the
 * active staff of the order's hotel plus staff who work at all hotels.
 */
const AssignStaffDialog = ({
  config,
  order,
  question,
  confirmLabel,
  onAssign,
  onCancel,
}) => {
  const navigate = useNavigate();
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");
  const { nameField, detailField, singular, title, icon: Icon, kind } = config;
  const lower = singular.toLowerCase();

  useEffect(() => {
    if (!order) return undefined;
    let active = true;
    setSelectedId(order[config.orderField] ?? order[config.orderRelation]?.id ?? null);
    setSearch("");
    setLoading(true);
    // Only staff relevant to this hotel (its own + all-hotel staff whose
    // location / area fit). Servers and cleaners also by the booking's floor;
    // cooks work in the kitchen, so no floor for them.
    const floorId = kind === "cook" ? null : order.floor_id ?? order.reservation?.floor_id;
    config.api
      .list({
        hotel_id: order.hotel_id,
        is_active: true,
        ...(floorId ? { floor_id: floorId } : {}),
      })
      .then((response) => {
        if (active) setPeople(Array.isArray(response?.data) ? response.data : []);
      })
      .catch(() => active && setPeople([]))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [order, config]);

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return people;
    return people.filter((person) =>
      [person[nameField], person[detailField]]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query)),
    );
  }, [people, search, nameField, detailField]);

  const selected = people.find((person) => person.id === selectedId);

  return (
    <PopupModal
      show={Boolean(order)}
      onClose={onCancel}
      header
      title={`Assign a ${lower} · ${order?.order_number || `#${order?.id ?? ""}`}`}
      className="hotel-form__body"
      customClassName="hotel-form-dialog menu-editor-dialog category-dialog"
    >
      <div className="hotel-form">
        <p className="assign-cook__intro">
          {order?.hotel?.hotel_name ? `${order.hotel.hotel_name} · ` : ""}
          {question}
        </p>

        {people.length > 6 && (
          <label className="menu-dishes__search">
            <SearchRounded fontSize="small" aria-hidden />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={`Search ${title.toLowerCase()}`}
              aria-label={`Search ${title.toLowerCase()}`}
            />
          </label>
        )}

        {loading ? (
          <p className="menu-dishes__empty">Loading {title.toLowerCase()}…</p>
        ) : people.length === 0 ? (
          <div className="assign-cook__empty">
            <Icon />
            <p>No active {title.toLowerCase()} for this hotel yet.</p>
            <button
              type="button"
              className="ui-btn ui-btn--ghost ui-btn--sm"
              onClick={() => navigate(config.settingsPath)}
            >
              Add {title.toLowerCase()} in Settings
            </button>
          </div>
        ) : (
          <div className="assign-cook__list" role="radiogroup" aria-label={title}>
            {visible.map((person) => {
              const isSelected = person.id === selectedId;
              return (
                <button
                  key={person.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  className={`assign-cook__option${isSelected ? " is-selected" : ""}`}
                  onClick={() => setSelectedId(person.id)}
                >
                  <StaffAvatar
                    name={person[nameField]}
                    photo={person.photo_url}
                    size={40}
                    tone={kind}
                  />
                  <span className="assign-cook__text">
                    <strong>{person[nameField]}</strong>
                    <small>{person[detailField] || singular}</small>
                  </span>
                  <span className="assign-cook__check" aria-hidden>
                    {isSelected && <CheckRounded fontSize="small" />}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="hotel-form__actions">
        <button
          type="button"
          className="hotel-form__btn hotel-form__btn--ghost"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          type="button"
          className="hotel-form__btn hotel-form__btn--primary"
          disabled={!selected}
          onClick={() => selected && onAssign(selected)}
        >
          {confirmLabel}
        </button>
      </div>
    </PopupModal>
  );
};

export default AssignStaffDialog;
