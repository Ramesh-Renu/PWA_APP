import React, { useMemo, useState } from "react";
import { Box, Chip, Grid, TextField, Typography } from "@mui/material";
import MenuCard from "./MenuCard";
import OrderSummary from "./OrderSummary";

export default function MenuOrderPopup({
  menus = [],
  categories = [],
  onPlaceOrder,
  onSkip,
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [qty, setQty] = useState({});

  const filtered = useMemo(
    () =>
      menus.filter((m) => {
        const bySearch = m.menu_name
          .toLowerCase()
          .includes(search.toLowerCase());
        const byCat =
          category === "All" || m.category?.category_name === category;
        return bySearch && byCat;
      }),
    [menus, search, category],
  );

  const change = (id, diff) => {
    setQty((p) => {
      const next = Math.max((p[id] || 0) + diff, 0);
      return { ...p, [id]: next };
    });
  };

  const total = menus.reduce(
    (t, m) => t + (qty[m.id] || 0) * Number(m.price),
    0,
  );
//   const items = Object.entries(qty)
//     .filter(([, q]) => q > 0)
//     .map(([id, q]) => ({ menu_id: Number(id), quantity: q }));

const items = menus
  .filter((menu) => (qty[menu.id] || 0) > 0)
  .map((menu) => ({
    menu_id: menu.id,
    menu_name: menu.menu_name,
    quantity: qty[menu.id],
    unit_price: Number(menu.price),
    total_price: qty[menu.id] * Number(menu.price),
  }));
  
  return (
    <Box className="menu-order-popup">
      <Typography variant="h5" mb={2}>
        Order Menu
      </Typography>

      <TextField
        fullWidth
        placeholder="Search menu..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <Box className="category-bar">
        <Chip
          label="All"
          color={category === "All" ? "primary" : "default"}
          onClick={() => setCategory("All")}
        />
        {categories.map((c) => (
          <Chip
            key={c.id}
            label={c.category_name}
            color={category === c.category_name ? "primary" : "default"}
            onClick={() => setCategory(c.category_name)}
          />
        ))}
      </Box>

      <Grid container spacing={2}>
        {filtered.map((menu) => (
          <Grid item xs={12} sm={6} md={4} key={menu.id}>
            <MenuCard
              menu={menu}
              quantity={qty[menu.id] || 0}
              onIncrease={() => change(menu.id, 1)}
              onDecrease={() => change(menu.id, -1)}
            />
          </Grid>
        ))}
      </Grid>
      <OrderSummary
        totalItems={items.length}
        totalAmount={total}
        onSkip={onSkip}
        onPlaceOrder={() => onPlaceOrder(items)}
      />
    </Box>
  );
}
