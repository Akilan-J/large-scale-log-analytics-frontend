import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import EvolveApp, { C, useSystemTheme } from './EvolveApp.jsx';
import LoginPage from './LoginPage.jsx';

function AuthGate() {
  useSystemTheme();
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('evolve_user');
      return localStorage.getItem('evolve_token') && raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  if (!user) {
    return <LoginPage colors={C} onAuthenticated={setUser} />;
  }
  return <EvolveApp />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthGate />
  </React.StrictMode>
);
