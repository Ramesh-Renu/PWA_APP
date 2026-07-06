import { IconButton, Tooltip } from "@mui/material";
import { Brightness4, Brightness7 } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { useColorMode } from "theme/ThemeProvider";

const ThemeToggle = () => {
  const theme = useTheme();
  const { toggleColorMode } = useColorMode();

  return (
    <Tooltip title={`Switch to ${theme.palette.mode === "dark" ? "light" : "dark"} mode`}>
      <IconButton onClick={toggleColorMode} color="inherit" size="large">
        {theme.palette.mode === "dark" ? <Brightness7 /> : <Brightness4 />}
      </IconButton>
    </Tooltip>
  );
};

export default ThemeToggle;
