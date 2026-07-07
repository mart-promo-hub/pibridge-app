const PI_ME_URL = 'https://api.minepi.com/v2/me';
const SESSION_COOKIE = 'pibridge_pi_session';

const json = (body: Record<string, unknown>, init: ResponseInit = {}) =>
  Response.json(body, {
    ...init,
    headers: {
      'Cache-Control': 'no-store',
      ...(init.headers || {})
    }
  });

const safeJson = async (request: Request) => {
  try {
    return await request.json();
  } catch {
    return {};
  }
};

const createSessionValue = (user: Record<string, unknown>) =>
  Buffer.from(JSON.stringify({
    uid: user.uid,
    username: user.username,
    issuedAt: Date.now()
  })).toString('base64url');

export default async (request: Request, context: any) => {
  if (request.method === 'DELETE') {
    context.cookies.delete(SESSION_COOKIE);
    return json({ ok: true });
  }

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  const body = await safeJson(request);
  const accessToken = typeof body.accessToken === 'string' ? body.accessToken : '';

  if (!accessToken) {
    return json({ error: 'Missing Pi access token' }, { status: 400 });
  }

  const piResponse = await fetch(PI_ME_URL, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json'
    }
  });

  if (!piResponse.ok) {
    return json({ error: 'Pi authentication failed' }, { status: 401 });
  }

  const piUser = await piResponse.json();
  const user = {
    uid: piUser.uid,
    username: piUser.username
  };

  if (!user.uid || !user.username) {
    return json({ error: 'Pi profile response was incomplete' }, { status: 502 });
  }

  context.cookies.set({
    name: SESSION_COOKIE,
    value: createSessionValue(user),
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    maxAge: 60 * 60 * 24 * 7
  });

  return json({ user });
};

export const config = {
  path: '/api/pi/session'
};
