"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";

import AdminSidebar, { AdminMenuKey } from "./AdminSider";
import MembersPanel from "./MembersPanel";
import MoviesPanel from "./MoviesPanel";
import ReviewsPanel from "./ReviewsPanel";

export default function Admin() {
  const [activeMenu, setActiveMenu] = useState<AdminMenuKey>("members");

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto flex w-full max-w-6xl gap-6 px-6 py-10">
        {/* Sidebar */}
        <aside className="w-60 shrink-0">
          <Card className="border border-zinc-800 bg-zinc-900/30 p-3">
            <AdminSidebar value={activeMenu} onChange={setActiveMenu} />
          </Card>
        </aside>

        {/* Main */}
        <main className="flex-1">
          {activeMenu === "members" && <MembersPanel />}
          {activeMenu === "movies" && <MoviesPanel />}
          {activeMenu === "reviews" && <ReviewsPanel />}
        </main>
      </div>
    </div>
  );
}
