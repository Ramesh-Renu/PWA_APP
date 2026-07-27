
import React from "react";
import {
  Card, CardContent, CardMedia, Typography,
  Chip, Box, IconButton
} from "@mui/material";
import { Add, Remove } from "@mui/icons-material";

const MenuCard = ({ menu, quantity=0, onIncrease, onDecrease }) => {
  return (
    <Card className="menu-card">
      <CardMedia
        component="img"
        height="170"
        image={menu.image || "/placeholder.png"}
        alt={menu.menu_name}
      />
      <CardContent>
        <Typography variant="h6" fontWeight={700}>
          {menu.menu_name}
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{mb:1}}>
          {menu.description}
        </Typography>

        <Box display="flex" gap={1} mb={1} flexWrap="wrap">
          <Chip
            size="small"
            color={menu.is_veg ? "success" : "error"}
            label={menu.is_veg ? "Veg" : "Non Veg"}
          />
          {menu.spiceLevel?.spice_level && (
            <Chip
              size="small"
              color="warning"
              label={menu.spiceLevel.spice_level}
            />
          )}
        </Box>

        <Typography variant="h6">
          ₹{menu.price}
        </Typography>

        <Box className="qty-box">
          <IconButton onClick={onDecrease}>
            <Remove/>
          </IconButton>

          <Typography fontWeight={700}>
            {quantity}
          </Typography>

          <IconButton onClick={onIncrease}>
            <Add/>
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  );
};

export default MenuCard;
