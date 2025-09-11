import { useNavigate } from "react-router-dom";
import useDarkModeStore from "@/stores/darkModeStore";

export interface ListItem {
  Name: string;
  Route: string;
}

export interface ListGroupProps {
  items: ListItem[];
}

function ListGroup({ items }: ListGroupProps) {
  const navigate = useNavigate();
  const { darkMode } = useDarkModeStore();

  return (
    <div className={`w-32 text-sm font-semibold ${darkMode ? "text-white hover:bg-gray-700" : "text-black bg-[#f98674]"} rounded-xl shadow-xl cursor-pointer`}>
      {items.map((item, index) => (
        <button
          key={index}
          onClick={() => navigate(item.Route)}
          className={`w-full px-6 py-2 ${darkMode ? "text-white hover:bg-gray-900" : "text-black bg-[#f98674] hover:bg-[#e57360]"} transition rounded-lg cursor-pointer`}
        >
          {item.Name}
        </button>
      ))}
    </div>
  );
}

export default ListGroup;
