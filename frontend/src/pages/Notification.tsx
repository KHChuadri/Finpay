import { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";
import HeaderButtons from "@/components/dashboard/HeaderButtons";
import useAuthStore from "@/stores/authStore";
import NotificationList, { type Props } from "@/components/NotificationList";
import { IoMdRefresh } from "react-icons/io";
import { API_URL } from "@/constants/API_URL";

const GroupPage = () => {
  const userId = useAuthStore.getState().userId;
  const token = useAuthStore.getState().token;
  const [notifications, setNofications] = useState<Props[]>([]);

  useEffect(() => {
    fetchNotification();
  }, [userId, token]);

  const fetchNotification = async () => {
    try {
      const res = await axios.get(`${API_URL}/notification/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = res.data;
      setNofications(data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.errorMsg || "Something went wrong";
        console.error("Fetching user profile error in dashboard:", msg);
      } else {
        console.error("An unexpected error occurred");
      }
    }
  };

  return (
    <Layout headerRight={<HeaderButtons />}>
      <div className="w-full flex flex-col justify-start items-center min-h-screen">
        <div className="relative flex flex-col bg-card rounded-2xl p-6 w-2/3 h-1/2 gap-6 shadow-2xl transition ease-in-out">

          <div className="flex w-full flex-row items-center min-h-max">
            <h2 className='font-semibold text-xl md:text-3xl w-max-content'>Notification List</h2>
            <IoMdRefresh
              size={40}
              onClick={() => fetchNotification()}
              className="absolute right-5 border-2 border-border rounded-full hover:bg-muted p-1 fill-primary "
            />
          </div>

          {notifications.length == 0 ? (
            <div className='flex-grow items-center justify-center'>
              <p className='text-md text-muted-foreground text-center'>There is no notification</p>
            </div>
          ) : (
            <NotificationList list={notifications} />
          )}

        </div>
      </div>
    </Layout>
  );
};

export default GroupPage;
