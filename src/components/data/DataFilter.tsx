"use client";

import React, { useState, useMemo } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import {
  Upload,
  Table as TableIcon,
  Code,
  Filter,
  Search,
  Download,
  Database,
  ChevronLeft,
  ChevronRight,
  Play,
  RotateCcw,
} from "lucide-react";

interface DatasetRow {
  [key: string]: any;
}

export const DataFilter: React.FC = () => {
  const [rawDataset, setRawDataset] = useState<DatasetRow[]>([]);
  const [activeTab, setActiveTab] = useState<"table" | "nocode" | "sql" | "python">("table");
  const [fileName, setFileName] = useState<string>("");

  // Pagination States
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  // Global Search State
  const [globalSearch, setGlobalSearch] = useState<string>("");

  // No-Code Filter States
  const [selectedColumn, setSelectedColumn] = useState<string>("");
  const [filterOperator, setFilterOperator] = useState<string>("contains");
  const [filterValue, setFilterValue] = useState<string>("");

  // SQL & Python Query States
  const [sqlQuery, setSqlQuery] = useState<string>("SELECT * FROM dataset LIMIT 50");
  const [pythonCode, setPythonCode] = useState<string>(
    `# Dataset variable 'df' contains all rows as array of objects\nfiltered_data = [row for row in df if float(row.get('amount', 0)) > 100]\nresult = filtered_data`
  );
  const [queryResult, setQueryResult] = useState<DatasetRow[] | null>(null);
  const [queryError, setQueryError] = useState<string>("");

  // Handle CSV/XLSX File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const fileExt = file.name.split(".").pop()?.toLowerCase();

    if (fileExt === "csv") {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        complete: (results) => {
          const parsedData = results.data as DatasetRow[];
          setRawDataset(parsedData);
          setQueryResult(null);
          setCurrentPage(1);
          if (parsedData.length > 0) {
            const firstCol = Object.keys(parsedData[0])[0];
            setSelectedColumn(firstCol);
            setSqlQuery(`SELECT * FROM dataset WHERE ${firstCol} IS NOT NULL`);
          }
        },
      });
    } else if (fileExt === "xlsx" || fileExt === "xls") {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: "binary" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const parsedData = XLSX.utils.sheet_to_json(worksheet) as DatasetRow[];
        setRawDataset(parsedData);
        setQueryResult(null);
        setCurrentPage(1);
        if (parsedData.length > 0) {
          const firstCol = Object.keys(parsedData[0])[0];
          setSelectedColumn(firstCol);
          setSqlQuery(`SELECT * FROM dataset WHERE ${firstCol} IS NOT NULL`);
        }
      };
      reader.readAsBinaryString(file);
    }
  };

  // Extract Column Names
  const columns = useMemo(() => {
    const datasetToUse = queryResult || rawDataset;
    return datasetToUse.length > 0 ? Object.keys(datasetToUse[0]) : [];
  }, [rawDataset, queryResult]);

  // Compute Processed Dataset based on No-Code Filters & Global Search
  const filteredDataset = useMemo(() => {
    let dataset = queryResult || rawDataset;

    // Apply Global Search
    if (globalSearch.trim()) {
      const query = globalSearch.toLowerCase();
      dataset = dataset.filter((row) =>
        Object.values(row).some((val) =>
          String(val ?? "").toLowerCase().includes(query)
        )
      );
    }

    // Apply No-Code Specific Filter
    if (selectedColumn && filterValue.trim()) {
      dataset = dataset.filter((row) => {
        const cellValue = row[selectedColumn];
        if (cellValue === undefined || cellValue === null) return false;

        const cellStr = String(cellValue).toLowerCase();
        const targetStr = filterValue.toLowerCase();
        const cellNum = Number(cellValue);
        const targetNum = Number(filterValue);

        switch (filterOperator) {
          case "equals":
            return cellStr === targetStr;
          case "contains":
            return cellStr.includes(targetStr);
          case "greater_than":
            return !isNaN(cellNum) && cellNum > targetNum;
          case "less_than":
            return !isNaN(cellNum) && cellNum < targetNum;
          default:
            return true;
        }
      });
    }

    return dataset;
  }, [rawDataset, queryResult, globalSearch, selectedColumn, filterOperator, filterValue]);

  // Pagination Calculations
  const totalPages = Math.ceil(filteredDataset.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize;
    return filteredDataset.slice(startIdx, startIdx + pageSize);
  }, [filteredDataset, currentPage, pageSize]);

  // Run Local Pseudo SQL Query Engine
  const executeSQL = () => {
    setQueryError("");
    try {
      if (!sqlQuery.toLowerCase().includes("select")) {
        throw new Error("Only SELECT queries are supported.");
      }

      let result = [...rawDataset];

      // Handle simple WHERE clause
      const whereMatch = sqlQuery.match(/where\s+(.*?)(limit|$)/i);
      if (whereMatch) {
        const condition = whereMatch[1].trim();
        if (condition.includes("=")) {
          const [col, val] = condition.split("=").map((s) => s.trim().replace(/['"]/g, ""));
          result = result.filter((row) => String(row[col]) === val);
        } else if (condition.includes(">")) {
          const [col, val] = condition.split(">").map((s) => s.trim());
          result = result.filter((row) => Number(row[col]) > Number(val));
        } else if (condition.includes("<")) {
          const [col, val] = condition.split("<").map((s) => s.trim());
          result = result.filter((row) => Number(row[col]) < Number(val));
        }
      }

      // Handle LIMIT
      const limitMatch = sqlQuery.match(/limit\s+(\d+)/i);
      if (limitMatch) {
        const limit = parseInt(limitMatch[1], 10);
        result = result.slice(0, limit);
      }

      setQueryResult(result);
      setCurrentPage(1);
    } catch (err: any) {
      setQueryError(err.message || "Invalid SQL Query Syntax");
    }
  };

  // Run In-Browser Simple Python-Style Array Filtering
  const executePython = () => {
    setQueryError("");
    try {
      const df = rawDataset;
      const fn = new Function("df", `
        try {
          ${pythonCode.replace(/#/g, "//")}
          return typeof result !== 'undefined' ? result : df;
        } catch(e) {
          throw e;
        }
      `);
      const res = fn(df);
      if (Array.isArray(res)) {
        setQueryResult(res);
        setCurrentPage(1);
      } else {
        throw new Error("Python code must assign an array/list of objects to 'result'.");
      }
    } catch (err: any) {
      setQueryError(err.message || "Error executing Python script.");
    }
  };

  // Export Filtered Dataset to CSV
  const handleExportCSV = () => {
    if (filteredDataset.length === 0) return;
    const csv = Papa.unparse(filteredDataset);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `filtered_${fileName || "data"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 text-slate-200">
      {/* File Drag & Drop Upload Zone */}
      <div className="border-2 border-dashed border-white/20 hover:border-purple-500/50 transition-all rounded-2xl p-8 text-center bg-slate-900/40 backdrop-blur-md relative group">
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileUpload}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
        />
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="p-4 bg-purple-500/10 rounded-full group-hover:scale-110 transition-transform">
            <Upload className="w-8 h-8 text-purple-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">
              {fileName ? `Loaded: ${fileName}` : "Click or Drag & Drop CSV / XLSX Dataset"}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Parsed 100% locally in-browser via PapaParse & SheetJS Engine
            </p>
          </div>
        </div>
      </div>

      {rawDataset.length > 0 && (
        <div className="glass-card rounded-2xl border border-white/10 overflow-hidden bg-slate-950/80">
          {/* Top Mode Selector Tabs */}
          <div className="flex flex-wrap items-center justify-between border-b border-white/10 px-4 py-3 bg-slate-900/80 gap-3">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setActiveTab("table")}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "table" ? "bg-purple-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                <TableIcon className="w-4 h-4" />
                <span>Full Data Table</span>
              </button>

              <button
                onClick={() => setActiveTab("nocode")}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "nocode" ? "bg-purple-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                <Filter className="w-4 h-4" />
                <span>No-Code Filter</span>
              </button>

              <button
                onClick={() => setActiveTab("sql")}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "sql" ? "bg-purple-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                <Database className="w-4 h-4" />
                <span>SQL Query</span>
              </button>

              <button
                onClick={() => setActiveTab("python")}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "python" ? "bg-purple-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                <Code className="w-4 h-4" />
                <span>Python Code</span>
              </button>
            </div>

            <button
              onClick={handleExportCSV}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Filtered CSV</span>
            </button>
          </div>

          {/* NO-CODE FILTER CONTROLS PANEL */}
          {activeTab === "nocode" && (
            <div className="p-4 bg-slate-900/60 border-b border-white/10 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Select Column:
                </label>
                <select
                  value={selectedColumn}
                  onChange={(e) => setSelectedColumn(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  {columns.map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Condition Operator:
                </label>
                <select
                  value={filterOperator}
                  onChange={(e) => setFilterOperator(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="contains">Contains / Search</option>
                  <option value="equals">Exact Match (=)</option>
                  <option value="greater_than">Greater Than (&gt;)</option>
                  <option value="less_than">Less Than (&lt;)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Value to Filter:
                </label>
                <input
                  type="text"
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                  placeholder="Enter filter value..."
                  className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <button
                  onClick={() => {
                    setFilterValue("");
                    setGlobalSearch("");
                  }}
                  className="w-full flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Filters</span>
                </button>
              </div>
            </div>
          )}

          {/* SQL QUERY EDITOR PANEL */}
          {activeTab === "sql" && (
            <div className="p-4 bg-slate-900/60 border-b border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-purple-400">SQL Filter Query (Table Name: dataset)</span>
                <button
                  onClick={executeSQL}
                  className="flex items-center space-x-1.5 px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Execute SQL</span>
                </button>
              </div>
              <textarea
                value={sqlQuery}
                onChange={(e) => setSqlQuery(e.target.value)}
                rows={3}
                className="w-full bg-slate-950 font-mono text-xs p-3 rounded-lg border border-white/10 focus:outline-none focus:border-purple-500 text-purple-200"
              />
              {queryError && <p className="text-xs text-red-400 font-mono">{queryError}</p>}
            </div>
          )}

          {/* PYTHON CODE EDITOR PANEL */}
          {activeTab === "python" && (
            <div className="p-4 bg-slate-900/60 border-b border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-blue-400">Python Transformation Script (Input: df)</span>
                <button
                  onClick={executePython}
                  className="flex items-center space-x-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Run Python Filter</span>
                </button>
              </div>
              <textarea
                value={pythonCode}
                onChange={(e) => setPythonCode(e.target.value)}
                rows={4}
                className="w-full bg-slate-950 font-mono text-xs p-3 rounded-lg border border-white/10 focus:outline-none focus:border-blue-500 text-blue-200"
              />
              {queryError && <p className="text-xs text-red-400 font-mono">{queryError}</p>}
            </div>
          )}

          {/* GLOBAL SEARCH & PAGINATION HEADER BAR */}
          <div className="px-4 py-3 bg-slate-950 border-b border-white/10 flex flex-wrap items-center justify-between gap-4">
            <div className="relative flex-grow max-w-xs">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={globalSearch}
                onChange={(e) => {
                  setGlobalSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search across all rows..."
                className="w-full bg-slate-900 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex items-center space-x-4 text-xs font-mono text-slate-400">
              <span>
                Total Rows: <strong className="text-purple-400">{filteredDataset.length}</strong> / {rawDataset.length}
              </span>

              <div className="flex items-center space-x-2">
                <span>Rows per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-slate-900 border border-white/10 text-white rounded px-2 py-1 text-xs"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={500}>500</option>
                </select>
              </div>
            </div>
          </div>

          {/* FULL INTERACTIVE DATA TABLE VIEW */}
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider sticky top-0 z-10 border-b border-white/10">
                <tr>
                  <th className="py-3 px-4 border-r border-white/5 w-12 text-center">#</th>
                  {columns.map((col) => (
                    <th key={col} className="py-3 px-4 border-r border-white/5 font-semibold text-slate-300">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paginatedData.length > 0 ? (
                  paginatedData.map((row, index) => (
                    <tr key={index} className="hover:bg-purple-500/10 transition-colors">
                      <td className="py-2.5 px-4 text-slate-500 text-center border-r border-white/5">
                        {(currentPage - 1) * pageSize + index + 1}
                      </td>
                      {columns.map((col) => (
                        <td key={col} className="py-2.5 px-4 border-r border-white/5 text-slate-300 whitespace-nowrap">
                          {row[col] !== undefined && row[col] !== null ? String(row[col]) : "-"}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={columns.length + 1} className="py-8 text-center text-slate-500 font-sans">
                      No matching records found. Try resetting filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION FOOTER */}
          <div className="px-4 py-3 bg-slate-900 border-t border-white/10 flex items-center justify-between text-xs font-mono text-slate-400">
            <div>
              Showing page <strong className="text-white">{currentPage}</strong> of{" "}
              <strong className="text-white">{totalPages}</strong>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-white transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};