// frontend/src/pages/Beneficiaries.jsx

import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Plus, Search, SlidersHorizontal, MapPin, X, User } from 'lucide-react';

const Beneficiaries = () => {
  const { authFetch } = useContext(AuthContext);

  // Lists state
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter query states
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');

  // Modal form toggle
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');
  const [formCategory, setFormCategory] = useState('Medical assistance');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState('');
  const [registering, setRegistering] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  // Fetch beneficiaries based on current query states
  const fetchBeneficiaries = async () => {
    setLoading(true);
    try {
      // Construct query parameters
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (category) params.append('category', category);
      if (status) params.append('status', status);

      const res = await authFetch(`/beneficiaries?${params.toString()}`);
      if (res.status === 200) {
        const data = await res.json();
        setBeneficiaries(data);
      }
    } catch (err) {
      console.error('Failed to load beneficiaries:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Re-run search query whenever filters change (debounce not needed for simple study app)
  useEffect(() => {
    fetchBeneficiaries();
  }, [search, category, status]);

  // Handle Registration Form submission
  const handleRegister = async (e) => {
    e.preventDefault();
    setFormError('');
    setRegistering(true);

    if (!fullName || !phoneNumber || !location || !formCategory || !description || !selectedFile) {
      setFormError('Please fill in all required fields and upload a supporting document');
      setRegistering(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('fullName', fullName);
      formData.append('phoneNumber', phoneNumber);
      if (email) formData.append('email', email);
      formData.append('location', location);
      formData.append('category', formCategory);
      formData.append('description', description);
      formData.append('file', selectedFile);

      const res = await authFetch('/beneficiaries', {
        method: 'POST',
        body: formData,
      });

      if (res.status === 201) {
        // Success! Reload list, reset form, close modal
        fetchBeneficiaries();
        setShowModal(false);
        setFullName('');
        setPhoneNumber('');
        setEmail('');
        setLocation('');
        setDescription('');
        setSelectedFile(null);
      } else {
        const errData = await res.json();
        setFormError(errData.message || 'Failed to create record');
      }
    } catch (err) {
      console.error('Error during registration:', err.message);
      setFormError('Server error. Please try again.');
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Top Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Beneficiary Registry</h2>
          <p className="text-sm text-slate-500">Record, filter, and view case profiles for the organization.</p>
        </div>
        
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary-500 hover:bg-primary-400 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary-500/10 transition-all shrink-0"
        >
          <Plus className="h-5 w-5" />
          <span>Register Beneficiary</span>
        </button>
      </div>

      {/* 2. Filters & Searches Section */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 pb-4 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-100">
          <SlidersHorizontal className="h-4 w-4" />
          <span>Search & Filters</span>
        </div>
        
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {/* Real-time search name input */}
          <div className="relative">
            <Search className="absolute top-3 left-3 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search beneficiary name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 shadow-inner transition-all focus:border-primary-500 focus:bg-white focus:outline-none"
            />
          </div>

          {/* Category Dropdown */}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 shadow-inner focus:border-primary-500 focus:bg-white focus:outline-none"
          >
            <option value="">All Assistance Categories</option>
            <option value="Medical assistance">Medical Assistance</option>
            <option value="Educational support">Educational Support</option>
            <option value="Feeding support">Feeding Support</option>
            <option value="Widow support">Widow Support</option>
            <option value="Emergency assistance">Emergency Assistance</option>
          </select>

          {/* Status Dropdown */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 shadow-inner focus:border-primary-500 focus:bg-white focus:outline-none"
          >
            <option value="">All Case Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="RESOLVED">RESOLVED</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
        </div>
      </div>

      {/* 3. Beneficiaries List Registry View */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
          </div>
        ) : beneficiaries.length === 0 ? (
          <div className="py-20 text-center text-slate-500">
            <p className="text-base font-medium">No beneficiary records found.</p>
            <p className="mt-1 text-sm text-slate-400">Try adjusting your filters or register a new case profile.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Full Name</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">Phone Number</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Registered Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {beneficiaries.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/50 transition-all">
                    <td className="px-6 py-4 font-semibold text-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                          <User className="h-4 w-4" />
                        </div>
                        <span>{b.fullName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-500">{b.category}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        <span>{b.location}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{b.phoneNumber}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase ${
                          b.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-700'
                            : b.status === 'RESOLVED'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {new Date(b.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/beneficiaries/${b.id}`}
                        className="text-sm font-semibold text-primary-600 hover:text-primary-500"
                      >
                        View Profile
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. Registration Modal Popup Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Close Button */}
            <button
              onClick={() => {
                setShowModal(false);
                setFormError('');
                setSelectedFile(null);
              }}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Modal Header */}
            <div>
              <h3 className="text-xl font-bold text-slate-800">Register Beneficiary Case</h3>
              <p className="text-sm text-slate-400 mt-1">Open a new file registry to track assistance and follow-ups.</p>
            </div>

            {/* Form Validation Errors */}
            {formError && (
              <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm font-medium text-red-600">
                {formError}
              </div>
            )}

            {/* Form Fields */}
            <form className="mt-6 space-y-4" onSubmit={handleRegister}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="E.g. Chioma Ada"
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-primary-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="E.g. +2348033334444"
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-primary-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Location <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="E.g. Enugu"
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-primary-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="E.g. zurum@example.com"
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-primary-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Assistance Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700 focus:border-primary-500 focus:outline-none"
                >
                  <option value="Medical assistance">Medical Assistance</option>
                  <option value="Educational support">Educational Support</option>
                  <option value="Feeding support">Feeding Support</option>
                  <option value="Widow support">Widow Support</option>
                  <option value="Emergency assistance">Emergency Assistance</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Description of Need <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows="3"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detail the beneficiary's situation and what assistance is needed..."
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-primary-500 focus:outline-none resize-none"
                ></textarea>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Case Evidence / Proof of Need <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  required
                  accept=".png,.jpg,.jpeg,.pdf,.doc,.docx,.txt"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer"
                />
                <p className="mt-1 text-[10px] text-slate-400">Accepted formats: PNG, JPG, JPEG, PDF, Word, TXT (Max 5MB)</p>
              </div>

              <div className="flex gap-4 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setFormError('');
                    setSelectedFile(null);
                  }}
                  className="w-1/2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={registering}
                  className="flex w-1/2 justify-center rounded-xl bg-primary-500 hover:bg-primary-400 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-500/10 disabled:opacity-50"
                >
                  {registering ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  ) : (
                    'Register Case'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Beneficiaries;
