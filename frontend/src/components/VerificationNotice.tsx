
import { FiAlertCircle } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const VerificationNotice = () => {
  const navigate = useNavigate();
  return (
    <div className="bg-yellow-50 border-l-4 border-amber-600 p-4">
      <div className="flex md:flex-row flex-col items-center gap-2">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <FiAlertCircle className="h-5 w-5 text-amber-600" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              Your account is not verified yet. Verify now to gain access to all features.
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/profile')}
          className="ml-3 bg-amber-600 hover:bg-amber-700 text-white px-4 py-1 rounded-md text-sm font-medium transition cursor-pointer"
        >
          Verify Now
        </button>
      </div>
    </div>
  )
}

export default VerificationNotice
