
import React from "react";
import { Box, Typography, Button, Divider } from "@mui/material";

const OrderSummary = ({
  totalItems=0,
  totalAmount=0,
  onSkip,
  onPlaceOrder
}) => {
  return (
    <Box className="footer">
      <Box>
        <Typography variant="subtitle1">
          Total Items : {totalItems}
        </Typography>

        <Typography variant="h6" fontWeight={700}>
          Total : ₹{Number(totalAmount).toFixed(2)}
        </Typography>
      </Box>

      <Divider
        orientation="vertical"
        flexItem
        sx={{mx:2}}
      />

      <Box display="flex" gap={2}>
        <Button
          variant="outlined"
          color="inherit"
          onClick={onSkip}
        >
          Skip
        </Button>

        <Button
          variant="contained"
          onClick={onPlaceOrder}
        >
          Place Order
        </Button>
      </Box>
    </Box>
  );
};

export default OrderSummary;
