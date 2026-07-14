import PersonalDetails from '@/components/profile/PersonalDetails';

// Uses useNavigate — DsRouter provider supplies the router.
export const Default = () => (
  <div className="w-[32rem]">
    <PersonalDetails
      isEditing={false}
      isVerified={true}
      personalDetails={{
        givenName: 'Jordan', familyName: 'Lee', passwordLength: 10, dob: '1994-06-12',
        address1: '12 Market St', address2: 'Apt 4', country: 'Australia',
        email: 'jordan@finpay.com', KYCimg: null,
      }}
      requiredFields={[]}
      checkMissingFields={false}
      onDetailChange={() => {}}
    />
  </div>
);
