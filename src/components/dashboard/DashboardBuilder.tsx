"use client";

import React, { useState, useMemo, useEffect } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import {
  Upload,
  BarChart3,
  Maximize2,
  SlidersHorizontal,
  FileSpreadsheet,
  ArrowLeft,
  X,
  Filter,
  Home,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Brush,
} from "recharts";

interface DatasetRow {
  [key: string]: any;
}

type ChartType = "bar" | "line" | "area" | "pie";
type AggregationType = "sum" | "avg" | "count" | "max" | "min";

const COLOR_PALETTES: Record<string, string> = {
  Purple: "#a855f7",
  Cyan: "#06b6d4",
  Emerald: "#10b981",
  Amber: "#f59e0b",
  Rose: "#f43f5e",
  Blue: "#3b82f6",
};

const PIE_COLORS = [
  "#a855f7",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#f43f5e",
  "#3b82f6",
  "#ec4899",
  "#8b5cf6",
];

export const DashboardBuilder: React.FC = () => {
  const [dataset, setDataset] = useState<DatasetRow[]>([]);
  const [fileName, setFileName] = useState<string>("");

  // Chart Configuration States
  const [chartType, setChartType] = useState<ChartType>("bar");
  const [xAxis, setXAxis] = useState<string>("");
  const [yAxis, setYAxis] = useState<string>("");
  const [aggregation, setAggregation] = useState<AggregationType>("sum");
  const [colorTheme, setColorTheme] = useState<string>("Purple");

  // Visual Customization Toggles
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showTooltip, setShowTooltip] = useState<boolean>(true);
  const [showLegend, setShowLegend] = useState<boolean>(true);
  const [enableZoomSlider, setEnableZoomSlider] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // STEP-BY-STEP HISTORY SUPPORT (Fixes total site exit on back button)
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // Step 1: If Fullscreen Modal is active, close only fullscreen
      if (isFullscreen) {
        setIsFullscreen(false);
        return;
      }
      // Step 2: If Dataset is loaded, reset to blank Home view
      if (dataset.length > 0) {
        setDataset([]);
        setFileName("");
        setXAxis("");
        setYAxis("");
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isFullscreen, dataset.length]);

  // Open Fullscreen Modal with Browser History Stack Entry
  const openFullscreenMode = () => {
    window.history.pushState({ view: "fullscreen" }, "");
    setIsFullscreen(true);
  };

  // Close Fullscreen (Goes 1 step back in history)
  const closeFullscreenMode = () => {
    setIsFullscreen(false);
    if (window.history.state?.view === "fullscreen") {
      window.history.back();
    }
  };

  // ONE STEP BACK BUTTON HANDLER
  const handleStepBack = () => {
    if (isFullscreen) {
      closeFullscreenMode();
    } else if (dataset.length > 0) {
      // Reset dataset & configurations to initial step
      setDataset([]);
      setFileName("");
      setXAxis("");
      setYAxis("");
    } else {
      // Go back in browser if already on home step
      window.history.back();
    }
  };

  // GUARANTEED WORKING HOME BUTTON HANDLER
  const handleGoHome = () => {
    setIsFullscreen(false);
    setDataset([]);
    setFileName("");
    setXAxis("");
    setYAxis("");
    // Redirect to home root URL seamlessly
    window.location.href = "/";
  };

  // File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const fileExt = file.name.split(".").pop()?.toLowerCase();

    const processData = (parsedData: DatasetRow[]) => {
      // Add history entry so browser back button steps back smoothly
      window.history.pushState({ view: "dataset" }, "");
      setDataset(parsedData);
      setXAxis("");
      setYAxis("");
    };

    if (fileExt === "csv") {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        complete: (results) => processData(results.data as DatasetRow[]),
      });
    } else if (fileExt === "xlsx" || fileExt === "xls") {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: "binary" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const parsedData = XLSX.utils.sheet_to_json(worksheet) as DatasetRow[];
        processData(parsedData);
      };
      reader.readAsBinaryString(file);
    }
  };

  const columns = useMemo(() => (dataset.length > 0 ? Object.keys(dataset[0]) : []), [dataset]);

  // Aggregated Data Calculation
  const chartData = useMemo(() => {
    if (!dataset.length || !xAxis || !yAxis) return [];

    const map = new Map<string, { sum: number; count: number; max: number; min: number }>();

    dataset.forEach((row) => {
      const rawX = row[xAxis];
      const xVal = rawX !== null && rawX !== undefined ? String(rawX).trim() : "N/A";

      let rawY = row[yAxis];
      if (typeof rawY === "string") {
        rawY = parseFloat(rawY.replace(/[^0-9.-]+/g, ""));
      }
      const yVal = typeof rawY === "number" && !isNaN(rawY) ? rawY : 0;

      if (!map.has(xVal)) {
        map.set(xVal, { sum: yVal, count: 1, max: yVal, min: yVal });
      } else {
        const curr = map.get(xVal)!;
        map.set(xVal, {
          sum: curr.sum + yVal,
          count: curr.count + 1,
          max: Math.max(curr.max, yVal),
          min: Math.min(curr.min, yVal),
        });
      }
    });

    const result = Array.from(map.entries()).map(([label, stats]) => {
      let value = stats.sum;
      if (aggregation === "avg") value = stats.count > 0 ? stats.sum / stats.count : 0;
      if (aggregation === "count") value = stats.count;
      if (aggregation === "max") value = stats.max;
      if (aggregation === "min") value = stats.min;

      return {
        name: label,
        value: Number(value.toFixed(2)),
      };
    });

    if (chartType === "pie") {
      return result.sort((a, b) => b.value - a.value).slice(0, 15);
    }

    return result;
  }, [dataset, xAxis, yAxis, aggregation, chartType]);

  const activeColor = COLOR_PALETTES[colorTheme] || COLOR_PALETTES.Purple;

  // Custom Dark Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-purple-500/40 p-3 rounded-xl shadow-2xl backdrop-blur-xl text-xs space-y-1 z-[10000]">
          <p className="font-bold text-white border-b border-white/10 pb-1">{`${xAxis}: ${label ?? payload[0].name}`}</p>
          <p className="text-purple-300 font-mono">
            {`${yAxis} (${aggregation.toUpperCase()}): `}
            <span className="font-extrabold text-white text-sm ml-1">
              {payload[0].value.toLocaleString()}
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Render Master Chart Function
  const renderMasterChart = (inFullscreen = false) => {
    if (!chartData.length) return null;

    if (chartType === "pie") {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            {showLegend && <Legend wrapperStyle={{ fontSize: "12px", color: "#94a3b8" }} />}
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={inFullscreen ? 200 : 120}
              innerRadius={inFullscreen ? 80 : 40}
              paddingAngle={2}
              label={({ name, percent }: any) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
            >
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === "line") {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 60 }}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />}
            <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} angle={-30} textAnchor="end" interval="preserveStartEnd" />
            <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            {showLegend && <Legend wrapperStyle={{ paddingTop: "10px" }} />}
            <Line type="monotone" dataKey="value" name={yAxis} stroke={activeColor} strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 8 }} />
            {enableZoomSlider && <Brush dataKey="name" height={28} stroke={activeColor} fill="#0f172a" />}
          </LineChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === "area") {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 60 }}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />}
            <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} angle={-30} textAnchor="end" interval="preserveStartEnd" />
            <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            {showLegend && <Legend wrapperStyle={{ paddingTop: "10px" }} />}
            <Area type="monotone" dataKey="value" name={yAxis} stroke={activeColor} fill={activeColor} fillOpacity={0.3} strokeWidth={2.5} />
            {enableZoomSlider && <Brush dataKey="name" height={28} stroke={activeColor} fill="#0f172a" />}
          </AreaChart>
        </ResponsiveContainer>
      );
    }

    // Default: Bar Chart
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 60 }}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />}
          <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} angle={-30} textAnchor="end" interval="preserveStartEnd" />
          <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
          {showTooltip && <Tooltip content={<CustomTooltip />} />}
          {showLegend && <Legend wrapperStyle={{ paddingTop: "10px" }} />}
          <Bar dataKey="value" name={yAxis} fill={activeColor} radius={[6, 6, 0, 0]} />
          {enableZoomSlider && <Brush dataKey="name" height={28} stroke={activeColor} fill="#0f172a" />}
        </BarChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="space-y-6 text-slate-200">
      {/* GLOBAL WORKING NAVIGATION HEADER */}
      <div className="flex items-center justify-between bg-slate-900/90 p-3 rounded-2xl border border-white/10 backdrop-blur-md shadow-lg sticky top-2 z-40">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={handleStepBack}
            className="flex items-center space-x-2 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl text-xs font-semibold transition-all border border-white/10 active:scale-95 cursor-pointer shadow-md"
            title="Go 1 Step Back"
          >
            <ArrowLeft className="w-4 h-4 text-purple-400" />
            <span>Back</span>
          </button>

          <span className="text-xs text-slate-400 font-medium hidden sm:inline-block">
            {fileName ? `File: ${fileName}` : "DataCode Studio"}
          </span>
        </div>

        <button
          type="button"
          onClick={handleGoHome}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white border border-purple-400/30 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-md shadow-purple-600/20"
          title="Go to Home Page"
        >
          <Home className="w-4 h-4" />
          <span>Home</span>
        </button>
      </div>

      {/* File Upload Banner */}
      <div className="border-2 border-dashed border-white/20 hover:border-purple-500/50 transition-all rounded-2xl p-6 text-center bg-slate-900/40 backdrop-blur-md relative group">
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileUpload}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
        />
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="p-3 bg-purple-500/10 rounded-full group-hover:scale-110 transition-transform">
            <Upload className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">
              {fileName ? `Active File: ${fileName}` : "Upload Dataset File (.csv / .xlsx)"}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Click or drag file here to change dataset
            </p>
          </div>
        </div>
      </div>

      {dataset.length === 0 ? (
        <div className="glass-card rounded-2xl border border-white/10 p-16 text-center bg-slate-950/60 flex flex-col items-center justify-center space-y-4">
          <div className="p-5 bg-slate-900 rounded-2xl border border-white/10 text-slate-500">
            <FileSpreadsheet className="w-10 h-10 stroke-[1.5]" />
          </div>
          <div className="max-w-md">
            <h3 className="text-base font-semibold text-white">No Dataset Loaded</h3>
            <p className="text-xs text-slate-400 mt-1">
              CSV ya Excel file upload karein aur custom charts generate karein.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="glass-card rounded-2xl border border-white/10 bg-slate-950/90 p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-purple-400" />
                <h2 className="text-base font-bold text-white">Analytics Studio</h2>
                <span className="text-xs text-slate-500 font-mono">
                  ({dataset.length} rows)
                </span>
              </div>

              {xAxis && yAxis && (
                <button
                  type="button"
                  onClick={openFullscreenMode}
                  className="flex items-center space-x-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-purple-600/20 cursor-pointer"
                >
                  <Maximize2 className="w-4 h-4" />
                  <span>Full Screen View</span>
                </button>
              )}
            </div>

            {/* Config Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 bg-slate-900/80 p-3.5 rounded-xl border border-white/5 text-xs">
              <div>
                <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">X-Axis</label>
                <select
                  value={xAxis}
                  onChange={(e) => setXAxis(e.target.value)}
                  className="w-full bg-slate-950 text-white border border-white/10 rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:border-purple-500"
                >
                  <option value="">-- Select X-Axis --</option>
                  {columns.map((col) => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Y-Axis</label>
                <select
                  value={yAxis}
                  onChange={(e) => setYAxis(e.target.value)}
                  className="w-full bg-slate-950 text-white border border-white/10 rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:border-purple-500"
                >
                  <option value="">-- Select Y-Axis --</option>
                  {columns.map((col) => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Chart Type</label>
                <select
                  value={chartType}
                  onChange={(e) => setChartType(e.target.value as ChartType)}
                  className="w-full bg-slate-950 text-white border border-white/10 rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:border-purple-500"
                >
                  <option value="bar">Bar Chart</option>
                  <option value="line">Line Trend</option>
                  <option value="area">Area Chart</option>
                  <option value="pie">Pie Chart</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Aggregation</label>
                <select
                  value={aggregation}
                  onChange={(e) => setAggregation(e.target.value as AggregationType)}
                  className="w-full bg-slate-950 text-white border border-white/10 rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:border-purple-500"
                >
                  <option value="sum">Sum</option>
                  <option value="avg">Average</option>
                  <option value="count">Count</option>
                  <option value="max">Max</option>
                  <option value="min">Min</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Color Palette</label>
                <select
                  value={colorTheme}
                  onChange={(e) => setColorTheme(e.target.value)}
                  className="w-full bg-slate-950 text-white border border-white/10 rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:border-purple-500"
                >
                  {Object.keys(COLOR_PALETTES).map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Customization Toggles */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/40 px-4 py-2 rounded-xl text-xs text-slate-400 border border-white/5">
              <div className="flex items-center space-x-1.5 text-purple-400 font-semibold">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Customization Toggles:</span>
              </div>
              <div className="flex flex-wrap items-center gap-6">
                <label className="flex items-center space-x-2 cursor-pointer hover:text-white transition-colors">
                  <input
                    type="checkbox"
                    checked={showGrid}
                    onChange={(e) => setShowGrid(e.target.checked)}
                    className="accent-purple-500 rounded"
                  />
                  <span>Grid Lines</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer hover:text-white transition-colors">
                  <input
                    type="checkbox"
                    checked={showTooltip}
                    onChange={(e) => setShowTooltip(e.target.checked)}
                    className="accent-purple-500 rounded"
                  />
                  <span>Tooltips</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer hover:text-white transition-colors">
                  <input
                    type="checkbox"
                    checked={showLegend}
                    onChange={(e) => setShowLegend(e.target.checked)}
                    className="accent-purple-500 rounded"
                  />
                  <span>Legend</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer hover:text-white transition-colors">
                  <input
                    type="checkbox"
                    checked={enableZoomSlider}
                    onChange={(e) => setEnableZoomSlider(e.target.checked)}
                    className="accent-purple-500 rounded"
                  />
                  <span>Zoom Slider</span>
                </label>
              </div>
            </div>

            {/* Main Visualizer Area */}
            <div className="w-full h-[500px] bg-slate-950/60 p-4 rounded-2xl border border-white/5 relative flex items-center justify-center">
              {!xAxis || !yAxis ? (
                <div className="text-center space-y-2 text-slate-500">
                  <Filter className="w-8 h-8 mx-auto stroke-1" />
                  <p className="text-sm font-medium">Select X and Y Axis columns above to build chart</p>
                </div>
              ) : (
                renderMasterChart()
              )}
            </div>
          </div>
        </div>
      )}

      {/* FULLSCREEN MODAL */}
      {isFullscreen && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-3xl p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={closeFullscreenMode}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg shadow-purple-600/30"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Dashboard</span>
              </button>

              <div>
                <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-purple-400" />
                  <span>{yAxis} by {xAxis} ({aggregation.toUpperCase()})</span>
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={closeFullscreenMode}
              className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-white/10 rounded-xl transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="w-full h-[calc(100vh-140px)] pt-4">
            {renderMasterChart(true)}
          </div>
        </div>
      )}
    </div>
  );
};