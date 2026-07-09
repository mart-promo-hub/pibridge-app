// netlify/functions/pi-session.mts

import type { Handler } from "@netlify/functions";

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405 };

  const { accessToken } = JSON.parse(event.body || '{}');

  try {
    const response = await fetch('https://api.minepi.com/v2/me', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!response.ok) throw new Error('Invalid token');

    const userData = await response.json();
    
    return {
      statusCode: 200,
      body: JSON.stringify({ user: userData })
    };
  } catch (e) {
    return { statusCode: 401, body: 'Unauthorized' };
  }
};
