import { useEffect, useState } from 'react';
import { LOGIN_URL } from '../api';
import { useShop } from '../ShopContext.jsx';

export default function RequireLogin({ children }) {
  const { profile, loadProfile } = useShop();
  const [error, setError] = useState('');

  useEffect(() => {
    if (profile) return;
    loadProfile().catch(err => {
      if (err.status === 401) {
        alert('Please log in to continue. Your cart will be saved.');
        window.location.href = LOGIN_URL;
      } else {
        setError(err.message);
      }
    });
  }, [profile]);

  if (error) return <main className="page"><p className="error">{error}</p></main>;
  if (!profile) return <p style={{ padding: 24 }}>Loading...</p>;
  return children;
}
