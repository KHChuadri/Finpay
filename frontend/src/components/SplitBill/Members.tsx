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

function ManageMembers({ list }: MemberList) {
  return (
    <div
      id="list"
      className="h-[600px] w-full flex flex-col gap-4 px-4 py-6 rounded-2xl overflow-y-scroll"
    >
      {list.map((item, index) => (
        <div
          key={index}
          className="relative rounded-lg bg-card p-4 shadow-2xl"
        >
          <div className="flex flex-col text-left space-y-2">
            <div className="justify-between flex flex-row">
              <h2 className="text-lg font-bold">Member Name: {item.name}</h2>
            </div>
            <h2 className="text-sm text-muted-foreground">
              {item.role}
            </h2>
            <h2 className="text-sm">{item.email}</h2>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ManageMembers;
