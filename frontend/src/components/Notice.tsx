import VerificationNotice from "./VerificationNotice";
import LockedNotice from "./LockedNotice";
import useAuthStore from "@/stores/authStore";

const Notice = () => {
  const { isLocked, isVerified } = useAuthStore();
  return (
    <>
      { ( isLocked ) ? <LockedNotice /> : (!isVerified) ? <VerificationNotice /> : <></>}
    </>
  )
}

export default Notice;