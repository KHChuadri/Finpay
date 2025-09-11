import { TriangleAlert } from 'lucide-react';

const LockedNotice = () => {
  return (
    <div className="bg-red-100 border-l-4 border-red-400 p-4">
      <div className="flex flex-row items-center">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <TriangleAlert className="h-5 w-5 text-red-500" />
          </div>

          <div className="ml-4">
            <p className="text-sm text-red-600">
              Your account is locked. You won&apos;t be able to access this feature. Please contact support for assistance.
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}

export default LockedNotice;