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

  // BROWSER & MOBILE BACK BUTTON SUPPORT FIX
  useEffect(() => {
    if (isFullscreen) {
      window.history.pushState({ modalOpen: true }, "");

      const handlePopState = () => {
        setIsFullscreen(false);
      };

      window.addEventListener("popstate", handlePopState);

      return () => {
        window.removeEventListener("popstate", handlePopState);
      };
    }
  }, [isFullscreen]);

  const closeFullscreen = () => {
    if (window.history.state?.modalOpen) {
      window.history.back();
    } else {
      setIsFullscreen(false);
    }
  };

  // File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const fileExt = file.name.split(".").pop()?.toLowerCase();

    const processData = (parsedData: DatasetRow[]) => {
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

  // Clean and Aggregate Chart Data
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

  // Chart Rendering Engine
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
              {fileName ? `Active Dataset: ${fileName}` : "Upload Dataset File (.csv / .xlsx)"}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Upload file and select your desired X and Y Axis to visualize
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
              File upload karein aur apne pasand ke columns select karke chart dekhein.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Master Control Panel */}
          <div className="glass-card rounded-2xl border border-white/10 bg-slate-950/90 p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-purple-400" />
                <h2 className="text-base font-bold text-white">Master Analytics Studio</h2>
                <span className="text-xs text-slate-500 font-mono">
                  ({dataset.length} total rows)
                </span>
              </div>

              {xAxis && yAxis && (
                <button
                  type="button"
                  onClick={() => setIsFullscreen(true)}
                  className="flex items-center space-x-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-purple-600/20 cursor-pointer"
                >
                  <Maximize2 className="w-4 h-4" />
                  <span>Full Screen Chart</span>
                </button>
              )}
            </div>

            {/* Customization Options Row */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 bg-slate-900/80 p-3.5 rounded-xl border border-white/5 text-xs">
              <div>
                <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">X-Axis (Category)</label>
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
                <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Y-Axis (Value)</label>
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
                <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Theme Color</label>
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

            {/* MAIN CHART CONTAINER */}
            <div className="w-full h-[500px] bg-slate-950/60 p-4 rounded-2xl border border-white/5 relative flex items-center justify-center">
              {!xAxis || !yAxis ? (
                <div className="text-center space-y-2 text-slate-500">
                  <Filter className="w-8 h-8 mx-auto stroke-1" />
                  <p className="text-sm font-medium">Please select X-Axis and Y-Axis columns above to generate chart</p>
                </div>
              ) : (
                renderMasterChart()
              )}
            </div>
          </div>
        </div>
      )}

      {/* FULLSCREEN MODAL OVERLAY WITH BROWSER BACK BUTTON SUPPORT */}
      {isFullscreen && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-3xl p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={closeFullscreen}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg shadow-purple-600/30"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Studio</span>
              </button>

              <div>
                <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-purple-400" />
                  <span>{yAxis} by {xAxis} ({aggregation.toUpperCase()})</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Full-screen interactive view ({chartData.length} items aggregated)
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={closeFullscreen}
              className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-white/10 rounded-xl transition-all cursor-pointer"
              title="Close Fullscreen"
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