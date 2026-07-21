import React, { useEffect, useState } from "react";
import {
  Avatar,
  Button,
  TextField,
  MenuItem,
  Paper,
  Typography,
  Box,
} from "@mui/material";

import {
  deleteMenu,
  getAllMenu,
  getAllHotel,
  getAllMenuCategories,
} from "services";
import { Fragment } from "react";
import PopupModal from "components/common/PopupModal";
import AddMenu from "./AddMenu";

// import { getAllCategory } from "../../api/apiService";

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
  const [showDeleteCategory, setShowDeleteCategory] = useState(false);

  const [filters, setFilters] = useState({
    search: "",
    hotel_id: "",
    category_id: "",
  });

  useEffect(() => {
    loadHotels();
    loadCategories();
    loadMenus();
    setFilters({
      search: "",
      hotel_id: hotelId || "",
      category_id: "",
    });
  }, []);

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
      const res = await getAllMenuCategories();

      setCategories(extractList(res));
    } catch (err) {
      console.error(err);
    }
  };

  const loadMenus = async () => {
    try {
      setLoading(true);

      const res = await getAllMenu(filters);
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
    setShowAddMenu(true);
  };

  const handleEditMenu = (menu) => {
    setSelectedMenu(menu);
    setShowAddMenu(true);
  };

  const handleDeleteMenu = async (menu) => {
    const menuId = menu?.id ?? menu?.menu_id;

    if (
      !window.confirm(
        `Delete ${menu?.menu_name || menu?.name || "this menu item"}?`,
      )
    ) {
      return;
    }

    setDeletingMenuId(menuId);

    try {
      await deleteMenu(menuId);
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
      <Box className="menu-management-page">
        {/* Header */}

        <Box className="menu-management-header">
          <Box>
            <Typography
              variant="h5"
              fontWeight={700}
              className="menu-management-title"
            >
              Menu Management
            </Typography>
            <Typography variant="body2" className="menu-management-subtitle">
              Manage menu items, availability, and pricing.
            </Typography>
          </Box>

          <Button
            variant="contained"
            className="menu-add-button"
            onClick={handleAddMenu}
          >
            Add Menu
          </Button>
        </Box>

        {/* Filters */}

        <Paper className="menu-filter-panel">
          <Box className="menu-filter-grid">
            <TextField
              fullWidth
              label="Search"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              size="small"
            />

            <TextField
              select
              fullWidth
              label="Category"
              name="category_id"
              value={filters.category_id}
              onChange={handleFilterChange}
              size="small"
            >
              <MenuItem value="">All Categories</MenuItem>

              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.category_name}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </Paper>

        {/* Table */}
        <Paper className="menu-table-panel">
          <table className="menu-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Menu Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Veg</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      textAlign: "center",
                      padding: 30,
                    }}
                  >
                    Loading...
                  </td>
                </tr>
              ) : menus.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      textAlign: "center",
                      padding: 30,
                    }}
                  >
                    No Menu Found
                  </td>
                </tr>
              ) : (
                menus.map((menu) => {
                  const menuId = menu.id ?? menu.menu_id;
                  const menuName = menu.menu_name ?? menu.name;
                  const imageUrl = menu.image_url ?? menu.image;
                  const categoryName =
                    menu.category_name ?? menu.category?.category_name;

                  return (
                    <tr key={menuId}>
                      <td data-label="Image">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={menuName}
                            className="menu-item-image"
                          />
                        ) : (
                          <Avatar className="menu-item-image menu-item-avatar">
                            {menuName?.charAt(0) || "M"}
                          </Avatar>
                        )}
                      </td>
                      <td data-label="Menu Name">{menuName}</td>
                      <td data-label="Category">{categoryName}</td>
                      <td data-label="Price">&#8377; {menu.price}</td>
                      <td data-label="Veg">
                        {menu.is_veg ? "Veg" : "Non Veg"}
                      </td>
                      <td data-label="Status">
                        {menu.is_available ? "Available" : "Unavailable"}
                      </td>
                      <td data-label="Actions">
                        <Button
                          size="small"
                          className="menu-action-button"
                          onClick={() => handleEditMenu(menu)}
                        >
                          Edit
                        </Button>

                        <Button
                          size="small"
                          color="error"
                          className="menu-action-button"
                          onClick={() =>
                            setShowDeleteCategory(!showDeleteCategory)
                          }
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </Paper>
      </Box>
      <PopupModal
        show={showAddMenu}
        onClose={closeShowPopup}
        header
        title={selectedMenu ? "Edit Menu" : "Add Menu"}
        className={"orderOrionDashboard bg-white rounded-4"}
        customClassName="menu-modal-dialog"
      >
        <AddMenu
          hotels={hotels}
          categories={categories}
          hotelId={hotelId}
          menu={selectedMenu}
          onSaved={async () => {
            closeShowPopup();
            await loadMenus();
          }}
        />
      </PopupModal>
      <PopupModal
        show={showDeleteCategory}
        onClose={() => setShowDeleteCategory(false)}
        className={"popupModal bg-white rounded-4"}
        width={"40vh"}
      >
        <div>
          <h5 className="text-center">Do you want to Delete this Category ?</h5>
          <div className="d-flex flex-row justify-content-center gap-3 mt-4 modalActions">
            <button
              className="btn btn-0 modalDelete_btn px-3"
              onClick={() => handleDeleteMenu(menu)}
            >
              Yes
            </button>
            <button
              className="btn btn-0 modalCancel_btn px-3"
              onClick={() => {
                setShowDeleteCategory(false);
                setDeletingMenuId(null);
              }}
            >
              No
            </button>
          </div>
        </div>
      </PopupModal>
    </Fragment>
  );
};

export default MenuList;
