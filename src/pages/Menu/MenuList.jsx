import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Avatar,
  Button,
  TextField,
  MenuItem,
  Paper,
  Typography,
  Box,
} from "@mui/material";

import { getAllMenu, getAllHotel } from "services";
import { Fragment } from "react";
import PopupModal from "components/common/PopupModal";
import AddMenu from "./AddMenu";

// import { getAllCategory } from "../../api/apiService";

const MenuList = ({ hotelId }) => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const [menus, setMenus] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showAddMenu, setShowAddMenu] = useState(false);

  const [filters, setFilters] = useState({
    search: "",
    hotel_id: "",
    category_id: "",
  });

  useEffect(() => {
    loadHotels();
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

      if (res.success) {
        setHotels(res.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadMenus = async () => {
    try {
      setLoading(true);

      const res = await getAllMenu(filters);

      if (res.success) {
        setMenus(res.data || []);
      }
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
  };
  const handleAddMenu = () => {
    setShowAddMenu(!showAddMenu);
  };

  return (
    <Fragment>
      <Box className="menu-management-page">
        {/* Header */}

        <Box className="menu-management-header">
          <Box>
            <Typography variant="h5" fontWeight={700} className="menu-management-title">
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
                menus.map((menu) => (
                  <tr key={menu.id}>
                    <td data-label="Image">
                      {menu.image_url ? (
                        <img
                          src={menu.image_url}
                          alt={menu.menu_name}
                          className="menu-item-image"
                        />
                      ) : (
                        <Avatar className="menu-item-image menu-item-avatar">
                          {menu.menu_name?.charAt(0) || "M"}
                        </Avatar>
                      )}
                    </td>

                    <td data-label="Menu Name">{menu.menu_name}</td>

                    <td data-label="Category">{menu.category_name}</td>

                    <td data-label="Price">&#8377; {menu.price}</td>

                    <td data-label="Veg">{menu.is_veg ? "Veg" : "Non Veg"}</td>

                    <td data-label="Status">
                      {menu.is_available ? "Available" : "Unavailable"}
                    </td>

                    <td data-label="Actions">
                      <Button
                        size="small"
                        className="menu-action-button"
                        onClick={() => navigate(`/menu/edit/${menu.id}`)}
                      >
                        Edit
                      </Button>

                      <Button
                        size="small"
                        color="error"
                        className="menu-action-button"
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Paper>
      </Box>
      <PopupModal
        show={showAddMenu}
        onClose={closeShowPopup}
        header={"Add Menu"}
        className={"orderOrionDashboard bg-white rounded-4"}
        customClassName="menu-modal-dialog"
      >
        <AddMenu />
      </PopupModal>
    </Fragment>
  );
};

export default MenuList;
