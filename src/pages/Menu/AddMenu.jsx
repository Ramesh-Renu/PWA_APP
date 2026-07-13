import React, { useState } from "react";
import MenuForm from "./component/MenuForm";
import { createMenu } from "services";

const AddMenu = () => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData) => {
    try {
      setLoading(true);

      const res = await createMenu(formData);

      if (res.success) {
        alert("Menu created successfully");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <MenuForm
      loading={loading}
      onSubmit={handleSubmit}
    />
  );
};

export default AddMenu;