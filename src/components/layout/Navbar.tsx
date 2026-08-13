"use client";

import React from "react";
import { Terminal, Database, LayoutDashboard, Sparkles } from "lucide-react";

export type TabType = "home" | "compiler" | "data" | "dashboard";

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: "compiler", label: "Code Compiler", icon: <Terminal className="w-4 h-4" /> },
    { id: "data", label: "Smart Data Filter", icon: <Database className="w-4 h-4" /> },
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-slate-950/70 border-b border-white/10">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div
          onClick={() => setActiveTab("home")}
          className="flex items-center space-x-2 cursor-pointer group"
        >
          <div className="p-2 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 text-white shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
            DataCode <span className="text-purple-400 font-extrabold">Studio</span>
          </span>
        </div>

        <nav className="flex items-center space-x-1 sm:space-x-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3 py-2 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  isActive
                    ? "bg-purple-600/30 text-purple-300 border border-purple-500/50 shadow-inner"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};