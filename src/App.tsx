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
import { Ontem } from "./pages/Ontem";
import { Corpo } from "./pages/Corpo";
import { Alma } from "./pages/Alma";
import { Agencia } from "./pages/Agencia";
import { Metas } from "./pages/Metas";
import { Auth } from "./components/Auth";
import { SetupRequired } from "./components/SetupRequired";
import { Session } from "@supabase/supabase-js";

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const isConfigured = Boolean(supabaseUrl && supabaseAnonKey);

  useEffect(() => {
    if (!isConfigured) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [isConfigured]);

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

  if (!session) {
    return <Auth />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="hoje" element={<Hoje />} />
          <Route path="ontem" element={<Ontem />} />
          <Route path="corpo" element={<Corpo />} />
          <Route path="alma" element={<Alma />} />
          <Route path="agencia" element={<Agencia />} />
          <Route path="metas" element={<Metas />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
