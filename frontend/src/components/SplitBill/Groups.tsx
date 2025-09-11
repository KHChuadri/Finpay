import useAuthStore from "@/stores/authStore";
import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import LeaveGroupModal from "./LeaveGroupModal";
import { API_URL } from "@/constants/API_URL";

export interface Props {
  _id: string;
  members: [];
  transactionHistory: [];
  admin: object;
  groupName: string;
  description: string;
}

export interface GroupList {
  onProcessed: () => void;
  list: Props[];
}

function Groups({ list, onProcessed }: GroupList) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const navigate = useNavigate();
  const userId = useAuthStore((state) => state.userId);
  const handleLeaveGroup = async (groupId: string) => {
    try {
      await axios.put(`${API_URL}/groups/leave`, null, {
        params: {
          groupId: groupId,
          userId: userId,
        },
      });
      onProcessed();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const msg =
          err.response?.data?.errorMsg ||
          "Something went wrong while fetching groups";
        setErrorMessage(msg || "Something went wrong while leaving groups");
      } else {
        setErrorMessage("Failed to leave groups");
      }
    }
  };

  const handleCloseLeaveModal = () => {
    setShowLeaveModal(false);
  };

  const handleConfirmLeaveModal = () => {
    handleLeaveGroup(selectedGroupId);
    setShowLeaveModal(false);
  };

  if (!list) {
    list = [];
  }
  return (
    <div className="flex flex-col bg-white rounded-2xl p-4 w-full justify-end  gap-4 shadow-2xl transition ease-in-out">
      {errorMessage && <p className="text-red-500">{errorMessage}</p>}
      {showLeaveModal && (
        <LeaveGroupModal
          onClose={() => handleCloseLeaveModal()}
          onConfirm={() => handleConfirmLeaveModal()}
        />
      )}
      <div
        id="list"
        className="h-[600px] w-full flex flex-col gap-4 px-4 py-6 rounded-2xl overflow-y-scroll"
      >
        {list.map((item, index) => (
          <div
            key={index}
            className="rounded-lg bg-white p-4 cursor-pointer hover:scale-99 ease-in-out duration-300 shadow-2xl justify-between"
          >
            <div className="flex flex-row justify-between">
              <div className="flex flex-col text-left space-y-2">
                <div className="justify-between flex flex-row">
                  <h2 className="text-lg font-bold">
                    Group Name: {item.groupName}
                  </h2>
                </div>
                <h2 className="text-sm">{item.description}</h2>
              </div>
              <div className="flex flex-row text-left space-y-2 gap-2">
                <button
                  className="w-fit h-fit px-8 py-3 bg-green-800 text-white text-sm rounded-lg hover:bg-[#A8321E] transition shadow-md"
                  onClick={() => navigate(`/groups/${item._id}`)}
                >
                  Open
                </button>
                <button
                  className="w-fit h-fit px-8 py-3 bg-[#C6412A] text-white text-sm rounded-lg hover:bg-[#A8321E] transition shadow-md"
                  onClick={() => {
                    setShowLeaveModal(true);
                    setSelectedGroupId(item._id.toString());
                  }}
                >
                  Leave
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="w-full px-4 pb-6 flex justify-start">
        <button
          className="w-fit px-8 py-3 bg-[#C6412A] text-white text-sm rounded-lg hover:bg-[#A8321E] transition shadow-md"
          onClick={() => navigate("/groups/list/create")}
        >
          Create New Group
        </button>
      </div>
    </div>
  );
}

export default Groups;
