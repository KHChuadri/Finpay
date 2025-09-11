import { API_URL } from "@/constants/API_URL";
import axios from "axios";
import { TriangleAlert, X } from "lucide-react";
import { useState } from "react";

export interface InvitationProps {
  _id: string;
  groupName: string;
  senderName: string;
  sender: string;
  receiver: string;
}

export interface InvitationList {
  onProcessed: () => void;
  list: InvitationProps[];
}

function Invites({ list, onProcessed }: InvitationList) {
  const [errorMsg, setErrorMsg] = useState("");
  const handleInvitation = async (invitationIndex: number, mode: string) => {
    try {
      const response = await axios.put(`${API_URL}/invitation/process/${list[invitationIndex]._id.toString()}/${mode}`);

      onProcessed();
      return response.data;
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.errorMsg || 'An unexpected error occured during handling invitation';
        setErrorMsg(msg || 'An unexpected error occurred');
      } else {
        setErrorMsg('An unexpected error occurred');
      }
    }
  }

  if (!list) {
    list = [];
  }

  return (
    <div className="flex flex-col bg-white rounded-2xl p-4 w-full justify-end gap-4 shadow-2xl transition ease-in-out">
      {/* Error message */}
      {errorMsg && (
        <div className="flex items-center justify-between px-4 py-3 mb-4 bg-red-100 border-l-4 border-red-500 rounded-r">
          <div className="flex items-center gap-2">
            <div className="flex-shrink-0">
              <TriangleAlert className="h-5 w-5 text-red-500" />
            </div>

            <p className="text-sm text-red-700">{errorMsg}</p>
          </div>

          <button
            onClick={() => setErrorMsg("")}
            className="text-red-500 hover:text-red-700 ml-4"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      <div
        id="list"
        className="h-[600px] max-h-[70vh] w-full flex flex-col gap-4 px-2 sm:px-4 py-4 sm:py-6 rounded-2xl overflow-y-scroll"
      >
        {list.map((item, index) => (
          <div
            key={index}
            className="relative rounded-lg bg-white p-4 shadow-2xl"
          >
            <div className="flex flex-col text-left space-y-2">
              <div className="justify-between flex flex-row">
                <h2 className="text-lg font-bold">
                  Group Name: {item.groupName}
                </h2>
              </div>
              <h2 className="text-sm">
                {item.senderName} has sent you a group invitation
              </h2>
              <div className="flex flex-col sm:flex-row justify-end items-start sm:items-center gap-2 sm:gap-4 mt-4">
                <button
                  className="w-fit px-6 py-2 bg-green-800 text-white text-sm rounded-lg hover:bg-green-700 transition shadow-md"
                  onClick={() => handleInvitation(index, "accept")}>
                  Accept
                </button>
                <button className="w-fit px-6 py-2 bg-[#C6412A] text-white text-sm rounded-lg hover:bg-[#A8321E] transition shadow-md"
                  onClick={() => handleInvitation(index, "reject")}>
                  Reject
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="w-full px-2 sm:px-4 pb-4 flex justify-start">
        <button
          className="w-full sm:w-fit px-6 py-2 bg-[#C6412A] text-white text-sm rounded-lg hover:bg-[#A8321E] transition shadow-md"
          onClick={() => onProcessed}
        >
          Refresh
        </button>
      </div>
    </div>
  );
}

export default Invites;
