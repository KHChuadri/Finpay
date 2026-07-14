import { useNavigate } from "react-router-dom";

export interface ListItem {
  Name: string;
  Route: string;
}

export interface ListGroupProps {
  items: ListItem[];
}

function ListGroup({ items }: ListGroupProps) {
  const navigate = useNavigate();

  return (
    <div className="w-32 text-sm font-semibold text-foreground bg-card rounded-xl shadow-xl cursor-pointer">
      {items.map((item, index) => (
        <button
          key={index}
          onClick={() => navigate(item.Route)}
          className="w-full px-6 py-2 text-foreground hover:bg-secondary transition rounded-lg cursor-pointer"
        >
          {item.Name}
        </button>
      ))}
    </div>
  );
}

export default ListGroup;
