"use client";

import React, { useState, useEffect } from "react";
import { Navbar, TabType } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SpatialBackground } from "@/components/background/SpatialBackground";
import { CodeCompiler } from "@/components/compiler/CodeCompiler";
import { DataFilter } from "@/components/data/DataFilter";
import { DashboardBuilder } from "@/components/dashboard/DashboardBuilder";
import { Code2, Filter, BarChart3, Terminal, Cpu, Database, Layers, User, Edit3, Sparkles } from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>("home");
  const [userName, setUserName] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [tempName, setTempName] = useState<string>("");

  // Load name from localStorage or ask user on first visit
  useEffect(() => {
    const savedName = localStorage.getItem("datacode_user_name");
    if (savedName) {
      setUserName(savedName);
    } else {
      setIsModalOpen(true);
    }
  }, []);

  // Save Name Handler
  const handleSaveName = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = tempName.trim();
    const finalName = trimmed ? trimmed : "Developer";
    setUserName(finalName);
    localStorage.setItem("datacode_user_name", finalName);
    setIsModalOpen(false);
  };

  const isFocusMode = activeTab !== "home";

  return (
    <div className="min-h-screen flex flex-col justify-between relative bg-[#060813] text-white selection:bg-purple-500 selection:text-white font-sans">
      {/* Background Spatial Mesh Canvas */}
      <SpatialBackground isFocusMode={isFocusMode} />

      {/* Top Navbar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* --- NAME INPUT MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="glass-card glass-card-glow-purple p-8 rounded-2xl max-w-md w-full border border-purple-500/30 text-center space-y-6 shadow-2xl relative">
            
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
              <Sparkles className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-white">Welcome to DataCode Studio</h2>
              <p className="text-xs text-slate-300">
                Please enter your name to customize your workspace experience.
              </p>
            </div>

            <form onSubmit={handleSaveName} className="space-y-4">
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="Enter your name..."
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  autoFocus
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 text-white text-sm border border-white/10 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-medium"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-semibold text-sm hover:opacity-90 transition-all shadow-lg shadow-purple-500/25 border border-purple-400/30"
              >
                Continue to Workspace →
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="relative z-10 flex-grow container mx-auto px-4 py-8 flex flex-col justify-center">
        {activeTab === "home" && (
          <section className="space-y-10 py-6 max-w-6xl mx-auto w-full">
            
            {/* Title Section */}
            <div className="text-center space-y-3">
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
                Data & Code Workbench
              </h1>
              <p className="text-slate-300 text-base sm:text-xl font-medium">
                The Ultimate Integrated Development, Analysis & Visualization Platform.
              </p>

              {/* Dynamic User Welcome Badge */}
              <div className="pt-2 flex items-center justify-center gap-3 text-sm">
                <button
                  onClick={() => {
                    setTempName(userName);
                    setIsModalOpen(true);
                  }}
                  className="inline-flex items-center space-x-2 px-3 py-1 rounded-full glass-card hover:bg-white/10 transition-all text-slate-300 border border-white/10 group cursor-pointer"
                  title="Click to edit name"
                >
                  <span>Welcome, <strong className="text-white font-bold">{userName || "Developer"}</strong></span>
                  <Edit3 className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-400 transition-colors" />
                </button>

                <button
                  onClick={() => setActiveTab("compiler")}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-semibold text-xs sm:text-sm hover:opacity-90 transition-all shadow-lg shadow-purple-500/25 border border-purple-400/30"
                >
                  Launch Workspace
                </button>
              </div>
            </div>

            {/* 3 Main Glassmorphic Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              
              {/* Card 1: Code Compiler */}
              <div className="glass-card glass-card-glow-blue p-6 rounded-2xl flex flex-col justify-between space-y-6 transition-all hover:-translate-y-1">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      <Code2 className="w-6 h-6" />
                    </div>
                    <h2 className="text-lg font-bold text-white leading-tight">
                      All-Language Code Compiler Engine
                    </h2>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Compile, execute & debug code across 50+ languages seamlessly. Real-time feedback, error detection & cloud execution.
                  </p>
                  
                  {/* Programming Language Badges */}
                  <div className="flex items-center space-x-2 pt-2">
                    <span className="px-2 py-1 rounded-md bg-yellow-500/20 text-yellow-300 text-[10px] font-bold border border-yellow-500/30">JS</span>
                    <span className="px-2 py-1 rounded-md bg-blue-500/20 text-blue-300 text-[10px] font-bold border border-blue-500/30">Python</span>
                    <span className="px-2 py-1 rounded-md bg-cyan-500/20 text-cyan-300 text-[10px] font-bold border border-cyan-500/30">C++</span>
                    <span className="px-2 py-1 rounded-md bg-orange-500/20 text-orange-300 text-[10px] font-bold border border-orange-500/30">Java</span>
                    <span className="px-2 py-1 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">Go</span>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab("compiler")}
                  className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white border border-white/20 transition-all"
                >
                  Start Coding Now
                </button>
              </div>

              {/* Card 2: Smart Data Filter */}
              <div className="glass-card glass-card-glow-purple p-6 rounded-2xl flex flex-col justify-between space-y-6 transition-all hover:-translate-y-1">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                      <Filter className="w-6 h-6" />
                    </div>
                    <h2 className="text-lg font-bold text-white leading-tight">
                      AI & Rule-Based Smart Data Filtering
                    </h2>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Intelligently clean, transform, and refine datasets using AI models & custom rules. Automate data quality & preparation.
                  </p>

                  <div className="flex items-center space-x-3 pt-2 text-purple-300">
                    <Database className="w-4 h-4" />
                    <Cpu className="w-4 h-4" />
                    <Terminal className="w-4 h-4" />
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab("data")}
                  className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white border border-white/20 transition-all"
                >
                  Explore Data Engine
                </button>
              </div>

              {/* Card 3: Interactive Dashboards */}
              <div className="glass-card glass-card-glow-pink p-6 rounded-2xl flex flex-col justify-between space-y-6 transition-all hover:-translate-y-1">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 rounded-xl bg-pink-500/20 text-pink-400 border border-pink-500/30">
                      <BarChart3 className="w-6 h-6" />
                    </div>
                    <h2 className="text-lg font-bold text-white leading-tight">
                      Power BI & Tableau Style Interactive Dashboards
                    </h2>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Build stunning, interactive visualizations & dynamic reports. Connect live data, customize layouts & share insights.
                  </p>

                  <div className="flex items-center space-x-3 pt-2 text-pink-300">
                    <BarChart3 className="w-4 h-4" />
                    <Layers className="w-4 h-4" />
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab("dashboard")}
                  className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white border border-white/20 transition-all"
                >
                  Build Dashboards
                </button>
              </div>

            </div>

            {/* Platform Overview Bottom Section */}
            <div className="text-center space-y-2 pt-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Platform Overview</span>
              <div className="flex justify-center items-center space-x-4 text-slate-400">
                <Code2 className="w-4 h-4 hover:text-white transition-colors" />
                <Cpu className="w-4 h-4 hover:text-white transition-colors" />
                <BarChart3 className="w-4 h-4 hover:text-white transition-colors" />
                <Layers className="w-4 h-4 hover:text-white transition-colors" />
              </div>
            </div>

          </section>
        )}

        {/* Workspace views */}
        {activeTab === "compiler" && <CodeCompiler />}
        {activeTab === "data" && <DataFilter />}
        {activeTab === "dashboard" && <DashboardBuilder />}
      </main>

      <Footer />
    </div>
  );
}