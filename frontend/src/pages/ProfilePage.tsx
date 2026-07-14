import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import { FiEdit2, FiSun, FiMoon, FiAlertCircle } from "react-icons/fi";
import { TriangleAlert, X } from "lucide-react";

import Layout from '../components/Layout';
import LogoutButton from "@/components/dashboard/LogoutButton";
import useAuthStore from "@/stores/authStore";
import PersonalDetails from "../components/profile/PersonalDetails";
import BankDetails from "../components/profile/BankDetails";
import useDarkModeStore from "@/stores/darkModeStore";
import { API_URL } from "@/constants/API_URL";
import { Button } from "@/components/ui/Button";

const rankColour: Record<string, string> = {
  bronze: "from-yellow-800 to-yellow-600",
  silver: "from-gray-400 to-gray-600",
  gold: "from-yellow-400 to-yellow-200",
  platinum: "from-indigo-400 to-indigo-700",
};

const ranks = [
  { name: "bronze", threshold: 100 },
  { name: "silver", threshold: 200 },
  { name: "gold", threshold: 400 },
  { name: "platinum", threshold: 800 }
];

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });

const MAX_IMG_SIZE: number = 2; // 2 mb max for profile img

const ProfilePage = () => {
  const navigate = useNavigate();
  const userId = useAuthStore.getState().userId;
  const token = useAuthStore.getState().token;
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [isEditingBank, setisEditingBank] = useState(false);

  const [isVerified, setIsVerified] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const { darkMode, setDarkMode } = useDarkModeStore();
  const [changeAccountModal, setChangeAccountModal] = useState(false);

  const [profileImage, setProfileImage] = useState('/profile icon.png');
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [kycFile, setKycFile] = useState<File | null>(null);

  const [userRank, setUserRank] = useState('');
  const [currentExp, setCurrentExp] = useState(0);
  const [requiredExp, setRequiredExp] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);

  const [personalDetails, setPersonalDetails] = useState({
    givenName: "",
    familyName: "",
    passwordLength: 0,
    dob: null,
    address1: "",
    address2: "",
    country: "",
    email: "",
    KYCimg: "",
    accountType: "",
  });

  const requiredFields = [
    "givenName",
    "familyName",
    "dob",
    "address1",
    "country",
    "KYCimg"
  ];

  const checkMissingFields = requiredFields.some(
    (field) => !personalDetails[field as keyof typeof personalDetails]
  );

  const [displayDetails, setDisplayDetails] = useState({
    givenName: "",
    familyName: ""
  });

  const [bankDetails, setBankDetails] = useState({
    bankName: "Zai API (Sandbox)",
    depositId: "",
    userId: "buyer-6543217890",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${API_URL}/user/profile/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = res.data;

      setPersonalDetails({
        givenName: data.firstName,
        familyName: data.lastName,
        passwordLength: data.passwordLength,
        dob: data.dob || null,
        address1: `${data.address?.addressLine1 || ""}`.trim(),
        address2: `${data.address?.addressLine2 || ""}`.trim(),
        country: `${data.address?.country || ""}`.trim(),
        email: data.email,
        KYCimg: data.KYCimg,
        accountType: data.accountType || "",
      });

      if (data.profileImg) {
        setProfileImage(data.profileImg);
        useAuthStore.getState().setProfileImg(data.profileImg);
      }

      setDisplayDetails({
        givenName: data.firstName,
        familyName: data.lastName
      });

      setBankDetails({
        bankName: "Zai API (Sandbox)",
        depositId: data.depositId || "",
        userId: `buyer-6543217890`,
      });

      useAuthStore.getState().setUserStatus(data.isVerified, data.isLocked);
      setIsVerified(data.isVerified);
      setIsLocked(data.isLocked);
      setErrorMessage(null);

      const { rank, currentExp, requiredExp, progressPercent } = calculateRankAndProgress(data.exp);
      setUserRank(rank);
      setCurrentExp(currentExp);
      setRequiredExp(requiredExp);
      setProgressPercent(progressPercent);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.errorMsg || 'Something went wrong';
        setErrorMessage(msg);
        console.error('Fetching user profile error in profile:', msg);
      } else {
        setErrorMessage('An unexpected error occurred');
      }
    }
  };

  const calculateRankAndProgress = (exp: number) => {
    let accumulated = 0;

    for (let i = 0; i < ranks.length; i++) {
      const { name, threshold } = ranks[i];
      const nextThreshold = threshold;

      if (exp < accumulated + nextThreshold) {
        return {
          rank: name,
          currentExp: exp - accumulated,
          requiredExp: nextThreshold,
          progressPercent: ((exp - accumulated) / nextThreshold) * 100
        };
      }

      accumulated += nextThreshold;
    }

    return {
      rank: "platinum",
      currentExp: ranks[ranks.length - 1].threshold,
      requiredExp: ranks[ranks.length - 1].threshold,
      progressPercent: 100
    };
  };

  const handleSaveProfile = async () => {
    try {
      // Validate all of the required fields
      if (!personalDetails.givenName.trim() || personalDetails.givenName.length == 0) {
        setErrorMessage("Given name cannot be empty");
        return;
      }

      if (!personalDetails.familyName.trim() || personalDetails.familyName.length == 0) {
        setErrorMessage("Family name cannot be empty");
        return;
      }

      if (!personalDetails.dob) {
        setErrorMessage("Date of birth cannot be empty");
        return;
      } else {
        const dobDate = new Date(personalDetails.dob);
        const today = new Date();

        if (dobDate > today) {
          setErrorMessage("Date of birth cannot be in the future");
          return;
        }
      }

      if (!personalDetails.address1.trim() || personalDetails.address1.length == 0) {
        setErrorMessage("Address line 1 cannot be empty");
        return;
      }

      if (!personalDetails.country.trim() || personalDetails.country.length == 0) {
        setErrorMessage("Country cannot be empty");
        return;
      }

      if (!personalDetails.KYCimg && !kycFile) {
        setErrorMessage("ID verification is required for authentication");
        return;
      }

      // Handle kyc image upload
      if (kycFile) {
        await handleKycUpload(kycFile);
      }

      const payload = {
        firstName: personalDetails.givenName.trim(),
        lastName: personalDetails.familyName.trim(),
        dob: personalDetails.dob ? new Date(personalDetails.dob).toISOString() : null,
        addressLine1: personalDetails.address1.trim() || null,
        addressLine2: personalDetails.address2.trim() || null,
        country: personalDetails.country.trim() || null
      }

      await axios.put(`${API_URL}/user/profile/${userId}`, payload);

      setDisplayDetails({
        ...displayDetails,
        givenName: personalDetails.givenName,
        familyName: personalDetails.familyName
      });
      setIsEditing(false);
      fetchProfile();
      setErrorMessage(null);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.errorMsg || 'Something went wrong';
        setErrorMessage(msg);
        console.error('Failed updating user profile in profile:', msg);
      } else {
        setErrorMessage('An unexpected error occurred');
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileSize = file.size / (1024 * 1024);

    if (fileSize > MAX_IMG_SIZE) {
      setErrorMessage(`Image must be under ${MAX_IMG_SIZE}MB.`);
      return;
    }

    try {
      setIsImageUploading(true);

      const base64Img = await fileToBase64(file);

      const payload = {
        firstName: personalDetails.givenName.trim(),
        lastName: personalDetails.familyName.trim(),
        dob: personalDetails.dob ? new Date(personalDetails.dob).toISOString() : null,
        addressLine1: personalDetails.address1.trim() || null,
        addressLine2: personalDetails.address2.trim() || null,
        country: personalDetails.country.trim() || null,
        profileImg: base64Img,
      }

      // Upload the image and update profile
      const response = await axios.put(`${API_URL}/user/profile/${userId}`, payload, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.profileImg) {
        setProfileImage(response.data.profileImg);
        useAuthStore.getState().setProfileImg(response.data.profileImg);
      }

      setIsImageUploading(false);
      fetchProfile();
    } catch (err) {
      setIsImageUploading(false);
      if (axios.isAxiosError(err)) {
        setErrorMessage(err.response?.data?.errorMsg || 'Failed to upload image or image size is too large');
      } else {
        setErrorMessage('Unexpected error occurred while uploading image');
      }
    }
  };

  const handleClearImage = async () => {
    try {
      // Revert back to default logo
      await axios.put(`h${API_URL}/user/profile/${userId}`, {
        profileImg: '/profile icon.png'
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setProfileImage('/profile icon.png');
      useAuthStore.getState().setProfileImg('/profile icon.png');
      fetchProfile();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setErrorMessage(err.response?.data?.errorMsg || 'Failed to clear profile image');
      } else {
        setErrorMessage('Failed to clear profile image');
      }
    }
  };

  const handleKycUpload = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('kycImage', file);
      formData.append('userId', userId!);

      const response = await axios.put(`${API_URL}/user/profile/upload-kyc`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      const data = response.data;

      setPersonalDetails(prev => ({
        ...prev,
        KYCimg: data.imageUrl
      }));
      return data;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setErrorMessage(err.response?.data?.errorMsg || 'Failed to upload kyc image');
      } else {
        setErrorMessage('Unexpected error occured while uploading kyc image');
      }
    }
  };

  const handleDetailChange = (key: string, value: string | File) => {
    if (key === 'KYCimg' && value instanceof File) {
      // Handle file uploads
      setKycFile(value);
      setPersonalDetails(prev => ({
        ...prev,
        KYCimg: URL.createObjectURL(value) // Create preview URL
      }));
    } else {
      // Handle regular text/date fields
      setPersonalDetails(prev => ({
        ...prev,
        [key]: value as string
      }));
    }
  };

  const handleUserBlock = async () => {
    try {
      await axios.put(`${API_URL}/admin/block/${userId}`, {
        isLocked: true,
      });
      setIsLocked(true);
      fetchProfile();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.errorMsg || 'An unexpected error occured during disable account';
        setErrorMessage(msg || 'An unexpected error occurred');
      } else {
        setErrorMessage('An unexpected error occurred');
      }
    }
  }

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleBankDetailChange = (key: string, value: string) => {
    setBankDetails(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleChangeBankDetails = () => {
    setisEditingBank(!isEditingBank);
  };

  const toggleAccountModal = () => {
    setChangeAccountModal((prev) => !prev);
  };

  const handleChangeAccountType = async () => {
    const newType = personalDetails.accountType === 'personal' ? 'business' : 'personal';

    try {
      await axios.put(`${API_URL}/user/profile/${userId}`, {
        accountType: newType
      });
      fetchProfile();
      setChangeAccountModal(false);
      setErrorMessage(null);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.errorMsg || 'An unexpected error occured during changing account type';
        setErrorMessage(msg || 'An unexpected error occurred');
      } else {
        setErrorMessage('An unexpected error occurred');
      }
    }
  };

  const headerButtons = (
    <div className="gap-4 flex items-center">
      <Button
        variant="ghost"
        onClick={() => navigate('/dashboard')}
        data-testid="back-to-dashboard"
        className="px-6 py-2 shadow-md"
      >
        Back to Dashboard
      </Button>
      <LogoutButton />
    </div>
  );

  return (
    <Layout headerRight={headerButtons}>
      <div className={`flex justify-center items-center py-8 px-4`}>
        <div className="w-full max-w-2xl rounded-xl shadow-lg overflow-hidden bg-card text-foreground">
          {/* Profile Header */}
          <div className="bg-muted px-6 py-4 border-b border-border">
            <div className="flex flex-row items-center gap-6">
              <div>
                {/* Profile Image Group */}
                <div className="relative group">
                  <div className="w-24 h-24 bg-secondary rounded-full border-3 border-card shadow-lg overflow-hidden">
                    <img
                      src={profileImage}
                      alt="Profile"
                      className="w-full h-full object-cover rounded-full cursor-pointer"
                    />
                  </div>

                  <label className="absolute bottom-0 right-0 p-2 text-primary-foreground rounded-full shadow-md bg-primary hover:opacity-90 transition-transform transform group-hover:scale-110 cursor-pointer">
                    <FiEdit2 className="w-4 h-4" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>

                  {isImageUploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    </div>
                  )}
                </div>

                {/* Clear Image Button */}
                {profileImage !== '/profile icon.png' && (
                  <button
                    onClick={handleClearImage}
                    className="mt-2 text-xs text-destructive hover:text-destructive/80 hover:underline transition-colors cursor-pointer"
                  >
                    Revert to Default
                  </button>
                )}
              </div>

              {/* Profile username and ID */}
              <div className="flex-1 w-full">
                <div className="flex flex-col sm:flex-row justify-between sm:items-start">
                  <div className="flex-1 min-w-0">
                    <h1 className="text-2xl font-bold text-foreground truncate">
                      {displayDetails.givenName} {displayDetails.familyName}
                    </h1>
                    <p className="break-all text-muted-foreground">ID: {userId}</p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between gap-2">
                      <button
                        onClick={toggleDarkMode}
                        className="p-2 rounded-full transition duration-300 cursor-pointer bg-secondary hover:bg-secondary/80"
                      >
                        {darkMode ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
                      </button>

                      {isLocked ? (
                        <p className="text-sm font-medium px-4 p-1.5 rounded-full bg-destructive/10 text-destructive">
                          Locked
                        </p>
                      ) : (isVerified ? (
                        <p className="text-sm font-medium px-4 p-1.5 rounded-full bg-positive/10 text-positive">
                          Verified
                        </p>
                      ) : (
                        <p className="text-sm font-medium px-4 p-1.5 rounded-full bg-warning/10 text-warning">
                          Unverified
                        </p>
                      ))}
                    </div>
                    <button
                      onClick={toggleAccountModal}
                      className="text-sm font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary self-end cursor-pointer"
                      title={`Change to ${personalDetails.accountType === 'personal' ? 'Business' : 'Personal'} Account`}
                    >
                      {personalDetails.accountType.charAt(0).toUpperCase() + personalDetails.accountType.slice(1).toLowerCase()} Account
                    </button>
                  </div>
                </div>

                {/* User Progress Bar */}
                <div className="mt-2 w-full">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-bold text-foreground">{userRank.toUpperCase()} User</p>
                    <p className="text-sm font-medium text-muted-foreground">EXP: {currentExp}/{requiredExp}</p>
                  </div>

                  <div className="w-full bg-secondary rounded-full h-3">
                    <div
                      className={`bg-gradient-to-r ${rankColour[userRank] || "from-gray-400 to-gray-600"} rounded-full h-3`}
                      style={{ width: `${progressPercent}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <div className="p-6 space-y-4 text-foreground">
            {/* Error message */}
            {errorMessage && (
              <div className="flex items-center justify-between px-4 py-3 mb-4 bg-destructive/10 border-l-4 border-destructive rounded-r">
                <div className="flex items-center gap-2">
                  <div className="flex-shrink-0">
                    <TriangleAlert className="h-5 w-5 text-destructive" />
                  </div>

                  <p className="text-sm text-destructive">{errorMessage}</p>
                </div>

                <button
                  onClick={() => setErrorMessage("")}
                  className="text-destructive hover:text-destructive/80 ml-4 transition duration-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}

            {/* Locked Notification */}
            {isLocked && (
              <div className="bg-destructive/10 border-l-4 border-destructive p-4 mb-2">
                <div className="flex flex-row items-center">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <TriangleAlert className="h-5 w-5 text-destructive" />
                    </div>

                    <div className="ml-4">
                      <p className="text-sm text-destructive">
                        Your account is locked. You won&apos;t be able to access certain features.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Unverified Notification */}
            {!isVerified && !isEditing && !isEditingBank && !isLocked && (
              <div className="bg-warning/10 border-l-4 border-warning p-4 mb-2">
                <div className="flex flex-row items-center">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <FiAlertCircle className="h-5 w-5 text-warning" />
                    </div>

                    {checkMissingFields ?
                      <div className="ml-3">
                        <p className="text-sm text-warning">
                          Your account is not verified yet. Verify now to gain access to all features.
                        </p>
                      </div>
                      :
                      <div className="ml-3">
                        <p className="text-sm text-warning">
                          Please wait for admin verification. You can still edit your details.
                        </p>
                      </div>
                    }
                  </div>

                  {checkMissingFields &&
                    <button
                      onClick={() => setIsEditing(true)}
                      className="ml-3 bg-warning hover:opacity-90 text-warning-foreground px-4 py-1 rounded-md text-sm font-medium transition duration-300 shadow-md cursor-pointer"
                    >
                      Verify Now
                    </button>
                  }
                </div>
              </div>
            )}

            {/* Edit Modes */}
            {isEditing ? (
              <PersonalDetails
                isEditing={isEditing}
                isVerified={isVerified}
                personalDetails={personalDetails}
                requiredFields={requiredFields}
                checkMissingFields={checkMissingFields}
                onDetailChange={handleDetailChange}
              />
            ) : isEditingBank ? (
              <BankDetails
                bankDetails={bankDetails}
                isEditing={isEditingBank}
                onBankDetailChange={handleBankDetailChange}
                onChangeBankDetails={handleChangeBankDetails}
              />
            ) : (
              <>
                <PersonalDetails
                  isEditing={isEditing}
                  isVerified={isVerified}
                  personalDetails={personalDetails}
                  requiredFields={requiredFields}
                  checkMissingFields={checkMissingFields}
                  onDetailChange={handleDetailChange}
                />

                <BankDetails
                  bankDetails={bankDetails}
                  isEditing={isEditingBank}
                  onBankDetailChange={handleBankDetailChange}
                  onChangeBankDetails={handleChangeBankDetails}
                />
              </>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between pt-4">
              {isEditing ? (
                <div className="flex gap-4">
                  <Button
                    variant="primary"
                    onClick={handleSaveProfile}
                    className="px-6 py-2 shadow-md"
                    data-testid="button-save-changes"
                  >
                    Save Changes
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      fetchProfile();
                      setIsEditing(false);
                    }}
                    className="px-6 py-2 shadow-md"
                  >
                    Cancel
                  </Button>
                </div>
              ) : isEditingBank ? (
                <div className="flex gap-4">
                  <Button
                    variant="primary"
                    onClick={handleChangeBankDetails}
                    className="px-6 py-2 shadow-md"
                    data-testid="button-save-bank-details"
                  >
                    Save Bank Details
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      fetchProfile();
                      setisEditingBank(false);
                    }}
                    className="px-6 py-2 shadow-md"
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <>
                  <Button
                    variant="primary"
                    onClick={() => setIsEditing(true)}
                    className="px-4 md:px-6 py-2 shadow-md"
                  >
                    Edit Profile
                  </Button>
                  <Button
                    variant="destructive"
                    className="px-4 md:px-6 py-2 shadow-md"
                    onClick={handleUserBlock}
                    disabled={isLocked}
                  >
                    {isLocked ? "Account Disabled" : "Disable Account"}
                  </Button>
                </>
              )}
            </div>

            {/* Change Account Modal */}
            {changeAccountModal && (
              <div className="flex items-center justify-center fixed inset-0 backdrop-blur-xs z-50">
                <div className="bg-card p-6 rounded-lg shadow-xl w-100">
                  <h2 className="text-xl font-semibold mb-6">Change Account Type</h2>
                  <p className="mb-4 text-md text-foreground">
                    Are you sure you want to change your account type to
                    <strong className="ml-1 text-foreground font-semibold">
                      {personalDetails.accountType === 'personal' ? 'Business' : 'Personal'}?
                    </strong>
                  </p>
                  <div className="flex justify-end gap-3">
                    <Button
                      variant="ghost"
                      onClick={() => setChangeAccountModal(false)}
                      className="px-4 py-2 text-sm"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleChangeAccountType}
                      className="px-4 py-2 text-sm"
                    >
                      Confirm
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );

};

export default ProfilePage;