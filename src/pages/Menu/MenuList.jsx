import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
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
  } 
  return (
    <Fragment>
      <Box p={3}>
        {/* Header */}

        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={3}
        >
          <Typography variant="h5" fontWeight={600}>
            Menu Management
          </Typography>

          <Button variant="contained" onClick={() => handleAddMenu()}>
            Add Menu
          </Button>
        </Box>

        {/* Filters */}

        <Paper sx={{ p: 2, mb: 3 }}>
          <Box display="grid" gridTemplateColumns="2fr 1fr 1fr" gap={2}>
            <TextField
              fullWidth
              label="Search"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
            />          

            <TextField
              select
              fullWidth
              label="Category"
              name="category_id"
              value={filters.category_id}
              onChange={handleFilterChange}
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

        <Paper>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
            }}
          >
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
                    <td>
                      <img
                        src={menu.image_url}
                        alt={menu.menu_name}
                        width={60}
                        height={60}
                        style={{
                          borderRadius: 8,
                          objectFit: "cover",
                        }}
                      />
                    </td>

                    <td>{menu.menu_name}</td>

                    <td>{menu.category_name}</td>

                    <td>₹ {menu.price}</td>

                    <td>{menu.is_veg ? "Veg" : "Non Veg"}</td>

                    <td>{menu.is_available ? "Available" : "Unavailable"}</td>

                    <td>
                      <Button
                        size="small"
                        onClick={() => navigate(`/menu/edit/${menu.id}`)}
                      >
                        Edit
                      </Button>

                      <Button size="small" color="error">
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
        width={"40vh"}
      ><AddMenu />
      </PopupModal>
    </Fragment>
  );
};

export default MenuList;
