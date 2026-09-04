import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import MorphGuardApp, { C, useSystemTheme } from './MorphGuardApp.jsx';
import LoginPage from './LoginPage.jsx';

function AuthGate() {
  useSystemTheme();
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('mg_user');
      return localStorage.getItem('mg_token') && raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  if (!user) {
    return <LoginPage colors={C} onAuthenticated={setUser} />;
  }
  return <MorphGuardApp />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthGate />
  </React.StrictMode>
);
