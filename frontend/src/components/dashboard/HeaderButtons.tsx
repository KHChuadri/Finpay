import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { FiMenu, FiX, FiAlertCircle } from "react-icons/fi";
import { CircleAlert, CircleCheck } from "lucide-react";

import ListGroup from "./ListGroup";
import FlyoutLink from "./FlyoutLink";
import { FaRegBell } from "react-icons/fa6";
import { VscBellDot } from "react-icons/vsc";
import useAuthStore from "@/stores/authStore";
import axios from "axios";
import useDarkModeStore from "@/stores/darkModeStore";
import { API_URL } from "@/constants/API_URL";

function HeaderButtons() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [newNotif, setNewNotif] = useState(false);
  const userId = useAuthStore((state) => state.userId);
  const isVerified = useAuthStore((state) => state.isVerified);
  const isLocked = useAuthStore((state) => state.isLocked);
  const profileImage = useAuthStore((state) => state.profileImg) || '/profile icon.png';
  const { darkMode } = useDarkModeStore();

  const navItemsAccount = [
    { Name: "Transaction History", Route: "/history" },
    { Name: "View Requests", Route: "/request/list" },
    { Name: "View Scheduled Payments", Route: "/view/scheduledPayments" }
  ];
  const navItemsTransfer = [
    { Name: "Send Money", Route: "/transfer/recipient" },
    { Name: "Currency Exchange", Route: "/conversion" },
  ];
  const navItemsFeatures = [
    { Name: "Challenges", Route: "/view/challenges" },
    { Name: "Shared Wallet", Route: "/groups" },
  ];

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  });

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
    <div className="flex items-center gap-2 md:gap-4">
      {/* Mobile Menu Button */}
      <button
        className="md:hidden p-2 rounded-lg hover:bg-[#f98674] transition duration-300 cursor-pointer"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {mobileMenuOpen ? <FiX size={28} /> : <FiMenu size={28} />}
      </button>

      {/* Desktop Menu */}
      <div className="hidden md:flex gap-2 md:gap-4">
        <FlyoutLink FlyoutContent={<ListGroup items={navItemsAccount} />}>
          <button data-testid="account-header-hover" className={`px-3 py-2 rounded-lg ${darkMode ? "hover:bg-gray-900 text-white" : "hover:bg-[#f98674]"} font-medium cursor-pointer text-sm md:text-base transition duration-300`}>
            Account
          </button>
        </FlyoutLink>

        <FlyoutLink FlyoutContent={<ListGroup items={navItemsTransfer} />}>
          <button className={`px-3 py-2 rounded-lg ${darkMode ? "hover:bg-gray-900 text-white" : "hover:bg-[#f98674]"} font-medium cursor-pointer text-sm md:text-base transition duration-300`}>
            Transfer
          </button>
        </FlyoutLink>

        <FlyoutLink FlyoutContent={<ListGroup items={navItemsFeatures} />}>
          <button data-testid="features-header-hover" className={`px-3 py-2 rounded-lg ${darkMode ? "hover:bg-gray-900 text-white" : "hover:bg-[#f98674]"} font-medium cursor-pointer text-sm md:text-base transition duration-300`}>
            Features
          </button>
        </FlyoutLink>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="absolute top-18 right-6 bg-[#F98674] shadow-xl rounded-lg px-4 py-2 z-50 md:">
          <div className="flex flex-col gap-2 items-center">
            <FlyoutLink FlyoutContent={<ListGroup items={navItemsAccount} />} mobile={true}>
              <button className="w-full px-4 py-2 rounded-lg hover:bg-[#E66A56] transition duration-300 cursor-pointer">
                Account
              </button>
            </FlyoutLink>
            <FlyoutLink FlyoutContent={<ListGroup items={navItemsTransfer} />} mobile={true}>
              <button className="w-full px-4 py-2 rounded-lg hover:bg-[#E66A56] transition duration-300 cursor-pointer">
                Transfer
              </button>
            </FlyoutLink>
            <FlyoutLink FlyoutContent={<ListGroup items={navItemsFeatures} />} mobile={true}>
              <button className="w-full px-4 py-2 rounded-lg hover:bg-[#E66A56] transition duration-300 cursor-pointer">
                Features
              </button>
            </FlyoutLink>
          </div>
        </div>
      )}

      {/* Visible Buttons */}
      <div className="flex items-center gap-4">
        <div className="relative group">
          <button
            onClick={() => navigate("/profile")}
            className="w-14 h-13 bg-gray-200 hover:bg-gray-300 rounded-full border-2 border-white shadow-xl overflow-hidden"
            data-testid="button-profile-icon"
          >
            <img
              src={profileImage || '/profile icon.png'}
              alt="Profile"
              className="w-full h-full object-cover rounded-full cursor-pointer"
            />
          </button>

          {/* Status indicator with tooltip */}
          <div className="absolute bottom-0 right-1 transform translate-x-1/3 shadow-xl">
            {isLocked ? (
              <div className="relative">
                <FiAlertCircle className="w-6 h-6 text-red-500 bg-white rounded-full" />
                <div className="absolute hidden group-hover:block bottom-full left-1/8 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap">
                  Account locked - Contact support
                </div>
              </div>
            ) : isVerified ? (
              <div className="relative">
                <CircleCheck className="w-6 h-6 text-green-500 bg-white rounded-full" />
                <div className="absolute hidden group-hover:block bottom-full -left-2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap">
                  Account verified
                </div>
              </div>
            ) : (
              <div className="relative">
                <CircleAlert className="w-6 h-6 text-yellow-500 bg-white rounded-full" />
                <div className="absolute hidden group-hover:block bottom-full -left-1 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap">
                  Verify your account
                </div>
              </div>
            )}
          </div>
        </div>

        <button
          className="flex flex-row size-12 rounded-full items-center justify-center"
          onClick={() => navigate('/notification')}>
          {newNotif === false && <FaRegBell className={`${darkMode ? 'text-white' : ''} w-3/4 h-3/4 object-cover rounded-full cursor-pointer`} />}
          {newNotif === true && <VscBellDot className={`${darkMode ? 'text-white' : ''} w-3/4 h-3/4 object-cover rounded-full cursor-pointer`} />}
        </button>
      </div>
    </div>
  );
}

export default HeaderButtons;