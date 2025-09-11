import Layout from "../components/Layout";
import HeaderButtons from "@/components/dashboard/HeaderButtons";
import Groups, { type Props } from "@/components/SplitBill/Groups";
import type { InvitationProps } from "@/components/SplitBill/Invites";
import Invites from "@/components/SplitBill/Invites";
import useAuthStore from "@/stores/authStore";
import axios from "axios";
import { useEffect, useState } from "react";

const ManageGroup = () => {
  const userId = useAuthStore.getState().userId;
  const [group, setGroup] = useState<Props[]>();
  const [invitation, setInvitation] = useState<InvitationProps[]>();
  const [activeTab, setActiveTab] = useState("group");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!userId) return;

  useEffect(() => {
    if (!userId) return;

    fetchGroupList(userId);
    fetchInviteList(userId);
  }, []);

  const fetchGroupList = async (userId: string) => {
    try {
      const response = await axios.get("http://localhost:3000/groups/batch", {
        params: { userId },
      });
      const GroupList = response.data;
      setGroup(GroupList);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const msg =
          err.response?.data?.errorMsg ||
          "Something went wrong while fetching groups";
        setErrorMessage(msg || "Something went wrong while fetching groups");
      } else {
        setErrorMessage("Failed to load groups");
      }
    }
  };

  const fetchInviteList = async (userId: string) => {
    try {
      const response = await axios.get(
        "http://localhost:3000/invitation/batch",
        {
          params: { userId },
        }
      );
      const InvitationList = response.data;
      setInvitation(InvitationList);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const msg =
          err.response?.data?.errorMsg ||
          "Something went wrong while fetching groups";
        setErrorMessage(msg || "Something went wrong while fetching groups");
      } else {
        setErrorMessage("Failed to load groups");
      }
    }
  };

  const onUpdate = async () => {
    await fetchGroupList(userId);
    await fetchInviteList(userId);
  };
  return (
    <Layout headerRight={<HeaderButtons />}>
      <div className="flex flex-col w-full items-center pt-10 mb-5">
        <div className="md:w-1/2 w-4/5">
          <div className="relative flex mb-4 rounded-full bg-gray-100 shadow-md border border-gray-200 overflow-hidden">
            {/* Slider */}
            <div
              className={`absolute top-0 bottom-0 w-1/2 bg-white rounded-full transition-all duration-300 ease-in-out ${
                activeTab === "group" ? "left-0" : "left-1/2"
              }`}
            />

            {/* Send Money Button */}
            <button
              onClick={() => {
                setActiveTab("group");
              }}
              className={`flex-1 z-10 py-3 px-4 font-semibold rounded-full transition-colors duration-200 ${
                activeTab === "group"
                  ? "text-[#C6412A] font-semibold"
                  : "text-gray-600 hover:bg-gray-200"
              }`}
            >
              Groups
            </button>

            {/* Request Money Button */}
            <button
              onClick={() => {
                setActiveTab("invites");
              }}
              className={`flex-1 z-10 py-3 px-4 font-semibold rounded-full transition-colors duration-200 ${
                activeTab === "invites"
                  ? "text-[#C6412A] font-semibold"
                  : "text-gray-600 hover:bg-gray-200"
              }`}
            >
              Invites
            </button>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg">
            {activeTab === "group" &&
              (group ? (
                <Groups list={group} onProcessed={onUpdate} />
              ) : errorMessage ? (
                <p>{errorMessage}</p>
              ) : (
                <p>Loading...</p>
              ))}
            {activeTab === "invites" &&
              (invitation ? (
                <Invites list={invitation} onProcessed={onUpdate} />
              ) : errorMessage ? (
                <p>{errorMessage}</p>
              ) : (
                <p>Loading...</p>
              ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ManageGroup;
