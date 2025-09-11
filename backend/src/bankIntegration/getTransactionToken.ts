import axios from "axios";

/**
 * <send request to zai Api to get new transaction token (only valid for 60 mniutes)>
 * 
 * @returns Zai Access Token {string}
 */
export const getTransactionToken = async () => {
  
  try {
    const response = await axios.post(
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

    return response.data.access_token

  } catch (error) {
    console.error('Error fetching Assembly token:', error);
    throw error;
  }
};
