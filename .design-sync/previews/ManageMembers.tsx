import ManageMembers from '@/components/SplitBill/Members';

export const Default = () => (
  <div className="w-96">
    <ManageMembers
      groupId="grp_01"
      onMemberUpdate={() => {}}
      list={[
        { id: '1', name: 'Jordan Lee', email: 'jordan@finpay.com', role: 'Owner' },
        { id: '2', name: 'Sam Rivera', email: 'sam@finpay.com', role: 'Member' },
        { id: '3', name: 'Alex Chen', email: 'alex@finpay.com', role: 'Member' },
      ]}
    />
  </div>
);
