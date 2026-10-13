import { Link } from "react-router-dom";
import { ArrowBackRounded } from "@mui/icons-material";

/** "← All settings": top of every Settings sub-page, back to the tiles. */
const SettingsBackLink = () => (
  <Link to="/settings" className="settings-back">
    <ArrowBackRounded fontSize="small" aria-hidden />
    All settings
  </Link>
);

export default SettingsBackLink;
