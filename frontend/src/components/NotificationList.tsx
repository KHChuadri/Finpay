export interface Props {
  id: string;
  type: string;
  sender: User;
  receiver: User;
  description: string;
}

export interface MemberList {
  list: Props[];
}

interface User {
  firstName: string;
  lastName: string;
}

function NotificationList({ list }: MemberList) {
  return (
    <div
      className="h-[600px] w-full flex flex-col gap-4 rounded overflow-auto"
    >
      {list.map((item, index) => (
        <div key={index} className="flex flex-col rounded-lg p-4 border-2 border-border gap-1">

          <div className='flex w-full justify-between'>
            {item.type === 'Invitation' && <h1 className='text-lg font-semibold'>Group invitation</h1>}
            <h2 className="h-1/2 md:h-full inline-flex items-center md:px-3 px-1 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
              {item.type}
            </h2>
          </div>

          <div className="flex flex-col text-left gap-1">
            <div className="justify-between flex flex-row">
              <h2 className="text-sm font-semibold text-muted-foreground">{`Description: ${item.description}`}</h2>
            </div>

            <h2 className="text-sm font-semibold text-muted-foreground">{`From: ${item.sender.firstName} ${item.sender.lastName}`}</h2>
          </div>
        </div>
      ))}
    </div>
  );
}

export default NotificationList;
