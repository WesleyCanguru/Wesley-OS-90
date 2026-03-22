import { useState, useEffect } from 'react';

export function useUser() {
  const [user, setUser] = useState<{ name: string } | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('w12_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  return user;
}
