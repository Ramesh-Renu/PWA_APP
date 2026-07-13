import React, { useEffect, useState } from "react";

const defaultForm = {
  hotel_id: "",
  category_id: "",
  menu_name: "",
  menu_code: "",
  description: "",
  price: "",
  preparation_time: "",
  is_veg: true,
  spice_level: "Medium",
  calories: "",
  is_available: true,
  display_order: 1,
};

const MenuForm = ({
  initialValues = {},
  hotels = [],
  categories = [],
  loading = false,
  isEdit = false,
  onHotelChange,
  onSubmit,
}) => {
  const [form, setForm] = useState(defaultForm);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");

  useEffect(() => {
    if (initialValues && Object.keys(initialValues).length > 0) {
      setForm({
        ...defaultForm,
        ...initialValues,
      });

      if (initialValues.image_url) {
        setPreview(initialValues.image_url);
      }
    }
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

    const formData = new FormData();

    Object.entries(form).forEach(([key, value]) => {
      formData.append(key, value);
    });

    if (image) {
      formData.append("image", image);
    }

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>{isEdit ? "Edit Menu" : "Add Menu"}</h2>
      <div>
        <label>Category</label>
        <select
          name="category_id"
          value={form.category_id}
          onChange={handleChange}
          required
        >
          <option value="">Select Category</option>

          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.category_name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label>Menu Name</label>

        <input
          name="menu_name"
          value={form.menu_name}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <label>Menu Code</label>

        <input
          name="menu_code"
          value={form.menu_code}
          onChange={handleChange}
        />
      </div>

      <div>
        <label>Description</label>

        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
        />
      </div>

      <div>
        <label>Price</label>

        <input
          type="number"
          name="price"
          value={form.price}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <label>Preparation Time (Minutes)</label>

        <input
          type="number"
          name="preparation_time"
          value={form.preparation_time}
          onChange={handleChange}
        />
      </div>

      <div>
        <label>Calories</label>

        <input
          type="number"
          name="calories"
          value={form.calories}
          onChange={handleChange}
        />
      </div>

      <div>
        <label>Spice Level</label>

        <select
          name="spice_level"
          value={form.spice_level}
          onChange={handleChange}
        >
          <option>Mild</option>
          <option>Medium</option>
          <option>Hot</option>
        </select>
      </div>

      <div>
        <label>Display Order</label>

        <input
          type="number"
          name="display_order"
          value={form.display_order}
          onChange={handleChange}
        />
      </div>

      <div>
        <label>
          <input
            type="checkbox"
            name="is_veg"
            checked={form.is_veg}
            onChange={handleChange}
          />
          Veg
        </label>
      </div>

      <div>
        <label>
          <input
            type="checkbox"
            name="is_available"
            checked={form.is_available}
            onChange={handleChange}
          />
          Available
        </label>
      </div>

      <div>
        <label>Menu Image</label>

        <input
          type="file"
          accept="image/*"
          onChange={handleImage}
        />

        {preview && (
          <img
            src={preview}
            alt="Preview"
            width={120}
            style={{
              marginTop: 10,
              borderRadius: 8,
            }}
          />
        )}
      </div>

      <br />

      <button
        type="submit"
        disabled={loading}
      >
        {loading
          ? "Saving..."
          : isEdit
          ? "Update Menu"
          : "Create Menu"}
      </button>
    </form>
  );
};

export default MenuForm;