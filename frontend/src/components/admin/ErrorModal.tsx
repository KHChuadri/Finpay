import { Button } from '@/components/ui/Button';

interface ErrorModalProps {
  message: string;
  onClose: () => void;
}

const ErrorModal = ({ message, onClose }: ErrorModalProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-20 backdrop-blur-sm">
      <div className="bg-card border border-border p-6 rounded shadow-lg w-11/12 sm:w-1/2 max-w-md">
        <h2 className="text-xl font-bold text-destructive mb-4">Error</h2>
        <p className="text-muted-foreground mb-4">{message}</p>
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}

export default ErrorModal;