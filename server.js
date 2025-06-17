
const express = require('express');
const axios = require('axios');
const { JWT } = require('google-auth-library');
const serviceAccount = {
  project_id: process.env.PROJECT_ID,
  private_key: process.env.PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.CLIENT_EMAIL,
};

const app = express();
app.use(express.json());

const SCOPES = ['https://www.googleapis.com/auth/firebase.messaging'];
const PROJECT_ID = serviceAccount.project_id;

async function getAccessToken() {
  const client = new JWT({
    email: serviceAccount.client_email,
    key: serviceAccount.private_key,
    scopes: SCOPES,
  });

  const tokens = await client.authorize();
  return tokens.access_token;
}

app.post('/sendNotification', async (req, res) => {
  const { toToken, title, body } = req.body;

  try {
    const accessToken = await getAccessToken();

    const response = await axios.post(
      `https://fcm.googleapis.com/v1/projects/${PROJECT_ID}/messages:send`,
      {
        message: {
          token: toToken,
          notification: {
            title,
            body,
          },
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    res.status(200).send(response.data);
  } catch (error) {
    console.error('Notification failed ❌:', error.response?.data || error.message);
    res.status(500).send({ error: error.message });
  }
});

app.listen(3000, () => console.log('🚀 Server running on http://localhost:3000'));
