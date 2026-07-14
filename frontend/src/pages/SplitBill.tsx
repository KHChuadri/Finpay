import { useNavigate } from "react-router-dom";

import Layout from "../components/Layout";
import HeaderButtons from "@/components/dashboard/HeaderButtons";
import { Button } from "@/components/ui/Button";
// import history from "../assets/mock_history.jpg";

const SplitBill = () => {
  const navigate = useNavigate();

  return (
    <Layout headerRight={<HeaderButtons />}>
      <div className="flex flex-col md:flex-row items-center w-full space-y-6 md:space-y-0 md:space-x-10 min-h-[400px] px-4 md:px-10 py-8 shrink-0 items-center justify-between gap-10">
        <div className="w-full flex flex-col justify-center space-y-6 items-center md:items-start text-center md:text-left max-w-xl">
          <div>
            <h2 data-testid="split-bill-header" className="text-3xl font-bold mb-2">
              Discover a new way of tracking shared transactions
            </h2>
            <p data-testid="split-bill-paragraph" className="text-base">
              FinPay’s split bill system allows users to create groups where
              members can seamlessly send requests and make transactions with
              one another, while keeping track of all activity in a shared
              transaction history.
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => navigate("/groups/list")}
            data-testid="create-group-button"
            className="w-fit px-8 py-3 text-sm shadow-md"
          >
            Create/Manage Group
          </Button>
        </div>
        <img
          src={'/request.jpg'}
          className="rounded-full bg-card w-[250px] h-[250px] object-contain"
        />
      </div>

      {/* History Preview */}
      <div className="flex flex-col w-full items-center py-10 bg-card border border-border">
        <h2 className="text-2xl font-bold mb-6 text-center">
          What does a shared transaction look like?
        </h2>
        <img
          src={'./mock_history.jpg'}
          className="w-[90%] md:w-[60%] rounded-xl shadow-2xl shadow-black"
        />
      </div>
    </Layout>
  );
};

export default SplitBill;
