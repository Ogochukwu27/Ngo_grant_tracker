// frontend/src/pages/Dashboard.jsx

import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import {
  Users,
  HeartHandshake,
  Calendar,
  TrendingUp,
  BarChart3,
  DollarSign,
  AlertCircle
} from 'lucide-react';

const Dashboard = () => {
  const { authFetch, formatMoney, currency } = useContext(AuthContext);

  // States for stats and charts data
  const [stats, setStats] = useState(null);
  const [spendingCategory, setSpendingCategory] = useState([]);
  const [spendingMonth, setSpendingMonth] = useState([]);
  const [loading, setLoading] = useState(true);

  // Hover states for interactive SVG charts
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [hoveredMonthIdx, setHoveredMonthIdx] = useState(null);

  // Fetch all analytics stats from the backend
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Run requests in parallel using Promise.all for speed and efficiency
      const [resStats, resCat, resMonth] = await Promise.all([
        authFetch('/analytics/stats'),
        authFetch('/analytics/spending-by-category'),
        authFetch('/analytics/spending-by-month')
      ]);

      if (resStats.status === 200) {
        const data = await resStats.json();
        setStats(data);
      }
      if (resCat.status === 200) {
        const data = await resCat.json();
        setSpendingCategory(data);
      }
      if (resMonth.status === 200) {
        const data = await resMonth.json();
        setSpendingMonth(data);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [currency]); // Re-fetch or re-evaluate formatting if currency selection updates

  // Loading spinner state fallback
  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  // Fallbacks if data retrieval failed
  const totalBeneficiaries = stats?.totalBeneficiaries || 0;
  const totalFundsDisbursed = stats?.totalFundsDisbursed || 0;
  const activeCases = stats?.activeCases || 0;
  const completedCases = stats?.completedCases || 0;
  const upcomingFollowUps = stats?.upcomingFollowUps || 0;

  // -------------------------------------------------------------
  // Chart Helper Calculations (Pure JS + Math)
  // -------------------------------------------------------------
  
  // Custom color palette for Category Slices (each sector has its own specific color)
  const categoryColorMap = {
    'Medical assistance': '#f43f5e', // Rose
    'Educational support': '#3b82f6', // Blue
    'Feeding support': '#f59e0b',     // Amber
    'Widow support': '#10b981',       // Emerald
    'Emergency assistance': '#8b5cf6', // Violet
  };
  
  const defaultCategoryColor = '#94a3b8'; // Slate/Grey fallback

  const getCategoryColor = (catName) => {
    return categoryColorMap[catName] || defaultCategoryColor;
  };

  // 1. Spending Category Bar Chart details
  const totalCategorySpending = spendingCategory.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const maxCategoryAmount = spendingCategory.length > 0
    ? Math.max(...spendingCategory.map(c => c.totalAmount), 1000)
    : 1000;

  // 2. Trend Area Chart details (scaling factors)
  const maxMonthAmount = spendingMonth.length > 0 
    ? Math.max(...spendingMonth.map(m => m.totalAmount), 1000) 
    : 1000;

  // Chart layout dimensions (viewbox: 500 x 200)
  const chartWidth = 500;
  const chartHeight = 200;
  const padLeft = 60;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 40;

  const innerW = chartWidth - padLeft - padRight;
  const innerH = chartHeight - padTop - padBottom;

  // Map month records into coordinate structures
  const trendPoints = spendingMonth.map((m, idx) => {
    const x = padLeft + (spendingMonth.length > 1 ? (idx / (spendingMonth.length - 1)) * innerW : innerW / 2);
    const y = chartHeight - padBottom - (m.totalAmount / maxMonthAmount) * innerH;
    return { x, y, ...m };
  });

  // Format path definitions
  const linePathD = trendPoints.length > 0
    ? trendPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
    : '';

  const areaPathD = trendPoints.length > 0
    ? `${linePathD} L ${trendPoints[trendPoints.length - 1].x} ${chartHeight - padBottom} L ${trendPoints[0].x} ${chartHeight - padBottom} Z`
    : '';

  // Format month label shorthand (e.g. "2026-06" -> "Jun")
  const formatMonthLabel = (yyyyMm) => {
    const [year, month] = yyyyMm.split('-');
    const date = new Date(year, parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'short' });
  };

  // Helper to get abbreviated category names for labels
  const getShortCategoryName = (catName) => {
    if (catName === 'Medical assistance') return 'Medical';
    if (catName === 'Educational support') return 'Education';
    if (catName === 'Feeding support') return 'Feeding';
    if (catName === 'Widow support') return 'Widow';
    if (catName === 'Emergency assistance') return 'Emergency';
    return catName;
  };

  return (
    <div className="space-y-8">
      {/* 1. Header welcome */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 font-sans">System Analytics Dashboard</h2>
          <p className="text-sm text-slate-500">Real-time indicators, spending metrics, and case logs aggregates.</p>
        </div>
      </div>

      {/* 2. Stat Cards Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        
        {/* Card A: Registered Beneficiaries */}
        <div className="glass-card hover-glow p-6 flex items-center gap-4 transition-all">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600 shadow-inner">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Beneficiaries</span>
            <h3 className="text-2xl font-extrabold text-slate-800 mt-0.5">{totalBeneficiaries}</h3>
          </div>
        </div>

        {/* Card B: Funds Disbursed */}
        <div className="glass-card hover-glow p-6 flex items-center gap-4 transition-all bg-gradient-to-br from-white to-primary-50/20">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600 shadow-inner">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Disbursed Funds</span>
            <h3 className="text-2xl font-extrabold text-primary-600 mt-0.5">{formatMoney(totalFundsDisbursed)}</h3>
          </div>
        </div>

        {/* Card C: Case Success Rate */}
        <div className="glass-card hover-glow p-6 flex items-center gap-4 transition-all">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shadow-inner">
            <HeartHandshake className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Cases Active / Resolved</span>
            <h3 className="text-xl font-extrabold text-slate-800 mt-0.5">
              {activeCases} <span className="text-xs font-semibold text-slate-400">Active</span> / {completedCases} <span className="text-xs font-semibold text-slate-400">Resolved</span>
            </h3>
          </div>
        </div>

        {/* Card D: Followup assessments */}
        <div className="glass-card hover-glow p-6 flex items-center gap-4 transition-all">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600 shadow-inner">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Upcoming Assessments</span>
            <h3 className="text-2xl font-extrabold text-slate-800 mt-0.5">{upcomingFollowUps}</h3>
          </div>
        </div>

      </div>

      {/* 3. Charts Row */}
      <div className="grid gap-8 lg:grid-cols-2">
        
        {/* Chart A: Spending Trends over Time */}
        <div className="glass-card p-6 flex flex-col justify-between min-h-[380px]">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-3">
              <TrendingUp className="h-4 w-4 text-primary-500" />
              <span>Monthly Funding Trends ({currency})</span>
            </div>
            
            <p className="text-[11px] text-slate-400 mt-2">
              Chronological support logs trends. Hover over coordinate nodes to display specific totals.
            </p>
          </div>

          <div className="flex-1 flex items-center justify-center py-4 relative">
            {spendingMonth.length === 0 ? (
              <div className="text-center text-slate-400 py-10 space-y-2">
                <AlertCircle className="h-8 w-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold">No trend logs found.</p>
                <p className="text-[10px] text-slate-400">Add financial assistance logs to seed chart vectors.</p>
              </div>
            ) : (
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full max-h-56">
                <defs>
                  {/* Beautiful Area Gradient */}
                  <linearGradient id="chartAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#feab32" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#feab32" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Horizontal grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((p, idx) => {
                  const y = padTop + p * innerH;
                  const amtVal = maxMonthAmount * (1 - p);
                  return (
                    <g key={idx} className="opacity-40">
                      <line
                        x1={padLeft}
                        y1={y}
                        x2={chartWidth - padRight}
                        y2={y}
                        stroke="#e2e8f0"
                        strokeDasharray="4 4"
                        strokeWidth="1"
                      />
                      <text
                        x={padLeft - 8}
                        y={y + 4}
                        textAnchor="end"
                        className="text-[9px] font-semibold fill-slate-400 font-sans"
                      >
                        {formatMoney(amtVal)}
                      </text>
                    </g>
                  );
                })}

                {/* Render filled Area */}
                <path d={areaPathD} fill="url(#chartAreaGrad)" />

                {/* Render plot Line */}
                <path
                  d={linePathD}
                  fill="none"
                  stroke="#feab32"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Plot Coordinate Nodes (Interactive Circles) */}
                {trendPoints.map((pt, idx) => (
                  <g key={idx}>
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={hoveredMonthIdx === idx ? 6 : 4}
                      fill={hoveredMonthIdx === idx ? '#feab32' : '#ffffff'}
                      stroke="#feab32"
                      strokeWidth="2.5"
                      className="transition-all cursor-pointer"
                      onMouseEnter={() => setHoveredMonthIdx(idx)}
                      onMouseLeave={() => setHoveredMonthIdx(null)}
                    />
                    
                    {/* X-Axis labels */}
                    <text
                      x={pt.x}
                      y={chartHeight - 15}
                      textAnchor="middle"
                      className="text-[9px] font-bold fill-slate-400 font-sans"
                    >
                      {formatMonthLabel(pt.month)}
                    </text>
                  </g>
                ))}
              </svg>
            )}

            {/* Hover Tooltip display */}
            {hoveredMonthIdx !== null && trendPoints[hoveredMonthIdx] && (
              <div className="absolute top-2 right-2 rounded-lg bg-slate-800 px-3 py-1.5 text-[10px] font-bold text-white shadow-md z-20">
                <span className="block text-slate-400">Total: {formatMoney(trendPoints[hoveredMonthIdx].totalAmount)}</span>
                <span className="block text-primary-400 mt-0.5">{trendPoints[hoveredMonthIdx].month}</span>
              </div>
            )}
          </div>
        </div>

        {/* Chart B: Spending by Category (Interactive Bar Chart with dynamic category coloring) */}
        <div className="glass-card p-6 flex flex-col justify-between min-h-[380px]">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-3">
              <BarChart3 className="h-4 w-4 text-primary-500" />
              <span>Disbursement Splits by Sector ({currency})</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Sectorized overview. Each category features a distinct color to identify maximum funding.
            </p>
          </div>

          <div className="flex-1 flex items-center justify-center py-4 relative">
            {spendingCategory.length === 0 ? (
              <div className="text-center text-slate-400 py-10 space-y-2">
                <AlertCircle className="h-8 w-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold">No category splits.</p>
                <p className="text-[10px] text-slate-400">Log disbursements to visualize charts.</p>
              </div>
            ) : (
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full max-h-56">
                
                {/* Horizontal grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((p, idx) => {
                  const y = padTop + p * innerH;
                  const amtVal = maxCategoryAmount * (1 - p);
                  return (
                    <g key={idx} className="opacity-40">
                      <line
                        x1={padLeft}
                        y1={y}
                        x2={chartWidth - padRight}
                        y2={y}
                        stroke="#e2e8f0"
                        strokeDasharray="4 4"
                        strokeWidth="1"
                      />
                      <text
                        x={padLeft - 8}
                        y={y + 4}
                        textAnchor="end"
                        className="text-[9px] font-semibold fill-slate-400 font-sans"
                      >
                        {formatMoney(amtVal)}
                      </text>
                    </g>
                  );
                })}

                {/* Render Bars for each category */}
                {spendingCategory.map((cat, idx) => {
                  const numCategories = spendingCategory.length;
                  const barSpacing = innerW / numCategories;
                  const barWidth = Math.min(32, barSpacing - 12);
                  const barX = padLeft + (idx * barSpacing) + (barSpacing - barWidth) / 2;
                  
                  const barHeight = (cat.totalAmount / maxCategoryAmount) * innerH;
                  const barY = chartHeight - padBottom - barHeight;
                  const barColor = getCategoryColor(cat.category);
                  const isHovered = hoveredCategory === cat.category;

                  return (
                    <g key={idx}>
                      {/* Interactive Bar Rect */}
                      <rect
                        x={barX}
                        y={barY}
                        width={barWidth}
                        height={barHeight}
                        fill={barColor}
                        opacity={hoveredCategory === null || isHovered ? 1 : 0.4}
                        rx="4"
                        className="transition-all duration-150 cursor-pointer"
                        onMouseEnter={() => setHoveredCategory(cat.category)}
                        onMouseLeave={() => setHoveredCategory(null)}
                      />

                      {/* Display value above bar on hover */}
                      {cat.totalAmount > 0 && (
                        <text
                          x={barX + barWidth / 2}
                          y={barY - 6}
                          textAnchor="middle"
                          className={`text-[8.5px] font-bold font-sans transition-all ${
                            isHovered ? 'fill-slate-800' : 'fill-slate-400'
                          }`}
                        >
                          {formatMoney(cat.totalAmount)}
                        </text>
                      )}

                      {/* X-Axis category labels */}
                      <text
                        x={barX + barWidth / 2}
                        y={chartHeight - 12}
                        textAnchor="middle"
                        className={`text-[9.5px] font-bold font-sans transition-all ${
                          isHovered ? 'fill-slate-850 scale-105' : 'fill-slate-400'
                        }`}
                        onMouseEnter={() => setHoveredCategory(cat.category)}
                        onMouseLeave={() => setHoveredCategory(null)}
                      >
                        {getShortCategoryName(cat.category)}
                      </text>
                    </g>
                  );
                })}
              </svg>
            )}

            {/* Hover Legend detail tooltip card */}
            {hoveredCategory !== null && (
              <div className="absolute top-2 right-2 rounded-lg bg-slate-800 px-3 py-1.5 text-[10px] font-bold text-white shadow-md z-20">
                <span className="block text-slate-300">{hoveredCategory}</span>
                <span className="block text-primary-300 mt-0.5">
                  Amount: {formatMoney(spendingCategory.find(c => c.category === hoveredCategory)?.totalAmount || 0)}
                </span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
