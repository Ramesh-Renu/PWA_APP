import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";

import { getAllHotel } from "services";
import {
  createMenuCategory,
  deleteMenuCategory,
  getAllMenuCategories,
  updateMenuCategory,
} from "services";

const emptyForm = {
  hotel_id: 0,
  category_name: "",
  description: "",
  display_order: 0,
  is_active: true,
};

const unwrapList = (response) => {
  let value = response?.data ?? response;

  if (value?.data !== undefined) value = value.data;
  if (value?.items !== undefined) value = value.items;

  return Array.isArray(value) ? value : [];
};

const categoryId = (category) =>
  category?.id ?? category?.menu_category_id ?? category?.category_id;

const hotelName = (category, hotels) => {
  if (Number(category?.hotel_id) === 0) return "All hotels";

  const hotel = hotels.find(
    (item) => String(item?.id ?? item?.hotel_id) === String(category?.hotel_id),
  );

  return hotel?.hotel_name ?? hotel?.name ?? category?.hotel_name ?? "—";
};

const isActive = (value) =>
  value === true || value === 1 || value === "1" || value === "true";

const MenuCategories = () => {
  const [categories, setCategories] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getAllMenuCategories();
      setCategories(unwrapList(response));
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          "Unable to load menu categories. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();

    getAllHotel()
      .then((response) => setHotels(unwrapList(response)))
      .catch(() => setHotels([]));
  }, [loadCategories]);

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase();

    return [...categories]
      .filter((category) => {
        const matchesSearch = !query ||
          [category?.category_name, category?.description, category?.hotel_name]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(query));
        const active = isActive(category?.is_active);
        const matchesStatus =
          statusFilter === "all" || (statusFilter === "active" ? active : !active);

        return matchesSearch && matchesStatus;
      })
      .sort((first, second) =>
        Number(first?.display_order ?? 0) - Number(second?.display_order ?? 0),
      );
  }, [categories, search, statusFilter]);

  const openCreateDialog = () => {
    setEditingCategory(null);
    setForm(emptyForm);
    setError("");
    setDialogOpen(true);
  };

  const openEditDialog = (category) => {
    setEditingCategory(category);
    setForm({
      hotel_id: category?.hotel_id ?? 0,
      category_name: category?.category_name ?? "",
      description: category?.description ?? "",
      display_order: category?.display_order ?? 0,
      is_active: isActive(category?.is_active),
    });
    setError("");
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (!saving) setDialogOpen(false);
  };

  const handleChange = ({ target }) => {
    const value = target.name === "is_active"
      ? target.value === "true"
      : target.value;

    setForm((current) => ({ ...current, [target.name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const body = {
      hotel_id: Number(form.hotel_id) || 0,
      category_name: form.category_name.trim(),
      description: form.description.trim(),
      display_order: Number(form.display_order) || 0,
      is_active: Boolean(form.is_active),
    };

    if (!body.category_name) return;

    setSaving(true);
    setError("");

    try {
      if (editingCategory) {
        await updateMenuCategory(categoryId(editingCategory), body);
        setNotice("Menu category updated successfully.");
      } else {
        await createMenuCategory(body);
        setNotice("Menu category created successfully.");
      }

      setDialogOpen(false);
      await loadCategories();
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          "Unable to save this menu category. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    setError("");

    try {
      await deleteMenuCategory(categoryId(deleteTarget));
      setDeleteTarget(null);
      setNotice("Menu category deleted successfully.");
      await loadCategories();
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          "Unable to delete this menu category. Please try again.",
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 1440, mx: "auto", py: { xs: 1, md: 2 } }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        spacing={2}
        sx={{ mb: 2.5 }}
      >
        <Box>
          <Typography variant="h5" sx={{ color: "#252941", fontWeight: 800 }}>
            Menu Categories
          </Typography>
          <Typography variant="body2" sx={{ color: "#6f7389", mt: 0.5 }}>
            Create and organize the categories used by your menu.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={openCreateDialog}
          sx={{ alignSelf: { xs: "stretch", sm: "auto" }, textTransform: "none", fontWeight: 700 }}
        >
          Add category
        </Button>
      </Stack>

      {error && !dialogOpen && (
        <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {notice && (
        <Alert severity="success" onClose={() => setNotice("")} sx={{ mb: 2 }}>
          {notice}
        </Alert>
      )}

      <Paper sx={{ mb: 2, border: "1px solid #e4e7ef", borderRadius: 2, boxShadow: "none" }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems={{ xs: "stretch", md: "center" }}
          sx={{ p: 2 }}
        >
          <TextField
            fullWidth
            size="small"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search categories"
            InputProps={{ startAdornment: <SearchRoundedIcon sx={{ mr: 1, color: "text.secondary" }} /> }}
          />
          <ToggleButtonGroup
            exclusive
            value={statusFilter}
            onChange={(_, value) => value && setStatusFilter(value)}
            size="small"
            sx={{ flexShrink: 0 }}
          >
            <ToggleButton value="all" sx={{ textTransform: "none", px: 2 }}>All</ToggleButton>
            <ToggleButton value="active" sx={{ textTransform: "none", px: 2 }}>Active</ToggleButton>
            <ToggleButton value="inactive" sx={{ textTransform: "none", px: 2 }}>Inactive</ToggleButton>
          </ToggleButtonGroup>
        </Stack>
      </Paper>

      <TableContainer component={Paper} sx={{ border: "1px solid #e4e7ef", borderRadius: 2, boxShadow: "none" }}>
        <Table sx={{ minWidth: 700 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: "#f7fbfa" }}>
              <TableCell sx={{ fontWeight: 800, color: "#646a80" }}>Category name</TableCell>
              <TableCell sx={{ fontWeight: 800, color: "#646a80" }}>Description</TableCell>
              <TableCell sx={{ fontWeight: 800, color: "#646a80" }}>Hotel</TableCell>
              <TableCell align="center" sx={{ fontWeight: 800, color: "#646a80" }}>Order</TableCell>
              <TableCell sx={{ fontWeight: 800, color: "#646a80" }}>Status</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800, color: "#646a80" }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 7 }}>
                  <CircularProgress size={28} />
                  <Typography variant="body2" sx={{ mt: 1, color: "text.secondary" }}>Loading categories…</Typography>
                </TableCell>
              </TableRow>
            ) : filteredCategories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 7 }}>
                  <Typography sx={{ fontWeight: 700 }}>No menu categories found</Typography>
                  <Typography variant="body2" sx={{ mt: 0.5, color: "text.secondary" }}>
                    Add a category or adjust your search filters.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredCategories.map((category) => {
                const active = isActive(category?.is_active);

                return (
                  <TableRow key={categoryId(category)} hover>
                    <TableCell sx={{ fontWeight: 700 }}>{category?.category_name || "—"}</TableCell>
                    <TableCell sx={{ maxWidth: 360, color: "text.secondary" }}>{category?.description || "—"}</TableCell>
                    <TableCell>{hotelName(category, hotels)}</TableCell>
                    <TableCell align="center">{category?.display_order ?? 0}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={active ? "Active" : "Inactive"}
                        color={active ? "success" : "default"}
                        variant={active ? "filled" : "outlined"}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit">
                        <IconButton aria-label={`Edit ${category?.category_name}`} onClick={() => openEditDialog(category)} size="small">
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton aria-label={`Delete ${category?.category_name}`} onClick={() => setDeleteTarget(category)} size="small" color="error">
                          <DeleteOutlineRoundedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="sm">
        <Box component="form" onSubmit={handleSubmit}>
          <DialogTitle sx={{ fontWeight: 800 }}>
            {editingCategory ? "Edit menu category" : "Add menu category"}
          </DialogTitle>
          <DialogContent dividers>
            {error && dialogOpen && (
              <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <Stack spacing={2.25} sx={{ pt: 0.5 }}>
              <TextField
                autoFocus
                required
                fullWidth
                name="category_name"
                label="Category name"
                value={form.category_name}
                onChange={handleChange}
              />
              <TextField
                fullWidth
                multiline
                minRows={3}
                name="description"
                label="Description"
                value={form.description}
                onChange={handleChange}
              />
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <FormControl fullWidth>
                  <InputLabel id="menu-category-hotel-label">Hotel</InputLabel>
                  <Select
                    labelId="menu-category-hotel-label"
                    name="hotel_id"
                    label="Hotel"
                    value={String(form.hotel_id)}
                    onChange={handleChange}
                  >
                    <MenuItem value="0">All hotels</MenuItem>
                    {hotels.map((hotel) => {
                      const id = hotel?.id ?? hotel?.hotel_id;
                      return <MenuItem key={id} value={String(id)}>{hotel?.hotel_name ?? hotel?.name}</MenuItem>;
                    })}
                  </Select>
                </FormControl>
                <TextField
                  fullWidth
                  type="number"
                  name="display_order"
                  label="Display order"
                  value={form.display_order}
                  onChange={handleChange}
                  inputProps={{ min: 0 }}
                />
              </Stack>
              <TextField
                select
                fullWidth
                name="is_active"
                label="Status"
                value={String(form.is_active)}
                onChange={handleChange}
              >
                <MenuItem value="true">Active</MenuItem>
                <MenuItem value="false">Inactive</MenuItem>
              </TextField>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={closeDialog} disabled={saving} sx={{ textTransform: "none" }}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving || !form.category_name.trim()} sx={{ textTransform: "none", fontWeight: 700 }}>
              {saving ? "Saving…" : editingCategory ? "Save changes" : "Create category"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onClose={() => !deleting && setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Delete menu category?</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            This will remove “{deleteTarget?.category_name}” from the menu categories.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting} sx={{ textTransform: "none" }}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained" disabled={deleting} sx={{ textTransform: "none", fontWeight: 700 }}>
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MenuCategories;
