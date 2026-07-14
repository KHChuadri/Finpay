import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { FiAlertCircle } from "react-icons/fi";
import { CircleAlert, CircleCheck } from "lucide-react";

import { FaRegBell } from "react-icons/fa6";
import { VscBellDot } from "react-icons/vsc";
import useAuthStore from "@/stores/authStore";
import axios from "axios";
import { API_URL } from "@/constants/API_URL";
import { Button } from "@/components/ui/Button";

// ponytail: nav moved to sidebar
function HeaderButtons() {
  const navigate = useNavigate();
  const [newNotif, setNewNotif] = useState(false);
  const userId = useAuthStore((state) => state.userId);
  const isVerified = useAuthStore((state) => state.isVerified);
  const isLocked = useAuthStore((state) => state.isLocked);
  const profileImage = useAuthStore((state) => state.profileImg) || '/profile icon.png';

  useEffect(() => {
    if (!userId) return;
    const checkNewNotif = async (userId: string) => {
      try {
        const response = await axios.get(`${API_URL}/notification/new/${userId}`, {});
        if (response.data) {
          setNewNotif(true);
        } else {
          setNewNotif(false);
        }
      } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
          const msg = err.response?.data?.errorMsg || 'An unexpected error occured during checking notifications';
          console.error(msg);
        } else {
          console.error('An unexpected error occurred');
        }
      }
    }

    checkNewNotif(userId);
  }, []);

  return (
    <div className="flex items-center gap-3">
      <button
        className="flex size-9 items-center justify-center rounded-[10px] border border-border-strong bg-card2 hover:border-primary hover:text-primary"
        onClick={() => navigate('/notification')}>
        {newNotif === false && <FaRegBell className="h-4 w-4" />}
        {newNotif === true && <VscBellDot className="h-4 w-4" />}
      </button>

      <div className="relative group">
        <button
          onClick={() => navigate("/profile")}
          className="h-9 w-9 rounded-full border border-border-strong overflow-hidden"
          data-testid="button-profile-icon"
        >
          <img
            src={profileImage || '/profile icon.png'}
            alt="Profile"
            className="w-full h-full object-cover rounded-full cursor-pointer"
          />
        </button>

        {/* Status indicator with tooltip */}
        <div className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4">
          {isLocked ? (
            <div className="relative">
              <FiAlertCircle className="w-4 h-4 text-destructive bg-card rounded-full" />
              <div className="absolute hidden group-hover:block bottom-full left-1/8 transform -translate-x-1/2 mb-2 px-2 py-1 bg-card text-foreground text-xs rounded whitespace-nowrap border border-border">
                Account locked - Contact support
              </div>
            </div>
          ) : isVerified ? (
            <div className="relative">
              <CircleCheck className="w-4 h-4 text-primary bg-card rounded-full" />
              <div className="absolute hidden group-hover:block bottom-full -left-2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-card text-foreground text-xs rounded whitespace-nowrap border border-border">
                Account verified
              </div>
            </div>
          ) : (
            <div className="relative">
              <CircleAlert className="w-4 h-4 text-warning bg-card rounded-full" />
              <div className="absolute hidden group-hover:block bottom-full -left-1 transform -translate-x-1/2 mb-2 px-2 py-1 bg-card text-foreground text-xs rounded whitespace-nowrap border border-border">
                Verify your account
              </div>
            </div>
          )}
        </div>
      </div>

      <Button size="sm" onClick={() => navigate('/transfer/recipient')}>
        New transfer
      </Button>
    </div>
  );
}

export default HeaderButtons;
