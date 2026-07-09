import { useState } from "react";
import { FiAlertCircle, FiUpload } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/Input";

type PersonalDetailsProps = {
  isEditing: boolean;
  isVerified: boolean;
  personalDetails: {
    givenName: string;
    familyName: string;
    passwordLength: number;
    dob: string | null;
    address1: string;
    address2: string;
    country: string;
    email: string;
    KYCimg?: string | null;
  };
  requiredFields: string[];
  checkMissingFields: boolean;
  onDetailChange: (key: string, value: string | File) => void;
};

const PersonalDetails = ({ isEditing, isVerified, personalDetails, requiredFields, checkMissingFields, onDetailChange }: PersonalDetailsProps) => {
  const [kycPreview, setKycPreview] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setKycPreview(previewUrl);
      onDetailChange("KYCimg", file);
    }
  };

  const handleClearImage = () => {
    setKycPreview(null);
    onDetailChange("KYCimg", "");
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <h2 className="text-xl font-bold text-foreground">Personal Details</h2>

        {!isVerified && isEditing && checkMissingFields && (
          <div className="flex items-center bg-warning/10 border border-warning rounded-lg px-3 py-1.5">
            <FiAlertCircle className="w-4 h-4 text-warning mr-2" />
            <p className="text-sm text-warning">
              Please fill in all fields to verify your account
            </p>
          </div>
        )}
      </div>

      <hr className="h-1 bg-border border-0 rounded-lg mt-0 mb-2" />
      <div className="space-y-3">
        {/* Password Field */}
        <div className="flex items-start">
          <p className="w-40 font-medium text-foreground">Password</p>
          <p className="mx-2 text-foreground">:</p>
          <div className="flex-1 flex justify-between items-center">
            <div className="flex items-center">
              {Array.from({ length: personalDetails.passwordLength || 4 }).map((_, i) => (
                <p key={i} className="text-lg">*</p>
              ))}
            </div>

            <button
              className="text-primary hover:text-primary/80 text-sm font-medium ml-4 whitespace-nowrap cursor-pointer"
              onClick={() => navigate('../forgotpassword')}
            >
              Change password
            </button>
          </div>
        </div>

        {/* Other fields */}
        {[
          { label: "Email", key: "email", editable: false, type: "text" },
          { label: "Given Name", key: "givenName", editable: true, type: "text" },
          { label: "Family Name", key: "familyName", editable: true, type: "text" },
          { label: "Date of Birth", key: "dob", editable: true, type: "date" },
          { label: "Address 1", key: "address1", editable: true, type: "text" },
          { label: "Address 2 (optional)", key: "address2", editable: true, type: "text" },
          { label: "Country", key: "country", editable: true, type: "text" },
          { label: "ID Verification", key: "KYCimg", editable: true, type: "file", isImage: true },
        ].map(({ label, key, editable, type, isImage }) => (
          <div className="flex items-start" key={key}>
            <p className="w-40 font-medium text-foreground">{label}</p>
            <p className="mx-2 text-foreground">:</p>
            <div className="flex-1">
              {isEditing && editable ? (
                isImage ? (
                  <div className="space-y-2">
                    <label className="flex flex-col items-center px-4 py-2 rounded-lg border border-dashed border-border hover:bg-muted cursor-pointer">
                      <div className="flex flex-col items-center justify-center">
                        <FiUpload className="w-6 h-6 text-subtle mb-2" />
                        <p className="text-sm text-muted-foreground font-semibold">
                          Upload ID or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground">JPG, PNG up to 2MB</p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                    {(kycPreview || personalDetails.KYCimg) && (
                      <div className="mt-2 space-y-2">
                        <img
                          src={kycPreview || personalDetails.KYCimg || ''}
                          alt="ID Preview"
                          className="w-64 h-auto rounded border border-border"
                        />
                        <button
                          type="button"
                          onClick={handleClearImage}
                          className="text-sm text-destructive hover:text-destructive/80 underline cursor-pointer"
                        >
                          Clear Image
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <Input
                    type={type}
                    value={
                      type === "date" && personalDetails[key as keyof typeof personalDetails]
                        ? new Date(personalDetails[key as keyof typeof personalDetails] as string)
                          .toISOString()
                          .split("T")[0]
                        : personalDetails[key as keyof typeof personalDetails] || ""
                    }
                    placeholder={type === "date" ? "Select your date of birth" : `Enter ${label.toLowerCase()}`}
                    onChange={(e) => onDetailChange(key, e.target.value)}
                    error={requiredFields.includes(key) && !personalDetails[key as keyof typeof personalDetails]}
                    className="px-3 py-1.5 text-sm"
                  />
                )
              ) : (
                isImage ? (
                  <p className={!personalDetails.KYCimg ? 'text-subtle italic' : 'text-muted-foreground'}>
                    {personalDetails.KYCimg ? (
                      <img
                        src={personalDetails.KYCimg}
                        alt="Uploaded ID"
                        className="w-64 h-auto rounded border border-border"
                      />
                    ) : "Not provided"}
                  </p>
                ) : (
                  <p className={
                    (!personalDetails[key as keyof typeof personalDetails] ||
                      (key === 'dob' && !personalDetails.dob))
                      ? 'text-subtle italic'
                      : 'text-muted-foreground'
                  }>
                    {key === "dob"
                      ? personalDetails.dob
                        ? new Date(personalDetails.dob).toLocaleDateString()
                        : "Not set"
                      : personalDetails[key as keyof typeof personalDetails] || "Not set"}
                  </p>
                )
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PersonalDetails;