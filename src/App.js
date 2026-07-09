// src/App.js

import React, { useEffect, useState } from 'react';

function App() {
  const [user, setUser] = useState(null);

  const authenticatePi = async () => {
    try {
      const Pi = window.Pi;
      await Pi.init({ version: '2.0' });
      const auth = await Pi.authenticate(['username'], onIncomplete);
      
      // Send token to backend for validation
      const response = await fetch('/.netlify/functions/pi-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: auth.accessToken }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (err) {
      console.error('Auth failed', err);
    }
  };

  const onIncomplete = (error) => {
    console.error('Incomplete auth', error);
  };

  useEffect(() => {
    authenticatePi();
  }, []);

  return (
    <div className="App">
      {user ? (
        <h1>Welcome, {user.username}</h1>
      ) : (
        <button onClick={authenticatePi}>Sign in with Pi</button>
      )}
    </div>
  );
}

export default App;
