import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  Grid,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";


const defaultForm = {
  hotel_id: "",
  category_id: "",
  menu_name: "",
  menu_code: "",
  description: "",
  price: "",
  preparation_time: "",
  is_veg: true,
  spice_level: "",
  calories: "",
  is_available: true,
  display_order: 1,
};

const MenuForm = ({
  initialValues = {},
  hotels = [],
  categories = [],
  spiceLevels = [],
  spiceLevelsLoading = false,
  loading = false,
  isEdit = false,
  onHotelChange,
  onSubmit,
}) => {
  const [form, setForm] = useState(defaultForm);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");

  useEffect(() => {
    setForm({
      ...defaultForm,
      ...(initialValues || {}),
    });
    setImage(null);
    setPreview(initialValues?.image_url || initialValues?.image || "");
  }, [initialValues]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (name === "hotel_id" && onHotelChange) {
      onHotelChange(value);
    }
  };

  const handleImage = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const payload = {
      hotel_id: Number(form.hotel_id),
      category_id: Number(form.category_id),
      menu_name: form.menu_name.trim(),
      price: Number(form.price),
      is_veg: Boolean(form.is_veg),
      is_available: Boolean(form.is_available),
      display_order: Number(form.display_order) || 0,
    };

    const optionalTextFields = ["menu_code", "description"];
    optionalTextFields.forEach((key) => {
      if (String(form[key] ?? "").trim()) {
        payload[key] = String(form[key]).trim();
      }
    });

    ["preparation_time", "calories", "spice_level"].forEach((key) => {
      if (String(form[key] ?? "").trim()) {
        payload[key] = Number(form[key]);
      }
    });

    onSubmit({ ...payload, imageFile: image });
  };

  return (
    <Grid
      container
      spacing={2}
      component="form"
      onSubmit={handleSubmit}
      className="menu-form"
    >
      <Grid item xs={12}>
        <Typography variant="h6" fontWeight={600}>
          {isEdit ? "Edit Menu" : "Add Menu"}
        </Typography>
      </Grid>

      {hotels.length > 0 && (
        <Grid item xs={12}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <TextField
                name="hotel_id"
                value={form.hotel_id}
                onChange={handleChange}
                label="Hotel"
                variant="outlined"
                fullWidth
                required
                select
                InputLabelProps={{ shrink: true }}
              >
                <MenuItem value="">Select Hotel</MenuItem>
                {hotels.map((hotel) => (
                  <MenuItem key={hotel.id} value={hotel.id}>
                    {hotel.hotel_name || hotel.name}
                  </MenuItem>
                ))}
              </TextField>
            </CardContent>
          </Card>
        </Grid>
      )}

      <Grid item xs={12}>
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <TextField
              name="category_id"
              value={form.category_id}
              onChange={handleChange}
              label="Category"
              variant="outlined"
              fullWidth
              required
              select
              InputLabelProps={{ shrink: true }}
            >
              <MenuItem value="">Select Category</MenuItem>
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.category_name}
                </MenuItem>
              ))}
            </TextField>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <TextField
              name="menu_name"
              value={form.menu_name}
              onChange={handleChange}
              label="Menu Name"
              variant="outlined"
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
            />
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <TextField
              name="menu_code"
              value={form.menu_code}
              onChange={handleChange}
              label="Menu Code"
              variant="outlined"
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <TextField
              name="description"
              value={form.description}
              onChange={handleChange}
              label="Description"
              variant="outlined"
              fullWidth
              multiline
              rows={4}
              InputLabelProps={{ shrink: true }}
            />
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6}>
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <TextField
              type="number"
              name="price"
              value={form.price}
              onChange={handleChange}
              label="Price"
              variant="outlined"
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
            />
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6}>
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <TextField
              type="number"
              name="preparation_time"
              value={form.preparation_time}
              onChange={handleChange}
              label="Preparation Time (Minutes)"
              variant="outlined"
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6}>
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <TextField
              type="number"
              name="calories"
              value={form.calories}
              onChange={handleChange}
              label="Calories"
              variant="outlined"
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6}>
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <TextField
              name="spice_level"
              value={form.spice_level}
              onChange={handleChange}
              label="Spice Level"
              variant="outlined"
              fullWidth
              select
              InputLabelProps={{ shrink: true }}
            >
              <MenuItem value="">Select Spice Level</MenuItem>
              {spiceLevelsLoading ? (
                <MenuItem value="" disabled>
                  Loading spice levels...
                </MenuItem>
              ) : spiceLevels.length === 0 ? (
                <MenuItem value="" disabled>
                  No spice levels available
                </MenuItem>
              ) : (
                spiceLevels.map((spiceLevel) => {
                  const id =
                    spiceLevel?.id ??
                    spiceLevel?.spice_level_id ??
                    spiceLevel?.value;
                  const name = String(
                    spiceLevel?.spice_level ??
                      spiceLevel?.name ??
                      "",
                  );
                  const label = name
                    .toLowerCase()
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (letter) => letter.toUpperCase());

                  return id !== undefined && id !== null ? (
                    <MenuItem key={id} value={String(id)}>
                      {label}
                    </MenuItem>
                  ) : null;
                })
              )}
            </TextField>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <TextField
              type="number"
              name="display_order"
              value={form.display_order}
              onChange={handleChange}
              label="Display Order"
              variant="outlined"
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card sx={{ mb: 2 }}>
          <CardContent className="menu-form-checks">
            <FormControlLabel
              control={
                <Checkbox
                  checked={form.is_veg}
                  onChange={handleChange}
                  name="is_veg"
                />
              }
              label="Veg"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={form.is_available}
                  onChange={handleChange}
                  name="is_available"
                />
              }
              label="Available"
            />
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card sx={{ mb: 2 }}>
          <CardContent className="menu-form-upload">
            <Button variant="outlined" component="label">
              Menu Image
              <input type="file" accept="image/*" hidden onChange={handleImage} />
            </Button>

            {preview && (
              <Box
                component="img"
                src={preview}
                alt="Preview"
                sx={{
                  display: "block",
                  width: 120,
                  mt: 1.25,
                  borderRadius: 1,
                }}
              />
            )}
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} className="menu-form-actions">
        <Button
          type="submit"
          variant="contained"
          disabled={loading}
          className="menu-form-submit"
        >
          {loading ? "Saving..." : isEdit ? "Update Menu" : "Create Menu"}
        </Button>
      </Grid>
    </Grid>
  );
};

export default MenuForm;
