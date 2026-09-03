import { Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";

import Dashboard from "./pages/Dashboard";
import FocusSession from "./pages/FocusSession";
import Analytics from "./pages/Analytics";
import Soundscapes from "./pages/Soundscapes";
import Sessions from "./pages/Sessions";
import Settings from "./pages/Settings";

function App() {
  return (
    <div className="flex min-h-screen bg-[#080b16] text-slate-100">

      <Sidebar />

      <main className="min-h-screen flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-[1600px] p-6 md:p-10">

          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/focus" element={<FocusSession />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/soundscapes" element={<Soundscapes />} />
            <Route path="/sessions" element={<Sessions />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>

        </div>
      </main>

    </div>
  );
}

export default App;