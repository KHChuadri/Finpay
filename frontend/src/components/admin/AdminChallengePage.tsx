import { useState } from "react";
import axios from "axios";
import ErrorModal from "./ErrorModal";
import SuccessModal from "./SuccessModal";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { API_URL } from "@/constants/API_URL";

// Previously was passed into AdminChallengePage as a prop
// interface AdminChallengePageProp {
//   activeTab: string | null;
// }

const categories = [
  "Pay",
  "Receive",
  "Save"
]

const AdminChallengePage = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [exp, setExp] = useState('');
  const [amountToGoal, setAmountToGoal] = useState('');
  const [error, setError] = useState<string | null>('');
  const [success, setSuccess] = useState<string | null>('');
  const [category, setCategory] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await axios.post(`${API_URL}/admin/createChallenge`, {
        category, title, description, startDate, endDate, exp, amountToGoal
      });

      if (response.data.success) {
        setSuccess('Challenge created!');
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.errorMsg || 'An unexpected error occured during challenge creation';
        setError(msg || 'An unexpected error occurred');
      } else {
        setError('An unexpected error occurred');
      }
    }
  }

  return (
    <div className="z-0 flex w-full items-start justify-center mt-6 px-4 mb-6">
      <form className="rounded-xl bg-card flex flex-col shadow-xl border p-10 w-full sm:w-[90%] md:w-[70%] gap-4" onSubmit={(e) => handleSubmit(e)}>
        <h1 className="text-2xl font-bold mb-5 ">Create challenge</h1>
        {/* Category */}
        <div className="flex flex-col md:flex-row w-full items-start md:items-center gap-2">
          <label htmlFor="category" className="md:w-1/3 font-medium">Category:*</label>
          <div className="w-full md:w-2/3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  id="category"
                  type="button"
                  className="w-full rounded-md border border-input bg-muted px-3 py-2 text-sm text-left text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
                >
                  {category || "Select Category"}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-full mt-1 rounded-md border border-border bg-card shadow-md"
                align="start"
              >
                <DropdownMenuLabel className="px-3 py-2 text-sm text-muted-foreground">
                  Choose a category
                </DropdownMenuLabel>
                {categories.map((category) => (
                  <DropdownMenuItem
                    key={category}
                    onClick={() => setCategory(category.toLowerCase())}
                    className="px-3 py-2 text-sm text-foreground hover:bg-muted cursor-pointer"
                  >
                    {category}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {/* Title */}
        <div className="flex flex-col md:flex-row w-full items-start md:items-center gap-2">
          <label htmlFor="Title" className="md:w-1/3 font-medium">Title:*</label>
          <Input
            type="text"
            id="Title"
            className="md:w-2/3"
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* Description */}
        <div className="flex flex-col md:flex-row w-full items-start md:items-center gap-2">
          <label htmlFor="Description" className="md:w-1/3 font-medium">Description:*</label>
          <Input
            type="text"
            id="Description"
            className="md:w-2/3"
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Start Date */}
        <div className="flex flex-col md:flex-row w-full items-start md:items-center gap-2">
          <label htmlFor="start-date" className="md:w-1/3 font-medium">Challenge start date:*</label>
          <Input
            type="date"
            id="start-date"
            className="md:w-2/3"
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        {/* End Date */}
        <div className="flex flex-col md:flex-row w-full items-start md:items-center gap-2">
          <label htmlFor="end-date" className="md:w-1/3 font-medium">Challenge end date:*</label>
          <Input
            type="date"
            id="end-date"
            className="md:w-2/3"
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        {/* Exp */}
        <div className="flex flex-col md:flex-row w-full items-start md:items-center gap-2">
          <label htmlFor="end-date" className="md:w-1/3 font-medium">Exp:*</label>
          <Input
            type="number"
            id="end-date"
            className="md:w-2/3"
            onChange={(e) => setExp(e.target.value)}
          />
        </div>

        {/* Amount */}
        <div className="flex flex-col md:flex-row w-full items-start md:items-center gap-2">
          <label htmlFor="end-date" className="md:w-1/3 font-medium">Amount to goal:*</label>
          <Input
            type="number"
            id="end-date"
            className="md:w-2/3"
            onChange={(e) => setAmountToGoal(e.target.value)}
          />
        </div>

        <p className="self-start mt-2 text-muted-foreground">*: required field</p>

        {/* Submit */}
        <Button
          variant="primary"
          className="w-full mt-4"
          onClick={(e) => handleSubmit(e)}
        >
          Create
        </Button>
      </form>
      {error && <ErrorModal message={error} onClose={() => setError(null)} />}
      {success && <SuccessModal message={success} onClose={() => setSuccess(null)} />}
    </div>
  );
}

export default AdminChallengePage;