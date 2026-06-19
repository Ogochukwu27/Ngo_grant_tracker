// frontend/src/pages/Notifications.jsx

import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Bell, RefreshCw, Eye, AlertCircle, Mail, ExternalLink } from 'lucide-react';

const Notifications = () => {
  const { authFetch } = useContext(AuthContext);

  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Scanner status states
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  // Fetch all in-app notifications
  const fetchNotifications = async () => {
    try {
      const res = await authFetch('/followups/notifications');
      if (res.status === 200) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Mark a notification as read
  const handleMarkAsRead = async (notificationId) => {
    try {
      const res = await authFetch(`/followups/notifications/${notificationId}/read`, {
        method: 'PUT',
      });

      if (res.status === 200) {
        // Update local list state directly to avoid running a full re-fetch
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
        );
      }
    } catch (err) {
      console.error('Error marking read:', err.message);
    }
  };

  // Trigger the database check for overdue assessments
  const handleTriggerScanner = async () => {
    setScanning(true);
    setScanResult(null);
    try {
      const res = await authFetch('/followups/check-overdue', {
        method: 'POST',
      });

      if (res.status === 200) {
        const resultData = await res.json();
        setScanResult(resultData);
        // Reload notifications to capture new "Overdue" alerts
        fetchNotifications();
      }
    } catch (err) {
      console.error('Failed to execute scanner:', err.message);
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 font-sans">Notification Inbox</h2>
          <p className="text-sm text-slate-500">Monitor automated alerts, reminders, and follow-up schedules.</p>
        </div>

        {/* Trigger Scanner check button */}
        <button
          onClick={handleTriggerScanner}
          disabled={scanning}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary-500 hover:bg-primary-400 disabled:bg-primary-500/50 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary-500/10 transition-all shrink-0 cursor-pointer"
        >
          <RefreshCw className={`h-4 w-4 ${scanning ? 'animate-spin' : ''}`} />
          <span>{scanning ? 'Scanning...' : 'Trigger Overdue Scanner'}</span>
        </button>
      </div>

      {/* Scanner Results Banner (Dispatched Emails lists) */}
      {scanResult && (
        <div className="rounded-2xl border border-primary-200 bg-primary-50/20 p-6 space-y-4">
          <div className="flex items-start gap-3 text-primary-800">
            <CheckCircleIcon className="h-6 w-6 text-primary-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-base font-bold">Scanner check complete</h4>
              <p className="text-sm text-slate-600 mt-1">{scanResult.message}</p>
            </div>
          </div>

          {scanResult.emailsSent && scanResult.emailsSent.length > 0 && (
            <div className="space-y-2.5 pt-3 border-t border-primary-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Dispatched Email Alerts (Ethereal Dev Sandbox):
              </span>
              <div className="grid gap-3 sm:grid-cols-2">
                {scanResult.emailsSent.map((email, idx) => (
                  <div key={idx} className="flex items-center justify-between border border-primary-100 rounded-xl p-3 bg-white shadow-sm shadow-primary-100/35">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-700 truncate">{email.beneficiary}</p>
                      <span className="text-[10px] font-medium text-slate-400 truncate block">Sent to: {email.emailSentTo}</span>
                    </div>
                    
                    <a
                      href={email.previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-500 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg shrink-0 transition-all cursor-pointer"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span>View Mail</span>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Alerts Feed */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 pb-4 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
          <Bell className="h-4 w-4" />
          <span>System Alerts History</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
            <AlertCircle className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold">No notifications logged.</p>
            <p className="text-xs text-slate-400 mt-1">Scheduled actions and overdue scanners will generate alerts here.</p>
          </div>
        ) : (
          <div className="mt-4 divide-y divide-slate-100">
            {notifications.map((item) => (
              <div
                key={item.id}
                onClick={() => !item.isRead && handleMarkAsRead(item.id)}
                className={`py-4 px-3 flex items-start gap-4 rounded-xl transition-all cursor-pointer ${
                  !item.isRead
                    ? 'bg-primary-50/30 hover:bg-primary-50/50'
                    : 'hover:bg-slate-50/50'
                }`}
              >
                {/* Unread dot indicator */}
                <div className="shrink-0 mt-2">
                  <span
                    className={`block h-2.5 w-2.5 rounded-full ${
                      !item.isRead ? 'bg-primary-500 animate-pulse' : 'bg-slate-200'
                    }`}
                  ></span>
                </div>

                {/* Alert details */}
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-800">{item.title}</span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {new Date(item.createdAt).toLocaleDateString()} at{' '}
                      {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">{item.message}</p>
                </div>

                {/* Quick dismiss icon */}
                {!item.isRead && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Stop click event from bubbling up to division onClick
                      handleMarkAsRead(item.id);
                    }}
                    className="text-slate-400 hover:text-primary-600 p-1.5 rounded-lg hover:bg-white border border-transparent hover:border-slate-100 transition-all shrink-0"
                    title="Mark as Read"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Internal icon component helper
const CheckCircleIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

export default Notifications;
