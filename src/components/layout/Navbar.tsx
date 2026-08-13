"use client";

import React from "react";
import { ArrowLeft, Home, BarChart2 } from "lucide-react";
import { useRouter } from "next/navigation";

// Exporting TabType to resolve TS2305
export type TabType = "studio" | "dashboard" | "home" | string;

// Props definition to resolve TS2322
interface NavbarProps {
  activeTab?: TabType;
  setActiveTab?: (tab: TabType) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const router = useRouter();

  const handleHomeClick = () => {
    if (setActiveTab) {
      setActiveTab("home");
    }
    window.location.href = "/";
  };

  const handleBackClick = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      handleHomeClick();
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-slate-950/80 backdrop-blur-xl border-b border-white/10 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Navigation Back & Home Buttons */}
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={handleBackClick}
            className="flex items-center space-x-2 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-200 rounded-xl text-xs font-semibold transition-all shadow-md active:scale-95 cursor-pointer"
            title="Go Back"
          >
            <ArrowLeft className="w-4 h-4 text-purple-400" />
            <span>Back</span>
          </button>

          <button
            type="button"
            onClick={handleHomeClick}
            className="flex items-center space-x-2 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-200 rounded-xl text-xs font-semibold transition-all shadow-md active:scale-95 cursor-pointer"
            title="Go to Home Page"
          >
            <Home className="w-4 h-4 text-purple-400" />
            <span>Home</span>
          </button>
        </div>

        {/* Website Brand Logo */}
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-purple-600/20 rounded-lg border border-purple-500/30">
            <BarChart2 className="w-5 h-5 text-purple-400" />
          </div>
          <span className="font-bold text-sm text-white tracking-wide">
            DataCode Studio
          </span>
        </div>
      </div>
    </header>
  );
};

export default Navbar;