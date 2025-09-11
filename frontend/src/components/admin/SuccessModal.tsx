interface SuccessModalProps {
  message: string;
  onClose: () => void;
}

const SuccessModal = ({ message, onClose }: SuccessModalProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-20 backdrop-blur-sm">
      <div className="bg-white p-6 rounded shadow-lg w-11/12 sm:w-1/2 max-w-md">
        <h2 className="text-xl font-bold text-green-600 mb-4">Success</h2>
        <p className="text-gray-700 mb-4">{message}</p>
        <button
          onClick={onClose}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default SuccessModal;