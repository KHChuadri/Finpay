import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from '@/components/Layout';
import useAuthStore from '@/stores/authStore';
import { format } from 'date-fns';
import CircularProgress from "@mui/material/CircularProgress";
import { API_URL } from '@/constants/API_URL';
import { Button } from '@/components/ui/Button';

interface Request {
  requestId: string;
  senderEmail: string;
  requestDate: string;
  amount: number;
  currency: string;
  notes: string;
}

const RequestListPage = () => {
  const navigate = useNavigate();
  const [requestList, setRequestList] = useState<Request[]>([]);
  const { userId } = useAuthStore();
  const [loadingStates, setLoadingStates] = useState<Record<string, "accept" | "decline" | null>>({});

  useEffect(() => {
    const getRequestList = async () => {
      try {
        const response = await axios({
          method: 'GET',
          url: `${API_URL}/transaction/request/${userId}`
        });
        setRequestList(response.data.request);
      } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
          const msg = err.response?.data?.errorMsg || 'Something went wrong while fetching request list';
          console.error(msg || 'Something went wrong while fetching request list');
        } else {
          console.error('Failed to load request list');
        }
      }
    };

    getRequestList();
  }, [userId]);

  const handleAccept = async (requestId: string) => {
    setLoadingStates(prev => ({ ...prev, [requestId]: "accept" }));
    try {
      await axios.post(`${API_URL}/transaction/request/accept`, {
        requestId,
      });

      setRequestList((prev) => prev.filter((r) => r.requestId !== requestId));
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.errorMsg || 'Something went wrong while accepting request';
        console.error(msg || 'Something went wrong while fetching accepting request');
      } else {
        console.error('Failed to load accepting request');
      }
    } finally {
      setLoadingStates(prev => ({ ...prev, [requestId]: null }));
    }
  };

  const handleDelete = async (requestId: string) => {
    try {
      await axios.delete(`${API_URL}/transaction/request/delete/${requestId}`);
      setRequestList((prev) => prev.filter((r) => r.requestId !== requestId));
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.errorMsg || 'Something went wrong while deleting request';
        console.error(msg || 'Something went wrong while deleting request');
      } else {
        console.error('Failed to load delete request');
      }
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy h:mm a');
    } catch {
      return dateString;
    }
  };

  return (
    <div className='flex flex-col w-full min-h-screen'>
      <Layout>
        <div className='flex flex-grow justify-center items-start p-4 w-full'>
          <div className='flex flex-col bg-card rounded-2xl p-6 gap-4 shadow-lg w-3/4 md:w-1/2'>
            <div className='flex justify-between items-center'>
              <h2 className='text-2xl font-semibold text-foreground'>Request List</h2>
              <Button
                variant="primary"
                size="sm"
                data-testid="new-request-button"
                onClick={() => navigate('/request/recipient')}
              >
                New request
              </Button>
            </div>

            <div data-testid='request-list-header' className='flex flex-col w-full h-full gap-4 overflow-y-auto max-h-[70vh]'>
              {requestList.length === 0 ? (
                <div data-testid='no-requests' className='flex justify-center items-center h-32'>
                  <p className='text-muted-foreground font-semibold'>No requests found</p>
                </div>
              ) : (
                requestList.map((r) => (
                  <div
                    key={r.requestId}
                    className="flex flex-col bg-card border border-border rounded-xl p-4 gap-2 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p data-testid="requester-email" className="font-semibold text-foreground">{r.senderEmail}</p>
                        <p data-testid="requester-date" className="text-sm text-muted-foreground">
                          Requested on: {formatDate(r.requestDate)}
                        </p>
                      </div>
                      <p data-testid="requester-amount" className="text-lg font-bold text-foreground">
                        {r.amount.toLocaleString()} {r.currency}
                      </p>
                    </div>

                    <div className="flex justify-between items-center">
                      {r.notes && (
                        <div className="mt-2 p-3 bg-muted rounded-lg">
                          <p className="text-sm text-muted-foreground"><strong>Note:</strong> {r.notes}</p>
                        </div>
                      )}

                      <div className="flex justify-end gap-3 mt-3">
                        <Button
                          variant="primary"
                          className="px-4 py-2"
                          onClick={() => handleAccept(r.requestId)}
                        >
                         { loadingStates[r.requestId] === "accept" ? <CircularProgress color="inherit" size={16}/> : "Accept"}
                        </Button>
                        <Button
                          variant="destructive"
                          className="px-4 py-2"
                          onClick={() => handleDelete(r.requestId)}
                        >
                         { loadingStates[r.requestId] === "decline" ? <CircularProgress color="inherit" size={16}/> : "Decline"}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </Layout>
    </div>
  );
};

export default RequestListPage;