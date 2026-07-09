import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import Layout from "../components/Layout";
import HeaderButtons from "@/components/dashboard/HeaderButtons";
import useAuthStore from "@/stores/authStore";
import Members, { type Props } from "@/components/SplitBill/Members";
import ManageMembers from "@/components/SplitBill/ManageMembers";
import type { InvitationProps } from "@/components/SplitBill/PendingInvites";
import PendingInvites from "@/components/SplitBill/PendingInvites";
import { useTransactionStore } from "@/stores/transactionStore";
import FlagGetter from "@/components/FlagGetter";
import { useGroupTransactionStore } from "@/stores/groupTransactionStore";
import { API_URL } from "@/constants/API_URL";
import { Button } from "@/components/ui/Button";
import { PageContainer } from "@/components/ui/PageContainer";

interface GroupInfo {
  _id: string;
  members: string[];
  transactionHistory: string[];
  admin: object;
  groupName: string;
  description: string;
  walletCurrency: string;
  walletBalance: number;
}

interface Currency {
  code: string; // e.g, 'AUD'
  countryCode: string; // e.g, 'AU'
  label: string; // e.g, 'Australian Dollar'
  flag: string;
  localeString: string; // e.g, 'en-AU'
}

const GroupPage = () => {
  const navigate = useNavigate();
  const token = useAuthStore.getState().token;
  const [group, setGroup] = useState<GroupInfo>();
  const {setGroupId, setCurrencyTo,  setTransactionType, setGroupName, setCurrencyFrom} = useGroupTransactionStore();
  const [invitation, setInvitation] = useState<InvitationProps[]>([]);
  const [member, setMember] = useState<Props[]>();
  const [activeTab, setActiveTab] = useState("member");
  const [currencyCode, setCurrencyCode] = useState("");
  const [currency, setCurrency] = useState<Currency>();
  const { groupId } = useParams();
  const [managingMember, setManagingMember] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const currencyList = useTransactionStore((c) => c.currencies);

  useEffect(() => {
    const fetchGroupInformation = async () => {
      try {
        if (!groupId) {
          setErrorMessage("No group id found");
          return;
        }

        const response = await axios.get(
          `${API_URL}/groups/${groupId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const GroupData = response.data as GroupInfo;
        setGroup({
          _id: groupId,
          members: GroupData.members.map((member) => member.toString()),
          transactionHistory: GroupData.transactionHistory.map((history) =>
            history.toString()
          ),
          admin: GroupData.admin,
          groupName: GroupData.groupName,
          description: GroupData.description,
          walletCurrency: GroupData.walletCurrency,
          walletBalance: GroupData.walletBalance,
        });
        setCurrencyCode(GroupData.walletCurrency);
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          const msg = error.response?.data?.errorMsg || "Something went wrong";
          setErrorMessage(msg);
          console.error("Fetching group data error:", msg);
        } else {
          setErrorMessage("An unexpected error occurred");
        }
      }
    };

    fetchGroupInformation();
    fetchMember();
    fetchPendingInvite();
  }, [groupId, token]);

  const fetchCountryData = () => {
    if (!currencyCode) return;
    const currency = currencyList.find(
      (curr) => curr.code.toLowerCase() === currencyCode.toLowerCase()
    );
    if (currency) setCurrency(currency);
  };

  const handleTopUp = () => {
    if (!currency || !group) return;
    setCurrencyTo(currency);
    setGroupId(group._id.toString());
    setTransactionType("TopUp");
    setGroupName(group.groupName);
    navigate(`/groups/topup/${group._id.toString()}/recipient`);
  }

  const handlePayment = () => {
    if (!currency || !group) return;
    setCurrencyFrom(currency);
    setGroupId(group._id.toString());
    setTransactionType("Withdraw");
    setGroupName(group.groupName);
    navigate(`/groups/withdraw/${group._id.toString()}/recipient`);
  }

  const fetchMember = async () => {
    try {
      const res = await axios.get(`${API_URL}/groups/member`, {
        params: { groupId },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = res.data;
      setMember(data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.errorMsg || "Something went wrong";
        setErrorMessage(msg);
        console.error("Fetching user profile error in dashboard:", msg);
      } else {
        setErrorMessage("An unexpected error occurred");
      }
    }
  };

  const fetchPendingInvite = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/groups/invitation/pending`,
        {
          params: { groupId },
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

  useEffect(() => {
    fetchCountryData();
  }, [group, currencyCode]);

  const onUpdate = async () => {
    await fetchMember();
    await fetchPendingInvite();
  };

  return (
    <Layout headerRight={<HeaderButtons />}>
      {errorMessage && (
        <p className="text-destructive text-center">{errorMessage}</p>
      )}

      <PageContainer className="grid grid-cols-1 md:grid-cols-2 gap-10 p-6 max-w-7xl">
        {/* Left Section: Group Info */}
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-foreground">
              {group?.groupName}
            </h2>
            <p className="text-muted-foreground">{group?.description}</p>
          </div>

          <div className="bg-card p-6 rounded-xl shadow-md space-y-4">
            <div className="flex items-center gap-3">
              {currency && (
                <FlagGetter countryCodes={currency.countryCode.toLowerCase()} />
              )}
              <h3 className="text-xl font-semibold text-foreground">
                {currency?.code} Balance
              </h3>
            </div>
            <h1 className="text-5xl sm:text-6xl font-extrabold text-foreground">
              {group?.walletBalance?.toLocaleString("en-AU", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </h1>

            <div className="flex flex-wrap gap-4 pt-2">
              <Button
                variant="primary"
                onClick={() => handleTopUp()}
                className="py-2 px-6 shadow-md"
              >
                Top Up Wallet
              </Button>
              <Button
                variant="primary"
                onClick={() => handlePayment()}
                className="py-2 px-6 shadow-md"
              >
                Make Payment
              </Button>
            </div>
          </div>

          <div className="bg-card p-6 rounded-xl shadow space-y-2">
            <h3 className="text-xl font-semibold">
              Shared wallet transactions history
            </h3>
            <p className="text-sm text-muted-foreground">
              View your transactions transfer and request history here
            </p>
            <Button
              variant="primary"
              onClick={() => navigate(`/groups/${groupId}/history`)}
              className="py-2 px-5 shadow"
            >
              View Transactions
            </Button>
          </div>
        </div>

        {/* Right Section: Member Management */}
        <div className="space-y-6">
          {/* Tabs */}
          <div className="flex justify-center">
            <div className="relative flex w-72 rounded-full bg-muted shadow overflow-hidden">
              <div
                className={`absolute top-0 bottom-0 w-1/2 bg-card rounded-full transition-all duration-300 ease-in-out ${
                  activeTab === "member" ? "left-0" : "left-1/2"
                }`}
              />
              <button
                onClick={() => {
                  setActiveTab("member");
                  fetchMember();
                }}
                className={`flex-1 z-10 py-2 font-semibold transition ${
                  activeTab === "member"
                    ? "text-primary"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                Members
              </button>
              <button
                onClick={() => {
                  setActiveTab("invites");
                  fetchPendingInvite();
                }}
                className={`flex-1 z-10 py-2 font-semibold transition ${
                  activeTab === "invites"
                    ? "text-primary"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                Invites
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="bg-card rounded-2xl p-6 shadow-md space-y-6 min-h-[300px]">
            {activeTab === "member" &&
              (managingMember ? (
                member && groupId ? (
                  <ManageMembers
                    list={member}
                    groupId={groupId}
                    onMemberUpdate={fetchMember}
                  />
                ) : (
                  <p>{errorMessage || "Loading..."}</p>
                )
              ) : member && groupId ? (
                <Members
                  list={member}
                  groupId={groupId}
                  onMemberUpdate={fetchMember}
                />
              ) : (
                <p>{errorMessage || "Loading..."}</p>
              ))}

            {activeTab === "invites" &&
              (invitation && groupId ? (
                <PendingInvites list={invitation} onProcessed={onUpdate} />
              ) : (
                <p>{errorMessage || "Loading..."}</p>
              ))}

            {/* Actions */}
            <div className="flex justify-between pt-4">
              <Button
                variant="primary"
                onClick={() => navigate(`/groups/${groupId}/invite`)}
                className="py-2 px-6 shadow"
              >
                Invite People
              </Button>
              <Button
                variant="primary"
                onClick={() => setManagingMember((prev) => !prev)}
                className="py-2 px-6 shadow"
              >
                {managingMember ? "Done" : "Remove Member"}
              </Button>
            </div>
          </div>
        </div>
      </PageContainer>
    </Layout>
  );
};

export default GroupPage;
