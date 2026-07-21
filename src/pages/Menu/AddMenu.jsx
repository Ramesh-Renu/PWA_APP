import React, { useEffect, useMemo, useState } from "react";
import { Alert } from "@mui/material";
import MenuForm from "./component/MenuForm";
import {
  createMenu,
  getAllSpiceLevels,
  updateMenu,
  uploadMenuImage,
} from "services";

const AddMenu = ({
  hotels = [],
  categories = [],
  hotelId,
  menu = null,
  onSaved,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [spiceLevels, setSpiceLevels] = useState([]);
  const [spiceLevelsLoading, setSpiceLevelsLoading] = useState(true);
  const initialValues = useMemo(
    () => {
      if (!menu) return { hotel_id: hotelId || "" };

      const spiceLevel =
        menu.spice_level_id ??
        (typeof menu.spice_level === "object"
          ? menu.spice_level?.id ?? menu.spice_level?.spice_level_id
          : menu.spice_level);

      return {
        ...menu,
        hotel_id: menu.hotel_id ?? menu.hotel?.id ?? hotelId ?? "",
        category_id:
          menu.category_id ??
          menu.menu_category_id ??
          menu.category?.id ??
          "",
        menu_name: menu.menu_name ?? menu.name ?? "",
        menu_code: menu.menu_code ?? "",
        description: menu.description ?? "",
        price: menu.price ?? "",
        preparation_time: menu.preparation_time ?? "",
        is_veg: menu.is_veg ?? true,
        spice_level: spiceLevel ?? "",
        calories: menu.calories ?? "",
        is_available: menu.is_available ?? true,
        display_order: menu.display_order ?? 1,
        image_url: menu.image_url ?? menu.image ?? "",
      };
    },
    [hotelId, menu],
  );

  const isEdit = Boolean(menu);

  useEffect(() => {
    let mounted = true;

    getAllSpiceLevels({ is_active: true })
      .then((response) => {
        if (!mounted) return;

        const data =
          response?.data?.items || response?.data?.rows || response?.data;
        setSpiceLevels(
          Array.isArray(data) ? data : Array.isArray(response) ? response : [],
        );
      })
      .catch(() => {
        if (mounted) setSpiceLevels([]);
      })
      .finally(() => {
        if (mounted) setSpiceLevelsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async ({ imageFile, ...menuData }) => {
    try {
      setLoading(true);
      setError("");

      if (imageFile) {
        const imageFormData = new FormData();
        imageFormData.append("image", imageFile);

        const uploadResponse = await uploadMenuImage(imageFormData);
        const uploadedImage =
          uploadResponse?.data?.url ||
          uploadResponse?.data?.image_url ||
          uploadResponse?.data?.imageUrl ||
          uploadResponse?.url ||
          uploadResponse?.image_url ||
          uploadResponse?.imageUrl;

        if (uploadedImage) {
          menuData.image = uploadedImage;
        }
      }

      const menuId = menu?.id ?? menu?.menu_id;
      const res = isEdit
        ? await updateMenu(menuId, menuData)
        : await createMenu(menuData);
      if (res?.success !== false) {
        onSaved?.();
      }
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          `Unable to ${isEdit ? "update" : "create"} menu. Please check the required fields and try again.`,
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
    <MenuForm
      initialValues={initialValues}
      hotels={hotels}
      categories={categories}
      spiceLevels={spiceLevels}
      spiceLevelsLoading={spiceLevelsLoading}
      loading={loading}
      isEdit={isEdit}
      onSubmit={handleSubmit}
    />
    </>
  );
};

export default AddMenu;
