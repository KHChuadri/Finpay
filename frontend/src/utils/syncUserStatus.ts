import axios from "axios";
import useAuthStore from "@/stores/authStore";
import { API_URL } from "@/constants/API_URL";

export const syncUserStatus = async () => {
  const userId = useAuthStore.getState().userId;
  const token = useAuthStore.getState().token;

  if (!userId || !token) return;

  try {
    const response = await axios.get(`${API_URL}/user/profile/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const { isVerified, isLocked, profileImg } = response.data;
    useAuthStore.getState().setUserStatus(isVerified, isLocked);
    if (profileImg) {
      useAuthStore.getState().setProfileImg(profileImg);
    }
  } catch (err) {
    console.error("Failed to sync user status", err);
  }
};
