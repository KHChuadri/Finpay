import Layout from "@/components/Layout";
import { useNavigate } from 'react-router-dom';
import AdminLoginForm from "./AdminLoginForm";
import { useEffect, useState } from "react";
import axios from "axios";
import useAuthStore from "@/stores/authStore";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { token, userId } = useAuthStore();

  const checkIfAlreadyLoggedInAdmin = async () => {
    // Only check if user is already logged in and has valid token/userId
    if (!token || !userId) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.get(`http://localhost:3000/isAdmin/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success && response.data.isAdmin) {
        // User is already logged in as admin, redirect to admin dashboard
        navigate('/admin');
      } else {
        // User is logged in but not admin, clear auth and stay on login page
        setIsLoading(false);
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.errorMsg || "An error occurred while checking admin status";
        setErrorMsg(msg);
      } else {
        setErrorMsg("An unexpected error occurred");
      }
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkIfAlreadyLoggedInAdmin();
  }, []);

  const headerButtons = (
    <div className="gap-4 md:flex items-center">
      <button
        onClick={() => navigate('/')}
        className="bg-[#C6412A] text-white px-6 py-2 rounded-lg hover:bg-[#A8321E] transition font-bold"
      >
        Back
      </button>
    </div>
  );

  // Show loading state while checking admin status
  if (isLoading) {
    return (
      <Layout headerRight={headerButtons}>
        <div className='flex w-full h-[75vh] justify-center items-center'>
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C6412A] mx-auto mb-4"></div>
            <p>Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout headerRight={headerButtons}>
      <div className='flex w-full h-[75vh] justify-center items-center'>
        {errorMsg && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {errorMsg}
          </div>
        )}
        <AdminLoginForm />
      </div>
    </Layout>
  );
};

export default AdminLogin;