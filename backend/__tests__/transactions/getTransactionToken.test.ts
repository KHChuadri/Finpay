import { describe as describeToken, it as itToken, expect as expectToken, beforeEach as beforeEachToken, vi, afterEach as afterEachToken } from 'vitest';
import axios from 'axios';
import { fetchTransactionToken } from "../../src/modules/bank/bank.container";
const getTransactionToken = () => fetchTransactionToken();

vi.mock('axios');

describeToken('getTransactionToken - Unit Tests', () => {
  beforeEachToken(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEachToken(() => {
    vi.restoreAllMocks();
  });

  itToken('should successfully fetch transaction token', async () => {
    // Arrange
    const mockAccessToken = 'mock-access-token-12345';
    vi.mocked(axios.post).mockResolvedValue({
      data: {
        access_token: mockAccessToken,
        token_type: 'Bearer',
        expires_in: 3600
      }
    });

    // Act
    const token = await getTransactionToken();

    // Assert
    expectToken(token).toBe(mockAccessToken);
    
    expectToken(axios.post).toHaveBeenCalledWith(
      'https://au-0000.sandbox.auth.assemblypay.com/tokens',
      {
        grant_type: 'client_credentials',
        client_id: '7vvlud4rqu286ikt8c519nj3jq',
        client_secret: '1aanj7qpnvg79jv8bn24v03noile9qgm35ril2dj48ia8888dgc2',
        scope: 'im-au-10/20b9a510-3df0-013e-9a3a-0a58a9feac03:cb76605a-5134-46fc-8c42-71027d922701:3'
      },
      {
        headers: {
          accept: 'application/json',
          authorization: 'Basic YnVyYWthYmEwN0BnbWFpbC5jb206NEBaJS9jbVFZNw==',
          'content-type': 'application/json'
        },
        maxBodyLength: Infinity
      }
    );
  });

  itToken('should handle API errors', async () => {
    // Arrange
    const mockError = new Error('Authentication failed');
    vi.mocked(axios.post).mockRejectedValue(mockError);

    // Act & Assert
    await expectToken(getTransactionToken()).rejects.toThrow('Authentication failed');
    expectToken(console.error).toHaveBeenCalledWith('Error fetching Assembly token:', mockError);
  });

  itToken('should handle network errors', async () => {
    // Arrange
    const networkError = new Error('Network timeout');
    vi.mocked(axios.post).mockRejectedValue(networkError);

    // Act & Assert
    await expectToken(getTransactionToken()).rejects.toThrow('Network timeout');
  });

  itToken('should handle empty response', async () => {
    // Arrange
    vi.mocked(axios.post).mockResolvedValue({
      data: {}
    });

    // Act
    const token = await getTransactionToken();

    // Assert
    expectToken(token).toBeUndefined();
  });
});