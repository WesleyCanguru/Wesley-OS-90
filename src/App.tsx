/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Hoje } from "./pages/Hoje";
import { Ontem } from "./pages/Ontem";
import { Corpo } from "./pages/Corpo";
import { Alma } from "./pages/Alma";
import { Agencia } from "./pages/Agencia";
import { Metas } from "./pages/Metas";
import { PlaceholderPage } from "./pages/Placeholder";

export default function App() {
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
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
