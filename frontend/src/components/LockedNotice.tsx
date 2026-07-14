import { TriangleAlert } from 'lucide-react';

const LockedNotice = () => {
  return (
    <div className="bg-destructive/10 border-l-4 border-destructive p-4">
      <div className="flex flex-row items-center">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <TriangleAlert className="h-5 w-5 text-destructive" />
          </div>

          <div className="ml-4">
            <p className="text-sm text-destructive">
              Your account is locked. You won&apos;t be able to access this feature. Please contact support for assistance.
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}

export default LockedNotice;