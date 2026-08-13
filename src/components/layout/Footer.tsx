"use client";

import React from "react";
import { Code2 } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="w-full border-t border-white/10 bg-slate-950/80 backdrop-blur-xl py-5 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-slate-400 font-medium">
        
        {/* Left Side: Copyright */}
        <div>
          &copy; {new Date().getFullYear()} Datacode Studio. All rights reserved.
        </div>

        {/* Right Side: Clean Developer Tag */}
        <div className="flex items-center space-x-2 bg-slate-900/80 border border-purple-500/20 px-4 py-1.5 rounded-full shadow-lg shadow-purple-500/5">
          <Code2 className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-slate-400">Developer:</span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-purple-300 to-indigo-400 font-bold tracking-wider">
            Kartik Upadhyay
          </span>
        </div>

      </div>
    </footer>
  );
};

export default Footer;