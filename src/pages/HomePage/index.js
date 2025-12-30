import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "hooks/useAuth";

const HomePage = () => {
  const [{ data: auth }, { getUserInfoData }] = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (auth.details === null) {
      getUserInfoData();
      return;
    }

    if (auth?.details?.role === "Admin") {
      navigate("/dashboard", { replace: true });
    } else {
      navigate("/book-table", { replace: true });
    }
  }, [auth.details, navigate, getUserInfoData]);

  return null;
};

export default HomePage;
