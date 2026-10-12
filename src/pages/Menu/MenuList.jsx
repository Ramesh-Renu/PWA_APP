import React, { useEffect, useState } from "react";
import {
  AddRounded,
  DeleteOutlineRounded,
  EditOutlined,
  SearchRounded,
} from "@mui/icons-material";

import {
  deleteMenu,
  getAllMenu,
  getAllHotel,
  getAllMenuCategories,
} from "services";
import { Fragment } from "react";
import PopupModal from "components/common/PopupModal";
import ConfirmDialog from "components/common/ConfirmDialog";
import AddMenu from "./AddMenu";

const extractList = (response) => {
  const candidates = [
    response?.data?.data,
    response?.data?.items,
    response?.data?.rows,
    response?.data?.menus,
    response?.data,
    response,
  ];

  return candidates.find(Array.isArray) || [];
};

const MenuList = ({ hotelId }) => {
  const [loading, setLoading] = useState(false);

  const [menus, setMenus] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [deletingMenuId, setDeletingMenuId] = useState(null);
  const [menuToDelete, setMenuToDelete] = useState(null);
  const [selectedMenuSidedishes, setSelectedMenuSidedishes] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    hotel_id: hotelId || "",
    category_id: "",
  });

  useEffect(() => {
    loadHotels();
    loadCategories();
  }, []);

  // Update filters when hotelId prop changes
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      hotel_id: hotelId || "",
    }));
  }, [hotelId]);

  useEffect(() => {
    loadMenus();
  }, [filters]);

  const loadHotels = async () => {
    try {
      const res = await getAllHotel();
      setHotels(extractList(res));
    } catch (err) {
      console.error(err);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await getAllMenuCategories(
        hotelId ? { hotel_id: hotelId, limit: 500 } : { limit: 500 },
      );

      setCategories(extractList(res));
    } catch (err) {
      console.error(err);
    }
  };

  const loadMenus = async () => {
    try {
      setLoading(true);

      const res = await getAllMenu({ ...filters, limit: 500 }); // API default is 10
      setMenus(res.rows);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = ({ target }) => {
    setFilters((prev) => ({
      ...prev,
      [target.name]: target.value,
    }));
  };

  const closeShowPopup = () => {
    setShowAddMenu(false);
    setSelectedMenu(null);
  };

  const handleAddMenu = () => {
    setSelectedMenu(null);
    setSelectedMenuSidedishes([]);
    setShowAddMenu(true);
  };

  const handleEditMenu = (menu, menuId) => {
    setSelectedMenu(menu);
    setShowAddMenu(true);
    if (menu.id === menuId) {
      setSelectedMenuSidedishes(menu.sideDishes.map((d) => d.id));
    } else {
      setSelectedMenuSidedishes([]);
    }
  };

  const handleDeleteMenu = async (menu) => {
    const menuId = menu?.id ?? menu?.menu_id;
    if (!menuId) return;

    setDeletingMenuId(menuId);
    try {
      await deleteMenu(menuId);
      setMenuToDelete(null);
      await loadMenus();
    } catch (err) {
      console.error(err);
      window.alert("Unable to delete this menu item. Please try again.");
    } finally {
      setDeletingMenuId(null);
    }
  };

  return (
    <Fragment>
      <section className="ui-page ui-page--embedded menu-page">
        <header className="ui-header">
          <div>
            <span className="ui-kicker">Menu</span>
            <h2>Menu management</h2>
            <p>Manage menu items, availability and pricing.</p>
          </div>
          <div className="ui-header__actions">
            <button
              type="button"
              className="ui-btn ui-btn--primary"
              onClick={handleAddMenu}
            >
              <AddRounded fontSize="small" /> Add menu item
            </button>
          </div>
        </header>

        <div className="ui-toolbar">
          <div className="ui-toolbar__group">
            <label className="ui-search">
              <SearchRounded fontSize="small" aria-hidden />
              <input
                type="search"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Search menu items"
                aria-label="Search menu items"
              />
            </label>
            <select
              className="ui-select"
              name="category_id"
              value={filters.category_id}
              onChange={handleFilterChange}
              aria-label="Filter by category"
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.category_name}
                </option>
              ))}
            </select>
          </div>
          <span className="ui-toolbar__count">
            {menus.length} {menus.length === 1 ? "item" : "items"}
          </span>
        </div>

        <div className="ui-panel ui-table-wrap">
          <table className="ui-table menu-page__table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Category</th>
                <th>Side dishes</th>
                <th className="is-right">Price</th>
                <th>Status</th>
                <th className="is-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr className="ui-table__state">
                  <td colSpan={6}>Loading menu…</td>
                </tr>
              ) : menus.length === 0 ? (
                <tr className="ui-table__state">
                  <td colSpan={6}>
                    No menu items yet. Use “Add menu item” to create one.
                  </td>
                </tr>
              ) : (
                menus.map((menu) => {
                  const menuId = menu.id ?? menu.menu_id;
                  const menuName = menu.menu_name ?? menu.name;
                  const imageUrl = menu.image_url ?? menu.image;
                  const categoryName =
                    menu.category_name ?? menu.category?.category_name;
                  const sideDishes = menu.sideDishes || [];

                  return (
                    <tr key={menuId}>
                      <td data-label="Item">
                        <div className="menu-row__item">
                          {imageUrl ? (
                            <img src={imageUrl} alt="" className="menu-row__thumb" />
                          ) : (
                            <span className="menu-row__thumb menu-row__thumb--empty" aria-hidden>
                              {menuName?.charAt(0) || "M"}
                            </span>
                          )}
                          <div className="menu-row__name">
                            <strong>
                              <span
                                className={`ui-diet ${menu.is_veg ? "ui-diet--veg" : "ui-diet--nonveg"}`}
                                title={menu.is_veg ? "Veg" : "Non-veg"}
                                aria-label={menu.is_veg ? "Veg" : "Non-veg"}
                              />
                              {menuName}
                            </strong>
                            {menu.menu_code && <small>{menu.menu_code}</small>}
                          </div>
                        </div>
                      </td>
                      <td data-label="Category">{categoryName || "—"}</td>
                      <td data-label="Side dishes">
                        {sideDishes.length ? (
                          <div className="menu-row__dishes">
                            {sideDishes.slice(0, 3).map((dish) => (
                              <span key={dish.id} className="ui-chip">
                                {dish.side_dish_name}
                              </span>
                            ))}
                            {sideDishes.length > 3 && (
                              <span
                                className="ui-chip ui-chip--brand"
                                title={sideDishes
                                  .slice(3)
                                  .map((dish) => dish.side_dish_name)
                                  .join(", ")}
                              >
                                +{sideDishes.length - 3}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="is-muted">—</span>
                        )}
                      </td>
                      <td data-label="Price" className="is-right is-strong">
                        ₹{Number(menu.price)}
                      </td>
                      <td data-label="Status">
                        <span
                          className={`ui-chip ${menu.is_available ? "ui-chip--success" : ""}`}
                        >
                          {menu.is_available ? "Available" : "Unavailable"}
                        </span>
                      </td>
                      <td data-label="Actions" className="is-right">
                        <button
                          type="button"
                          className="ui-icon-btn"
                          title="Edit"
                          aria-label={`Edit ${menuName}`}
                          onClick={() => handleEditMenu(menu, menu.id)}
                        >
                          <EditOutlined fontSize="small" />
                        </button>
                        <button
                          type="button"
                          className="ui-icon-btn ui-icon-btn--danger"
                          title="Delete"
                          aria-label={`Delete ${menuName}`}
                          onClick={() => setMenuToDelete(menu)}
                          disabled={deletingMenuId === menuId}
                        >
                          <DeleteOutlineRounded fontSize="small" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
      <PopupModal
        show={showAddMenu}
        onClose={closeShowPopup}
        header
        title={selectedMenu ? "Edit Menu" : "Add Menu"}
        className="hotel-form__body"
        customClassName="hotel-form-dialog menu-editor-dialog"
      >
        <AddMenu
          hotels={hotels}
          categories={categories}
          hotelId={hotelId}
          menu={selectedMenu}
          onCancel={closeShowPopup}
          onSaved={async () => {
            closeShowPopup();
            await loadMenus();
          }}
          selectedMenuSidedishes={selectedMenuSidedishes}
        />
      </PopupModal>
      <ConfirmDialog
        show={Boolean(menuToDelete)}
        title={`Delete ${
          menuToDelete?.menu_name || menuToDelete?.name || "this menu item"
        }?`}
        message="It will be removed from this hotel's menu."
        confirmLabel="Delete item"
        loading={Boolean(deletingMenuId)}
        onConfirm={() => handleDeleteMenu(menuToDelete)}
        onCancel={() => setMenuToDelete(null)}
      />
    </Fragment>
  );
};

export default MenuList;
