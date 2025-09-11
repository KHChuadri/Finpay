import axios from "axios";
import crossSymbol from "../../assets/cross.png.png";
import { useState } from "react";
import useAuthStore from "@/stores/authStore";
import { TriangleAlert, X } from "lucide-react";

export interface Props {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface MemberList {
  onMemberUpdate: () => void;
  groupId: string;
  list: Props[];
}

function ManageMembers({ list, groupId, onMemberUpdate }: MemberList) {
  const userId = useAuthStore((state) => state.userId);
  const [errorMsg, setErrorMsg] = useState("");
  const handleRemove = async (recipientIndex: number) => {
    try {
      const recipient = list[recipientIndex].id;
      const response = await axios.put(
        `http://localhost:3000/groups/remove/${groupId}/${recipient}/${userId}`
      );
      onMemberUpdate();
      return response.data;
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.errorMsg || 'An unexpected error occured during handling member removal';
        setErrorMsg(msg || 'An unexpected error occurred');
      } else {
        setErrorMsg('An unexpected error occurred');
      }
    }
  };

  return (
    <div
      id="list"
      className="h-[600px] w-full flex flex-col gap-4 px-4 py-6 rounded-2xl overflow-y-scroll"
    >
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
      {list.map((item, index) => (
        <div
          key={index}
          className="relative rounded-lg bg-white p-4 shadow-2xl"
        >

          {/* Error message */}

          <div className="flex flex-col text-left space-y-2">
            <div className="justify-between flex flex-row">
              <h2 className="text-lg font-bold">Member Name: {item.name}</h2>
            </div>
            <h2 className="text-sm text-gray-600">{item.role}</h2>
            <h2 className="text-sm">{item.email}</h2>
          </div>
          <button
            className="absolute top-1/2 right-4 -translate-y-1/2 cursor-pointer hover:scale-95 transition duration-300"
            onClick={() => handleRemove(index)}
          >
            <img src={crossSymbol} className="size-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

export default ManageMembers;
