import { useNavigate } from "react-router-dom";
import axios from "axios";
import useAuthStore from "@/stores/authStore";
import useDarkModeStore from "@/stores/darkModeStore";

const LogoutButton = () => {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const userId = useAuthStore((state) => state.userId);
  const resetAuth = useAuthStore((state) => state.resetAuth);
  const setIsAuthenticated = useAuthStore((state) => state.setIsAuthenticated);
  const { darkMode, setDarkMode } = useDarkModeStore();

  const handleLogout = async () => {
    try {
      await axios.post("http://localhost:3000/logout", { token, userId });
      resetAuth();
      setIsAuthenticated(false);
      setDarkMode(false);
      navigate("/");
    } catch (error) {
      alert("An unexpected error occurred: " + error);
    }
  };

  return (
    <button
      onClick={handleLogout}
      data-testid="logout-button" 
      className={`${darkMode ?  "bg-gray-700 hover:bg-gray-900" : "bg-[#C6412A] hover:bg-[#A8321E]"} text-white px-6 py-2 rounded-lg  transition shadow-md cursor-pointer`}
    >
      Logout
    </button>
  );
};

export default LogoutButton;
