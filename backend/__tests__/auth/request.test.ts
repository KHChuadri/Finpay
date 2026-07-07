import HTTPError from "http-errors";
import Request from "../../model/Request";
import User from "../../model/User";
import { requestService } from "../../src/modules/request/request.container";
const sendRequest = (
  email: string,
  senderId: string,
  amount: number,
  currency: string,
  notes: string
) => requestService.sendRequest(email, senderId, amount, currency, notes);
const acceptRequest = (requestId: string) =>
  requestService.acceptRequest(requestId);
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

type RequestCreateReturn = Awaited<ReturnType<typeof Request.create>>;

vi.mock('../../model/User', () => ({
  default: {
    findById: vi.fn(),
    findOne: vi.fn()
  }
}));

describe('Request Service', () => {
  const mockEmail = 'recipient@example.com';
  const mockSenderId = '507f1f77bcf86cd799439011';
  const mockAmount = 100;
  const mockCurrency = 'AUD';

  const mockRequestId = '507f1f77bcf86cd799439022';

  const mockSender = {
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    password: "SecurePass123!",
  };

  const mockRecipient = {
    firstName: 'Wesly',
    lastName: 'Yang',
    email: mockEmail,
    password: 'wesliYang123!',
    request: {
      push: vi.fn() 
    },
    save: vi.fn()
  }

  const mockRequest = {
    _id: mockRequestId,
    userId: mockSenderId,
    senderEmail: mockSender.email,
    currency: mockCurrency,
    amount: mockAmount,
    notes: '',
    date: Date.now(),
    save: vi.fn(),
  } as unknown as RequestCreateReturn

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  })

  describe('Validation', () => {
    it(`Sender's user id cannot be found (STATUS 404)`, async () => {
      vi.mocked(User.findById).mockResolvedValue(null as never);
      await expect(sendRequest(mockEmail, 'hihi', mockAmount, mockCurrency, '')).
        rejects.
        toThrow(HTTPError(404, "User does not exists"));
    });
    
    it(`Recipient email does not exists (STATUS 404)`, async () => {
      vi.mocked(User.findById).mockResolvedValue(mockSender as never);
      vi.mocked(User.findOne).mockResolvedValue(null);
      await expect(sendRequest(mockEmail, mockSenderId, mockAmount, mockCurrency, ''))
        .rejects
        .toThrow(HTTPError(404, "Recipient not found."));
    });

    it('Cannot send request to itself (STATUS 400)', async () => {
      vi.mocked(User.findById).mockResolvedValue(mockSender);
      vi.mocked(User.findOne).mockResolvedValue(true as never);

      await expect(sendRequest(mockSender.email, mockSenderId, mockAmount, mockCurrency, ''))
        .rejects
        .toThrow(HTTPError(400, "Cannot send request to yourself"))
    });

    it('Try to send invalid amount', async () => {
      vi.mocked(User.findById).mockResolvedValue(mockSender);
      vi.mocked(User.findOne).mockResolvedValue(true as never);

      await expect(sendRequest(mockEmail, mockSenderId, 0, mockCurrency, ''))
        .rejects
        .toThrow(HTTPError(400, 'Amount must be greater than 0'))
    });

    it('Try to accept an invalid reuqest (STATUS 404)', async () => {
      vi.spyOn(Request, 'findById').mockResolvedValue(undefined as never);

      await expect(acceptRequest(mockRequestId))
        .rejects
        .toThrow(HTTPError(404, "Request not found"));
    });

    it('Request with id exists but sender email does not (STATUS 404)', async () => {
      vi.spyOn(Request, 'findById').mockResolvedValue({mockRequest});
      vi.mocked(User.findOne).mockResolvedValue(null);

      await expect(acceptRequest(mockRequestId))
        .rejects
        .toThrow(HTTPError(404, "Sender user not found"));
    });
  });

  it('Successfully send request', async () => {
    vi.mocked(User.findById).mockResolvedValue(mockSender);
    vi.mocked(User.findOne).mockResolvedValue(mockRecipient);
    vi.spyOn(Request, 'create').mockResolvedValue(mockRequest);

    const result = await sendRequest(mockEmail, mockSenderId, 100, mockCurrency, '');
    expect(result).toEqual({
      requestId: mockRequestId
    });

    expect(mockRecipient.request.push).toHaveBeenCalledWith(mockRequestId);
    expect(mockRecipient.save).toHaveBeenCalledTimes(1);
  });
});