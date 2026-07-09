import { API_URL } from "@/constants/API_URL";
import axios from "axios";
import { TriangleAlert, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

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
    <div className="flex flex-col bg-card rounded-2xl p-4 w-full justify-end gap-4 shadow-2xl transition ease-in-out">
      {/* Error message */}
      {errorMsg && (
        <div className="flex items-center justify-between px-4 py-3 mb-4 bg-destructive/10 border-l-4 border-destructive rounded-r">
          <div className="flex items-center gap-2">
            <div className="flex-shrink-0">
              <TriangleAlert className="h-5 w-5 text-destructive" />
            </div>

            <p className="text-sm text-destructive">{errorMsg}</p>
          </div>

          <button
            onClick={() => setErrorMsg("")}
            className="text-destructive hover:text-destructive/80 ml-4"
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
            className="relative rounded-lg bg-card p-4 shadow-2xl"
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
                <Button
                  className="w-fit px-6 py-2 text-sm rounded-lg shadow-md"
                  onClick={() => handleInvitation(index, "accept")}>
                  Accept
                </Button>
                <Button
                  variant="destructive"
                  className="w-fit px-6 py-2 text-sm rounded-lg shadow-md"
                  onClick={() => handleInvitation(index, "reject")}>
                  Reject
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="w-full px-2 sm:px-4 pb-4 flex justify-start">
        <Button
          className="w-full sm:w-fit px-6 py-2 text-sm rounded-lg shadow-md"
          onClick={() => onProcessed}
        >
          Refresh
        </Button>
      </div>
    </div>
  );
}

export default Invites;
