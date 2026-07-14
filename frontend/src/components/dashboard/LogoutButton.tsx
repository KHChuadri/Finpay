import { useNavigate } from "react-router-dom";
import axios from "axios";
import useAuthStore from "@/stores/authStore";
import useDarkModeStore from "@/stores/darkModeStore";
import { API_URL } from "@/constants/API_URL";
import { Button } from "@/components/ui/Button";

const LogoutButton = () => {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const userId = useAuthStore((state) => state.userId);
  const resetAuth = useAuthStore((state) => state.resetAuth);
  const setIsAuthenticated = useAuthStore((state) => state.setIsAuthenticated);
  const { setDarkMode } = useDarkModeStore();

  const handleLogout = async () => {
    try {
      await axios.post(`${API_URL}/logout`, { token, userId });
      resetAuth();
      setIsAuthenticated(false);
      setDarkMode(false);
      navigate("/");
    } catch (error) {
      alert("An unexpected error occurred: " + error);
    }
  };

  return (
    <Button
      variant="destructive"
      onClick={handleLogout}
      data-testid="logout-button"
      className="px-6 py-2 shadow-md"
    >
      Logout
    </Button>
  );
};

export default LogoutButton;
