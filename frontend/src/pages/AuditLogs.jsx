// frontend/src/pages/AuditLogs.jsx

import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { 
  ClipboardList, 
  Search, 
  RefreshCw, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  AlertCircle,
  FileText 
} from 'lucide-react';

const AuditLogs = () => {
  const { authFetch, triggerToast } = useContext(AuthContext);

  // Pagination states
  const [logs, setLogs] = useState([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [logsPerPage] = useState(15);

  // Search & filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [loading, setLoading] = useState(true);

  // Action options for dropdown filter
  const actionOptions = [
    { label: 'All Actions', value: '' },
    { label: 'User Registration', value: 'USER_REGISTER' },
    { label: 'User Login', value: 'USER_LOGIN' },
    { label: 'Failed Login', value: 'FAILED_LOGIN' },
    { label: 'Password Update', value: 'PASSWORD_CHANGE' },
    { label: 'Role Change', value: 'USER_ROLE_CHANGE' },
    { label: 'Account Activation', value: 'USER_STATUS_CHANGE' },
    { label: 'User Deletion', value: 'USER_DELETE' },
    { label: 'Beneficiary Created', value: 'CREATE_BENEFICIARY' },
    { label: 'Beneficiary Updated', value: 'UPDATE_BENEFICIARY' },
    { label: 'Beneficiary Deleted', value: 'DELETE_BENEFICIARY' },
    { label: 'Support Log Created', value: 'CREATE_SUPPORT_LOG' },
    { label: 'Support Log Updated', value: 'EDIT_SUPPORT_LOG' },
    { label: 'Support Log Deleted', value: 'DELETE_SUPPORT_LOG' },
    { label: 'Evidence Uploaded', value: 'UPLOAD_EVIDENCE' },
    { label: 'Evidence Deleted', value: 'DELETE_EVIDENCE' },
    { label: 'Follow-Up Scheduled', value: 'CREATE_FOLLOW_UP' },
    { label: 'Follow-Up Completed', value: 'COMPLETE_FOLLOW_UP' },
    { label: 'Follow-Up Updated', value: 'UPDATE_FOLLOW_UP' },
  ];

  // Fetch audit logs from backend REST endpoint
  const fetchAuditLogs = async (pageNumber = 1) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('page', pageNumber);
      queryParams.append('limit', logsPerPage);
      
      if (searchQuery) queryParams.append('search', searchQuery);
      if (selectedAction) queryParams.append('action', selectedAction);

      const res = await authFetch(`/audit-logs?${queryParams.toString()}`);
      if (res.status === 200) {
        const data = await res.json();
        setLogs(data.logs);
        setTotalLogs(data.total);
        setTotalPages(data.pages);
        setCurrentPage(data.currentPage);
      } else {
        triggerToast('Failed to retrieve audit log entries.', 'error');
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err.message);
      triggerToast('Server connection error.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Reset page number on filter changes, then fetch
  useEffect(() => {
    setCurrentPage(1);
    const delayDebounceFn = setTimeout(() => {
      fetchAuditLogs(1);
    }, 300); // 300ms input debounce filter

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, selectedAction]);

  // Page switcher
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchAuditLogs(newPage);
    }
  };

  // Action badge colour styles helper
  const getActionBadgeClass = (action) => {
    if (action.includes('DELETE') || action.includes('FAILED')) {
      return 'bg-red-50 text-red-700 border-red-200/50 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30';
    }
    if (action.includes('CREATE') || action.includes('REGISTER') || action.includes('COMPLETE')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200/50 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30';
    }
    if (action.includes('EDIT') || action.includes('UPDATE') || action.includes('CHANGE')) {
      return 'bg-amber-50 text-amber-700 border-amber-200/50 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30';
    }
    return 'bg-slate-50 text-slate-700 border-slate-200/50 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800';
  };

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 font-sans">Security Audit Trail</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Track user logins, registration events, data modifications, and deletions.</p>
        </div>
        <button
          onClick={() => fetchAuditLogs(currentPage)}
          className="flex items-center justify-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm font-semibold shadow-sm transition-all shrink-0 cursor-pointer"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* 2. Filters & Searches Dashboard */}
      <div className="grid gap-4 md:grid-cols-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
        {/* Search Input bar */}
        <div className="relative md:col-span-2">
          <Search className="absolute left-4 top-3.5 h-4.5 w-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search logs by staff name, email, or action description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-950/20 py-3 pl-11 pr-4 text-sm outline-none focus:border-primary-500 focus:bg-white transition-all dark:text-white"
          />
        </div>

        {/* Action filter dropdown selection */}
        <div className="relative">
          <Filter className="absolute left-4 top-3.5 h-4.5 w-4.5 text-slate-400" />
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="w-full appearance-none rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-950/20 py-3 pl-11 pr-4 text-sm outline-none focus:border-primary-500 focus:bg-white transition-all dark:text-white cursor-pointer"
          >
            {actionOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. Audit logs data table view */}
      <div className="glass-card overflow-hidden">
        {loading && logs.length === 0 ? (
          <div className="flex justify-center items-center py-24">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-24 text-center text-slate-400 space-y-3">
            <AlertCircle className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="text-sm font-semibold">No audit logs found.</p>
            <p className="text-xs text-slate-500 font-medium">All logged transactions and administrative changes will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <th className="px-6 py-4">Timestamp (Date & Time)</th>
                  <th className="px-6 py-4">System Actor (User)</th>
                  <th className="px-6 py-4">Active Role</th>
                  <th className="px-6 py-4">Action Event</th>
                  <th className="px-6 py-4">Description (Details)</th>
                  <th className="px-6 py-4">Client IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
                {logs.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-950/10 transition-colors">
                    {/* Timestamp column */}
                    <td className="px-6 py-4 text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {new Date(item.createdAt).toLocaleString()}
                    </td>

                    {/* Actor Details column */}
                    <td className="px-6 py-4">
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-100">{item.userName}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 block">{item.userEmail}</span>
                      </div>
                    </td>

                    {/* User Role column */}
                    <td className="px-6 py-4">
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md">
                        {item.userRole}
                      </span>
                    </td>

                    {/* Action type column */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-lg border px-2 py-0.5 text-xs font-bold ${getActionBadgeClass(item.action)}`}>
                        {item.action}
                      </span>
                    </td>

                    {/* Description Details column */}
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-medium max-w-xs break-words">
                      {item.details}
                    </td>

                    {/* Client IP column */}
                    <td className="px-6 py-4 text-xs font-semibold text-slate-400 dark:text-slate-500 font-mono">
                      {item.ipAddress || 'unknown'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-5">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Showing Page <strong className="text-slate-700 dark:text-slate-200">{currentPage}</strong> of{' '}
            <strong className="text-slate-700 dark:text-slate-200">{totalPages}</strong> (Total: {totalLogs} logs)
          </span>

          <div className="flex gap-2">
            <button
              disabled={currentPage === 1 || loading}
              onClick={() => handlePageChange(currentPage - 1)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-350 hover:bg-slate-50 disabled:opacity-40 transition-all cursor-pointer"
            >
              <ChevronLeft className="h-4.5 w-4.5" />
            </button>
            <button
              disabled={currentPage === totalPages || loading}
              onClick={() => handlePageChange(currentPage + 1)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-350 hover:bg-slate-50 disabled:opacity-40 transition-all cursor-pointer"
            >
              <ChevronRight className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogs;
