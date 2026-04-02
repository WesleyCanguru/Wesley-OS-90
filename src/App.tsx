/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase, supabaseUrl, supabaseAnonKey } from "./lib/supabase";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Hoje } from "./pages/Hoje";
import { Corpo } from "./pages/Corpo";
import { Alma } from "./pages/Alma";
import { Treinos } from "./pages/Treinos";
import { Agencia } from "./pages/Agencia";
import { Metas } from "./pages/Metas";
import { Auth } from "./components/Auth";
import { SetupRequired } from "./components/SetupRequired";
import { Session } from "@supabase/supabase-js";
import { clearUserData } from "./lib/seed";

export default function App() {
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const isConfigured = Boolean(supabaseUrl && supabaseAnonKey);

  useEffect(() => {
    const savedUser = localStorage.getItem('w12_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      
      // Limpeza única para Wesley e Sarah conforme solicitado
      const cleanupKey = `w12_cleanup_${parsedUser.name}`;
      if ((parsedUser.name === 'Wesley' || parsedUser.name === 'Sarah') && !localStorage.getItem(cleanupKey)) {
        clearUserData(parsedUser.name).then(() => {
          localStorage.setItem(cleanupKey, 'true');
          window.location.reload(); // Recarrega para garantir que os dados sumiram
        });
      }
    }
    setLoading(false);
  }, []);

  if (!isConfigured) {
    return <SetupRequired />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Auth onLogin={setUser} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout user={user} onLogout={() => setUser(null)} />}>
          <Route index element={<Dashboard />} />
          <Route path="check-in" element={<Hoje />} />
          <Route path="corpo" element={<Corpo />} />
          <Route path="alma" element={<Alma />} />
          <Route path="treinos" element={<Treinos />} />
          <Route path="agencia" element={<Agencia />} />
          <Route path="metas" element={<Metas />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
