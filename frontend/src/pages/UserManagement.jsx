// frontend/src/pages/UserManagement.jsx

import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { 
  Users, 
  Search, 
  Trash2, 
  UserCheck, 
  UserX, 
  ShieldCheck, 
  RefreshCw, 
  AlertCircle,
  Filter 
} from 'lucide-react';

const UserManagement = () => {
  const { authFetch, triggerToast, user: currentUser } = useContext(AuthContext);

  // Component states
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  
  // Action submitting states
  const [actionUserId, setActionUserId] = useState(null);

  // Fetch all users from backend API
  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Build search query params dynamically
      const queryParams = new URLSearchParams();
      if (searchQuery) queryParams.append('search', searchQuery);
      if (selectedRole) queryParams.append('role', selectedRole);

      const res = await authFetch(`/auth/users?${queryParams.toString()}`);
      if (res.status === 200) {
        const data = await res.json();
        setUsersList(data);
      } else {
        triggerToast('Failed to load users list.', 'error');
      }
    } catch (err) {
      console.error('Error fetching users:', err.message);
      triggerToast('Server connection error.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount or when search/filter inputs change
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchUsers();
    }, 300); // 300ms debounce to avoid spamming the backend during typing

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, selectedRole]);

  // Handler to update a user's role
  const handleRoleChange = async (userId, targetRole) => {
    setActionUserId(userId);
    try {
      const res = await authFetch(`/auth/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: targetRole }),
      });

      if (res.status === 200) {
        triggerToast('User role updated successfully!', 'success');
        fetchUsers(); // Refresh the list
      } else {
        const errData = await res.json();
        triggerToast(errData.message || 'Failed to update user role.', 'error');
      }
    } catch (err) {
      console.error('Error promoting user:', err.message);
      triggerToast('Server connection error.', 'error');
    } finally {
      setActionUserId(null);
    }
  };

  // Handler to toggle account activation status
  const handleStatusToggle = async (userId, currentStatus) => {
    setActionUserId(userId);
    try {
      const res = await authFetch(`/auth/users/${userId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (res.status === 200) {
        const actionText = !currentStatus ? 'activated' : 'deactivated';
        triggerToast(`User account successfully ${actionText}!`, 'success');
        fetchUsers(); // Refresh the list
      } else {
        const errData = await res.json();
        triggerToast(errData.message || 'Failed to toggle user status.', 'error');
      }
    } catch (err) {
      console.error('Error toggling user status:', err.message);
      triggerToast('Server connection error.', 'error');
    } finally {
      setActionUserId(null);
    }
  };

  // Handler to delete a user account
  const handleDeleteUser = async (userId, userEmail) => {
    if (!window.confirm(`Are you absolutely sure you want to permanently delete the user account for "${userEmail}"? This action cannot be undone.`)) {
      return;
    }

    setActionUserId(userId);
    try {
      const res = await authFetch(`/auth/users/${userId}`, {
        method: 'DELETE',
      });

      if (res.status === 200) {
        triggerToast('User account deleted successfully.', 'success');
        fetchUsers(); // Refresh the list
      } else {
        const errData = await res.json();
        triggerToast(errData.message || 'Failed to delete user account.', 'error');
      }
    } catch (err) {
      console.error('Error deleting user:', err.message);
      triggerToast('Server connection error.', 'error');
    } finally {
      setActionUserId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Page Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 font-sans">User Access Management</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Promote, demote, activate, or deactivate platform staff accounts.</p>
        </div>
        <button
          onClick={fetchUsers}
          className="flex items-center justify-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm font-semibold shadow-sm transition-all shrink-0 cursor-pointer"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* 2. Search & Filtering Dashboard dossier */}
      <div className="grid gap-4 md:grid-cols-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
        {/* Search input field */}
        <div className="relative md:col-span-2">
          <Search className="absolute left-4 top-3.5 h-4.5 w-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search users by name or email address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-950/20 py-3 pl-11 pr-4 text-sm outline-none focus:border-primary-500 focus:bg-white transition-all dark:text-white"
          />
        </div>

        {/* Role filtering dropdown */}
        <div className="relative">
          <Filter className="absolute left-4 top-3.5 h-4.5 w-4.5 text-slate-400" />
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full appearance-none rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-950/20 py-3 pl-11 pr-4 text-sm outline-none focus:border-primary-500 focus:bg-white transition-all dark:text-white cursor-pointer"
          >
            <option value="">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="STAFF">Staff</option>
            <option value="VIEWER">Viewer</option>
          </select>
        </div>
      </div>

      {/* 3. Users list data grid */}
      <div className="glass-card overflow-hidden">
        {loading && usersList.length === 0 ? (
          <div className="flex justify-center items-center py-24">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
          </div>
        ) : usersList.length === 0 ? (
          <div className="py-24 text-center text-slate-400 space-y-3">
            <AlertCircle className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="text-sm font-semibold">No registered users matched your criteria.</p>
            <p className="text-xs text-slate-500">Try adjusting your filters or search keywords.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <th className="px-6 py-4">User Details</th>
                  <th className="px-6 py-4">Active Role</th>
                  <th className="px-6 py-4">Account Status</th>
                  <th className="px-6 py-4">Created On</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
                {usersList.map((item) => {
                  const isSelf = item.id === currentUser?.id;
                  const isDisabled = actionUserId !== null;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-950/10 transition-colors">
                      {/* Name & Email Details */}
                      <td className="px-6 py-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 dark:text-slate-100">{item.name}</span>
                            {isSelf && (
                              <span className="rounded-md bg-primary-100 dark:bg-primary-950/30 text-[10px] font-bold text-primary-700 dark:text-primary-400 px-1.5 py-0.5">
                                You
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">{item.email}</span>
                        </div>
                      </td>

                      {/* Role selection dropdown */}
                      <td className="px-6 py-4">
                        {isSelf ? (
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg w-fit">
                            <ShieldCheck className="h-4 w-4 text-primary-500" />
                            <span>{item.role}</span>
                          </div>
                        ) : (
                          <select
                            disabled={isDisabled}
                            value={item.role}
                            onChange={(e) => handleRoleChange(item.id, e.target.value)}
                            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-950/30 px-2.5 py-1.5 text-xs font-semibold focus:border-primary-500 outline-none cursor-pointer disabled:opacity-50 dark:text-white"
                          >
                            <option value="ADMIN">Admin</option>
                            <option value="STAFF">Staff</option>
                            <option value="VIEWER">Viewer</option>
                          </select>
                        )}
                      </td>

                      {/* Account Status Badge */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide ${
                          item.isActive 
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' 
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${item.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          <span>{item.isActive ? 'Active' : 'Suspended'}</span>
                        </span>
                      </td>

                      {/* Created On timestamp */}
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs">
                        {new Date(item.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>

                      {/* Deactivate/Delete Actions */}
                      <td className="px-6 py-4 text-right space-x-2.5">
                        {/* Toggle active status check */}
                        <button
                          disabled={isSelf || isDisabled}
                          onClick={() => handleStatusToggle(item.id, item.isActive)}
                          title={item.isActive ? 'Deactivate User account' : 'Activate User account'}
                          className={`p-1.5 rounded-lg border transition-all cursor-pointer inline-flex items-center justify-center ${
                            isSelf
                              ? 'opacity-40 cursor-not-allowed border-slate-100 dark:border-slate-800 text-slate-300 dark:text-slate-700'
                              : item.isActive
                              ? 'border-rose-100 hover:bg-rose-50 dark:border-rose-950/30 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-400'
                              : 'border-emerald-100 hover:bg-emerald-50 dark:border-emerald-950/30 dark:hover:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {item.isActive ? <UserX className="h-4.5 w-4.5" /> : <UserCheck className="h-4.5 w-4.5" />}
                        </button>

                        {/* Delete button */}
                        <button
                          disabled={isSelf || isDisabled}
                          onClick={() => handleDeleteUser(item.id, item.email)}
                          title="Delete User permanently"
                          className={`p-1.5 rounded-lg border transition-all cursor-pointer inline-flex items-center justify-center ${
                            isSelf
                              ? 'opacity-40 cursor-not-allowed border-slate-100 dark:border-slate-800 text-slate-300 dark:text-slate-700'
                              : 'border-slate-200 hover:bg-red-50 dark:border-slate-700 dark:hover:bg-red-950/20 hover:border-red-200 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400'
                          }`}
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
