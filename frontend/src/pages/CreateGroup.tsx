import axios from "axios";
import validator from "validator";
import { useNavigate } from "react-router-dom";
import useAuthStore from "@/stores/authStore";
import Layout from "../components/Layout";
import { useState, useMemo, useEffect } from "react";
import { FiSearch } from "react-icons/fi";
import ReactCountryFlag from "react-country-flag";
import { useTransactionStore } from "@/stores/transactionStore";
import Notice from "@/components/Notice";

const CreateGroup = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState<string | null>(null);
  const currencyList = useTransactionStore((c) => c.currencies);
  const navigate = useNavigate();
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const {userId, isVerified, isLocked} = useAuthStore();
  const [errorMsg, setErrorMsg] = useState("");
  const [valid, setValid] = useState(false);

  useEffect(() => {
  const isValid = validator.isAscii(groupName) && selectedCurrency !== null;
  setValid(isValid);
  }, [groupName, selectedCurrency]);

  const filteredCurrencies = useMemo(() => {
    return currencyList.filter(
      (currency) =>
        currency.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        currency.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        currency.countryCode.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, currencyList]);

  const handleCreate = async () => {
    try {
      const response = await axios.post(`http://localhost:3000/groups/create`, {
        groupName: groupName,
        description: description,
        userId: userId,
        currency: selectedCurrency,
      });

      navigate("/groups/list");
      return response.data;
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const msg =
          err.response?.data?.errorMsg ||
          "An unexpected error occured during group creation";
        setErrorMsg(msg || "An unexpected error occurred");
      } else {
        setErrorMsg("An unexpected error occurred");
      }
    }
  };

  return (
    <div className="flex flex-col w-full min-h-screen">
      <Layout>
        <div className="flex flex-col flex-grow items-center justify-center w-full min-h-full">
          <div className="w-1/2 lg:w-1/3 bg-white flex flex-col rounded-xl my-4">
            <div className="flex flex-col gap-10 rounded-lg p-10">
              <Notice />
              <div className="flex flex-col gap-5 h-1/2">
                {errorMsg && <p className="text-red-500">{errorMsg}</p>}
                <h2 className="text-black text-xl font-semibold">
                  Enter Group Name
                </h2>
                <input
                  type="groupName"
                  value={groupName}
                  onChange={(e) => {
                    setGroupName(e.target.value);
                  }}
                  className="border-b-2 border-gray-700 p-2 w-full focus:outline-none"
                  placeholder="Group Name"
                />
                <input
                  type="Description"
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                  }}
                  className="border-b-2 border-gray-700 p-2 w-full focus:outline-none"
                  placeholder="Description"
                />
                <div className="p-6">
                  <div className="relative">
                    <div className="absolute flex items-center inset-y-0 left-0 pl-3 pointer-events-none">
                      <FiSearch className="text-gray-500" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search currencies..."
                      className="w-full pl-10 pr-4 py-3 border border-gray-400 rounded-lg focus:ring-2 focus:ring-[#C6412A] focus:border-[#C6412A] outline-none transition-all"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                  {filteredCurrencies.length === 0 ? (
                    <div className="p-6 text-center text-gray-600">
                      No currencies found
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-200">
                      {filteredCurrencies.map((currency) => (
                        <li key={currency.code}>
                          <button
                            onClick={() => setSelectedCurrency(currency.code)}
                            className={`flex items-center w-full px-6 py-4 hover:bg-gray-100 transition-colors cursor-pointer ${
                              selectedCurrency === currency.code
                                ? "bg-red-100"
                                : ""
                            }`}
                          >
                            <ReactCountryFlag
                              countryCode={currency.countryCode}
                              svg
                              style={{
                                width: "2em",
                                height: "1.5em",
                                marginRight: "1em",
                                borderRadius: "2px",
                                boxShadow: "0 0 0 1px rgba(0,0,0,0.1)",
                              }}
                            />
                            <div className="text-left">
                              <p className="font-medium text-gray-900">
                                {currency.label}
                              </p>
                              <p className="text-sm text-gray-500">
                                {currency.code}
                              </p>
                            </div>
                            {selectedCurrency === currency.code && (
                              <div className="ml-auto w-5 h-5 rounded-full bg-[#C6412A] flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full bg-white"></div>
                              </div>
                            )}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <button
                disabled={!valid || isLocked || !isVerified}
                onClick={() => handleCreate()}
                className={`w-full py-3 text-white font-bold rounded-xl transition ${
                  (valid && !isLocked && isVerified)
                    ? "bg-[#C6412A] hover:bg-[#A8321E] cursor-pointer"
                    : "bg-gray-400 cursor-not-allowed"
                }`}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      </Layout>
    </div>
  );
};

export default CreateGroup;
