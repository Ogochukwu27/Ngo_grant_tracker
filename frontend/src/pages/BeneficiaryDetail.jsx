// frontend/src/pages/BeneficiaryDetail.jsx

import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Phone,
  Mail,
  FileText,
  Upload,
  Trash2,
  Image as ImageIcon,
  CheckCircle,
  Clock,
  Plus,
  X,
  AlertCircle,
  DollarSign
} from 'lucide-react';

const BeneficiaryDetail = () => {
  const { id } = useParams(); // Extract :id parameter from path URL
  const { authFetch, formatMoney, currency, triggerToast } = useContext(AuthContext);
  const navigate = useNavigate();

  // Profile data states
  const [beneficiary, setBeneficiary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('timeline');

  // Status updating state
  const [statusUpdating, setStatusUpdating] = useState(false);

  // Assistance Form states
  const [showAssistanceForm, setShowAssistanceForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [assistanceCategory, setAssistanceCategory] = useState('');
  const [assistanceNotes, setAssistanceNotes] = useState('');
  const [loggingAssistance, setLoggingAssistance] = useState(false);
  const [assistanceError, setAssistanceError] = useState('');
  const [assistanceReceipt, setAssistanceReceipt] = useState(null);

  // File Upload states
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [showDocuments, setShowDocuments] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState('');
  const [savingDescription, setSavingDescription] = useState(false);
  const [editingAssistanceId, setEditingAssistanceId] = useState(null);

  // Follow-Up states
  const [showFollowUpForm, setShowFollowUpForm] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [followUpNotes, setFollowUpNotes] = useState('');
  const [schedulingFollowUp, setSchedulingFollowUp] = useState(false);
  const [followUpError, setFollowUpError] = useState('');
  const [completingFollowUpId, setCompletingFollowUpId] = useState('');
  const [completionNotes, setCompletionNotes] = useState('');
  const [showCompletionForm, setShowCompletionForm] = useState(false);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

  // Fetch complete beneficiary details and relationship arrays (assistance, evidence, followUps)
  const fetchDetails = async () => {
    try {
      const res = await authFetch(`/beneficiaries/${id}`);
      if (res.status === 200) {
        const data = await res.json();
        setBeneficiary(data);
        // Pre-fill assistance category with the beneficiary's main category
        setAssistanceCategory(data.category);
      }
    } catch (err) {
      console.error('Error fetching beneficiary details:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  // Update Beneficiary Case Status (e.g. from ACTIVE to RESOLVED)
  const handleStatusChange = async (newStatus) => {
    setStatusUpdating(true);
    try {
      const res = await authFetch(`/beneficiaries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.status === 200) {
        const updated = await res.json();
        setBeneficiary((prev) => ({ ...prev, status: updated.status }));
      }
    } catch (err) {
      console.error('Error changing status:', err.message);
    } finally {
      setStatusUpdating(false);
    }
  };

  // Delete Beneficiary Case Profile and all associated dependencies
  const handleDeleteProfile = async () => {
    if (!window.confirm("WARNING: Are you sure you want to permanently delete this beneficiary's profile, including all logged financial assistances, timeline notes, and uploaded evidence files? This action CANNOT be undone.")) {
      return;
    }
    try {
      const res = await authFetch(`/beneficiaries/${id}`, {
        method: 'DELETE',
      });
      if (res.status === 200) {
        triggerToast('Beneficiary record deleted successfully.', 'success');
        navigate('/beneficiaries');
      } else {
        triggerToast('Failed to delete record.', 'error');
      }
    } catch (err) {
      console.error('Delete beneficiary error:', err.message);
      triggerToast('Server error while deleting beneficiary.', 'error');
    }
  };

  // Update Dossier Statement of Need (beneficiary description)
  const handleUpdateDescription = async (e) => {
    e.preventDefault();
    setSavingDescription(true);

    try {
      const res = await authFetch(`/beneficiaries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: editedDescription }),
      });

      if (res.status === 200) {
        const data = await res.json();
        setBeneficiary((prev) => ({ ...prev, description: data.description }));
        setIsEditingDescription(false);
        triggerToast('Statement of Need updated successfully!', 'success');
      } else {
        const errData = await res.json();
        triggerToast(errData.message || 'Failed to update Statement of Need', 'error');
      }
    } catch (err) {
      console.error('Error updating description:', err.message);
      triggerToast('Server error during update.', 'error');
    } finally {
      setSavingDescription(false);
    }
  };

  // Helper to reset the assistance logging / editing form states
  const resetAssistanceForm = () => {
    setShowAssistanceForm(false);
    setEditingAssistanceId(null);
    setAmount('');
    setPurpose('');
    setAssistanceNotes('');
    setAssistanceReceipt(null);
    setAssistanceError('');
    const fileInput = document.getElementById('assistance-receipt-input');
    if (fileInput) fileInput.value = '';
  };

  // Submit Assistance Record Log Form (Supports both POST creation and PUT updating)
  const handleLogAssistance = async (e) => {
    e.preventDefault();
    setAssistanceError('');
    setLoggingAssistance(true);

    if (!amount || !purpose || !assistanceCategory) {
      setAssistanceError('Please fill in required fields (amount, purpose, category)');
      setLoggingAssistance(false);
      return;
    }

    // Receipt is mandatory for new log creation, but optional when editing
    if (!assistanceReceipt && !editingAssistanceId) {
      setAssistanceError('Please upload a receipt as mandatory proof of assistance.');
      setLoggingAssistance(false);
      return;
    }

    const inputAmount = parseFloat(amount);
    const finalAmount = currency === 'USD' ? inputAmount * 1500 : inputAmount;

    try {
      let combinedNotes = assistanceNotes;

      // 1. Upload new receipt if one is selected
      if (assistanceReceipt) {
        const formData = new FormData();
        formData.append('file', assistanceReceipt);
        formData.append('beneficiaryId', id);

        const uploadRes = await authFetch('/evidence', {
          method: 'POST',
          body: formData,
        });

        if (uploadRes.status !== 201) {
          const uploadErrData = await uploadRes.json();
          setAssistanceError(uploadErrData.message || 'Failed to upload receipt evidence.');
          setLoggingAssistance(false);
          return;
        }

        const uploadData = await uploadRes.json();
        const receiptMeta = `[Receipt: ${uploadData.fileName}](${uploadData.fileUrl})`;
        combinedNotes = assistanceNotes 
          ? `${assistanceNotes}\n${receiptMeta}` 
          : receiptMeta;
      } else if (editingAssistanceId) {
        // Preserving the old receipt link if editing and no new receipt is chosen
        const oldRecord = beneficiary.assistance.find(item => item.id === editingAssistanceId);
        const receiptMatch = oldRecord.notes?.match(/\[Receipt:\s*([^\]]+)\]\(([^)]+)\)/);
        if (receiptMatch) {
          const receiptMeta = `[Receipt: ${receiptMatch[1]}](${receiptMatch[2]})`;
          combinedNotes = assistanceNotes 
            ? `${assistanceNotes}\n${receiptMeta}` 
            : receiptMeta;
        }
      }

      // 2. Determine POST or PUT endpoint and method
      const endpoint = editingAssistanceId ? `/assistance/${editingAssistanceId}` : '/assistance';
      const method = editingAssistanceId ? 'PUT' : 'POST';

      const res = await authFetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          beneficiaryId: id,
          amount: finalAmount,
          purpose,
          category: assistanceCategory,
          notes: combinedNotes,
        }),
      });

      if (res.status === 201 || res.status === 200) {
        fetchDetails();
        resetAssistanceForm();
        triggerToast(editingAssistanceId ? 'Support log updated successfully.' : 'Support log recorded successfully.', 'success');
      } else {
        const errData = await res.json();
        setAssistanceError(errData.message || 'Failed to submit support log');
      }
    } catch (err) {
      console.error('Error logging support:', err.message);
      setAssistanceError('Server error.');
    } finally {
      setLoggingAssistance(false);
    }
  };

  // Delete specific assistance log record
  const handleDeleteAssistance = async (assistanceId) => {
    if (!window.confirm("Are you sure you want to permanently delete this support log?")) {
      return;
    }
    try {
      const res = await authFetch(`/assistance/${assistanceId}`, {
        method: 'DELETE',
      });
      if (res.status === 200) {
        triggerToast('Support log deleted successfully.', 'success');
        fetchDetails();
      } else {
        triggerToast('Failed to delete support log.', 'error');
      }
    } catch (err) {
      console.error('Error deleting assistance:', err.message);
      triggerToast('Server error while deleting support log.', 'error');
    }
  };

  // Submit Multipart File Upload Form (multer)
  const handleUploadFile = async (fileToUpload) => {
    setUploadError('');
    setUploading(true);

    if (!fileToUpload) {
      setUploadError('Please select a file to upload');
      setUploading(false);
      return;
    }

    try {
      // Create FormData to package files inside binary multipart streams
      const formData = new FormData();
      formData.append('file', fileToUpload);
      formData.append('beneficiaryId', id);

      // CRITICAL: Do NOT set Content-Type header manually, let fetch set boundary!
      const res = await authFetch('/evidence', {
        method: 'POST',
        body: formData,
      });

      if (res.status === 201) {
        // Success! Reload details, reset file
        fetchDetails();
        setUploadFile(null);
        triggerToast('Document uploaded successfully!', 'success');
      } else {
        const errData = await res.json();
        setUploadError(errData.message || 'Upload failed');
        triggerToast(errData.message || 'Upload failed', 'error');
      }
    } catch (err) {
      console.error('Upload error:', err.message);
      setUploadError('Server error. Upload failed.');
      triggerToast('Server error during upload.', 'error');
    } finally {
      setUploading(false);
    }
  };

  // Delete an Evidence file
  const handleDeleteEvidence = async (evidenceId) => {
    if (!window.confirm('Are you sure you want to delete this evidence file? This will permanently erase the physical file.')) {
      return;
    }

    try {
      const res = await authFetch(`/evidence/${evidenceId}`, {
        method: 'DELETE',
      });

      if (res.status === 200) {
        // Reload details to verify removal
        fetchDetails();
      }
    } catch (err) {
      console.error('Error deleting file:', err.message);
    }
  };

  // Submit Follow-Up Schedule Form
  const handleScheduleFollowUp = async (e) => {
    e.preventDefault();
    setFollowUpError('');
    setSchedulingFollowUp(true);

    if (!scheduledDate) {
      setFollowUpError('Please select a scheduled date');
      setSchedulingFollowUp(false);
      return;
    }

    try {
      const res = await authFetch('/followups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          beneficiaryId: id,
          scheduledDate,
          notes: followUpNotes,
        }),
      });

      if (res.status === 201) {
        // Success! Reload details, reset form
        fetchDetails();
        setShowFollowUpForm(false);
        setScheduledDate('');
        setFollowUpNotes('');
      } else {
        const errData = await res.json();
        setFollowUpError(errData.message || 'Failed to schedule follow-up');
      }
    } catch (err) {
      console.error('Error scheduling follow-up:', err.message);
      setFollowUpError('Server error.');
    } finally {
      setSchedulingFollowUp(false);
    }
  };

  // Open closure dialogue box for completing follow-up
  const openCompletionForm = (followUpId) => {
    setCompletingFollowUpId(followUpId);
    setCompletionNotes('');
    setShowCompletionForm(true);
  };

  // Submit Follow-Up Completion Log
  const handleCompleteFollowUp = async (e) => {
    e.preventDefault();
    try {
      const res = await authFetch(`/followups/${completingFollowUpId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'COMPLETED',
          notes: completionNotes,
        }),
      });

      if (res.status === 200) {
        // Success! Reload lists, close dialogue
        fetchDetails();
        setCompletingFollowUpId('');
        setCompletionNotes('');
        setShowCompletionForm(false);
      }
    } catch (err) {
      console.error('Error completing follow-up:', err.message);
    }
  };

  // Merge and sort all events for the unified timeline
  const getTimelineEvents = () => {
    if (!beneficiary) return [];
    
    const events = [];
    
    // Add assistance entries
    beneficiary.assistance.forEach(item => {
      events.push({
        id: `assistance-${item.id}`,
        type: 'assistance',
        date: new Date(item.dateGiven || item.createdAt),
        title: `Financial Support: ${formatMoney(item.amount)}`,
        subtitle: `Category: ${item.category}`,
        description: item.purpose,
        notes: item.notes,
        raw: item
      });
    });
    
    // Add evidence entries
    beneficiary.evidence.forEach(item => {
      events.push({
        id: `evidence-${item.id}`,
        type: 'evidence',
        date: new Date(item.createdAt),
        title: `Uploaded Supporting Document`,
        subtitle: item.fileName,
        description: `File Type: ${item.fileType}`,
        raw: item
      });
    });
    
    // Add followups
    beneficiary.followUps.forEach(item => {
      events.push({
        id: `followup-${item.id}`,
        type: 'followup',
        date: new Date(item.createdAt || item.scheduledDate),
        title: `Scheduled Follow-Up Assessment`,
        subtitle: `Status: ${item.status} (Target: ${new Date(item.scheduledDate).toLocaleDateString()})`,
        description: item.notes,
        raw: item
      });
    });
    
    // Sort events newest first
    return events.sort((a, b) => b.date - a.date);
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!beneficiary) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow">
        <h3 className="text-lg font-bold text-slate-800">Beneficiary profile not found</h3>
        <Link to="/beneficiaries" className="mt-4 inline-flex items-center gap-2 text-sm text-primary-600 font-semibold">
          <ArrowLeft className="h-4 w-4" /> Back to registry
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button & title bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          to="/beneficiaries"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Registry</span>
        </Link>

        {/* Status Selector & Delete Profile Actions */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Case File Status:
            </span>
            <select
              disabled={statusUpdating}
              value={beneficiary.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className={`rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all focus:outline-none ${
                beneficiary.status === 'ACTIVE'
                  ? 'bg-green-100 text-green-700'
                  : beneficiary.status === 'RESOLVED'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>

          <button
            onClick={handleDeleteProfile}
            className="flex items-center gap-1.5 rounded-xl bg-red-50 hover:bg-red-100 px-3.5 py-1.5 text-xs font-bold text-red-600 transition-all border border-red-200/50 cursor-pointer btn-animate"
            title="Delete beneficiary record permanently"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete Case</span>
          </button>
        </div>
      </div>

      {/* Grid Layout: Left profile column, Right history column */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Beneficiary core dossier information */}
        <div className="space-y-6 lg:col-span-4">
          <div className="glass-card p-6 space-y-6">
            <div>
              <h3 className="text-xl font-bold text-slate-800">{beneficiary.fullName}</h3>
              <span className="inline-block mt-1.5 rounded-lg bg-primary-50 text-primary-700 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                {beneficiary.category}
              </span>
            </div>

            <hr className="border-slate-100" />

            {/* Profile fields list */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-slate-600">
                <MapPin className="h-5 w-5 text-slate-400 shrink-0" />
                <span className="text-sm font-medium">{beneficiary.location}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <Phone className="h-5 w-5 text-slate-400 shrink-0" />
                <span className="text-sm font-medium">{beneficiary.phoneNumber}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <Mail className="h-5 w-5 text-slate-400 shrink-0" />
                <span className="text-sm font-medium truncate">
                  {beneficiary.email || <span className="text-slate-400 italic">No email provided</span>}
                </span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <Calendar className="h-5 w-5 text-slate-400 shrink-0" />
                <span className="text-sm font-medium">
                  Registered: {new Date(beneficiary.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Needs Description */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Dossier Statement of Need
                </label>
                {!isEditingDescription && (
                  <button
                    onClick={() => {
                      setEditedDescription(beneficiary.description);
                      setIsEditingDescription(true);
                    }}
                    className="text-xs font-bold text-primary-600 hover:text-primary-500 cursor-pointer outline-none bg-transparent border-0"
                  >
                    Edit
                  </button>
                )}
              </div>
              
              {isEditingDescription ? (
                <form onSubmit={handleUpdateDescription} className="space-y-3">
                  <textarea
                    required
                    rows="3"
                    value={editedDescription}
                    onChange={(e) => setEditedDescription(e.target.value)}
                    className="w-full text-sm leading-relaxed text-slate-800 bg-white border border-slate-200 rounded-xl p-3 focus:border-primary-500 focus:outline-none resize-none"
                  ></textarea>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingDescription(false)}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-50 cursor-pointer bg-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingDescription}
                      className="flex items-center gap-1 rounded-lg bg-primary-500 hover:bg-primary-400 px-3 py-1.5 text-xs font-semibold text-white shadow-sm disabled:opacity-50 cursor-pointer"
                    >
                      {savingDescription ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </form>
              ) : (
                <p className="text-sm leading-relaxed text-slate-650 bg-slate-50 border border-slate-100 rounded-xl p-3 font-medium">
                  {beneficiary.description}
                </p>
              )}
            </div>

            <hr className="border-slate-100" />
            
            {/* Collapsible Case Documents Folder Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Case Documents ({beneficiary.evidence.length})
                </label>
                <button
                  onClick={() => setShowDocuments(!showDocuments)}
                  className="text-xs font-bold text-primary-600 hover:text-primary-500 cursor-pointer outline-none bg-transparent border-0"
                >
                  {showDocuments ? 'See Less' : 'See More'}
                </button>
              </div>

              {showDocuments && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                  {/* Documents List (Read-only) */}
                  {beneficiary.evidence.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No documents uploaded.</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {beneficiary.evidence.map((file) => {
                        const isImage = file.fileType.startsWith('image/');
                        const FileIcon = isImage ? ImageIcon : FileText;
                        const targetUrl = file.fileUrl.startsWith('http')
                          ? file.fileUrl
                          : `${BACKEND_URL}${file.fileUrl}`;

                        return (
                          <div key={file.id} className="flex items-center gap-2 border border-slate-100 rounded-xl p-2 bg-white hover:bg-slate-50/50 transition-all relative">
                            <FileIcon className={`h-4 w-4 shrink-0 ${isImage ? 'text-blue-500' : 'text-amber-500'}`} />
                            <div className="min-w-0 flex-1">
                              <a
                                href={targetUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block truncate text-xs font-semibold text-slate-700 hover:text-primary-600 cursor-pointer"
                                title="Click to view file"
                              >
                                {file.fileName}
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Assistance, Evidence, and Follow-Up tabs panel */}
        <div className="space-y-6 lg:col-span-8">
          <div className="glass-card overflow-hidden">
            {/* Tabs Selector headers */}
            <div className="flex bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setActiveTab('timeline')}
                className={`flex-1 py-4 text-center text-sm font-bold tracking-wider uppercase border-b-2 transition-all ${
                  activeTab === 'timeline'
                    ? 'border-primary-500 text-primary-600 bg-white dark:bg-slate-900 dark:text-primary-400'
                    : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-800/30'
                }`}
              >
                Timeline
              </button>
              <button
                onClick={() => setActiveTab('assistance')}
                className={`flex-1 py-4 text-center text-sm font-bold tracking-wider uppercase border-b-2 transition-all ${
                  activeTab === 'assistance'
                    ? 'border-primary-500 text-primary-600 bg-white dark:bg-slate-900 dark:text-primary-400'
                    : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-800/30'
                }`}
              >
                Support Logs ({beneficiary.assistance.length})
              </button>
              <button
                onClick={() => setActiveTab('followups')}
                className={`flex-1 py-4 text-center text-sm font-bold tracking-wider uppercase border-b-2 transition-all ${
                  activeTab === 'followups'
                    ? 'border-primary-500 text-primary-600 bg-white dark:bg-slate-900 dark:text-primary-400'
                    : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-800/30'
                }`}
              >
                Follow-Ups ({beneficiary.followUps.length})
              </button>
            </div>

            {/* Tab Timeline Content */}
            {activeTab === 'timeline' && (
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">Dossier Activity Trail</h4>
                  <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Audit Feed
                  </span>
                </div>

                {getTimelineEvents().length === 0 ? (
                  <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-sm">
                    No activities recorded yet for this beneficiary.
                  </div>
                ) : (
                  <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 pl-8 space-y-8 py-2">
                    {getTimelineEvents().map((event) => {
                      let nodeBg = 'bg-primary-500 shadow-primary-500/20';
                      let IconComponent = DollarSign;
                      
                      if (event.type === 'evidence') {
                        nodeBg = 'bg-blue-500 shadow-blue-500/20';
                        IconComponent = FileText;
                      } else if (event.type === 'followup') {
                        nodeBg = 'bg-amber-500 shadow-amber-500/20';
                        IconComponent = Calendar;
                      }

                      return (
                        <div key={event.id} className="relative group">
                          {/* Vertical timeline node dot with pulse/glow */}
                          <div className={`absolute -left-[41px] top-1.5 flex h-7.5 w-7.5 items-center justify-center rounded-full ${nodeBg} shadow-lg ring-4 ring-white dark:ring-slate-900 transition-all duration-300 group-hover:scale-110`}>
                            <IconComponent className="h-3.5 w-3.5 text-white" />
                          </div>

                          {/* Event card content */}
                          <div className="glass-card p-5 hover-glow transition-all duration-300 bg-white/60 dark:bg-slate-900/30 border border-slate-200/50 dark:border-slate-800/80">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <h5 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                                  {event.title}
                                </h5>
                                <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mt-0.5">
                                  {event.subtitle}
                                </p>
                              </div>
                              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 shrink-0 mt-0.5 sm:mt-0">
                                {event.date.toLocaleDateString()} at {event.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>

                            <div className="mt-3 text-xs leading-relaxed text-slate-650 dark:text-slate-400 font-medium">
                              {event.description}
                            </div>

                            {(() => {
                              const receiptMatch = event.notes?.match(/\[Receipt:\s*([^\]]+)\]\(([^)]+)\)/);
                              const displayNotes = event.notes ? event.notes.replace(/\[Receipt:\s*([^\]]+)\]\(([^)]+)\)/, '').trim() : '';
                              return (
                                <>
                                  {displayNotes && (
                                    <p className="text-xs text-slate-500 dark:text-slate-400 italic mt-2.5 bg-slate-50 dark:bg-slate-950/40 p-2.5 border border-slate-150 dark:border-slate-800/60 rounded-xl">
                                      Notes: {displayNotes}
                                    </p>
                                  )}
                                  {receiptMatch && (
                                    <a 
                                      href={receiptMatch[2].startsWith('http') ? receiptMatch[2] : `${BACKEND_URL}${receiptMatch[2]}`}
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 mt-2.5 rounded-xl bg-primary-50 hover:bg-primary-100 dark:bg-[#0d270d]/50 dark:hover:bg-[#104210]/50 px-3 py-1.5 text-xs font-bold text-primary-600 dark:text-[#feab32] border border-primary-200/20 transition-all btn-animate inline-block"
                                    >
                                      <FileText className="h-4 w-4 shrink-0" />
                                      <span>Receipt: {receiptMatch[1]}</span>
                                    </a>
                                  )}
                                </>
                              );
                            })()}
                            
                            {/* Quick Action Links inside the card */}
                            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[10px] font-bold">
                              <span className="text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                Source: {event.type === 'assistance' ? 'Support Log' : event.type === 'evidence' ? 'Dossier' : 'Scheduler'}
                              </span>
                              {event.type !== 'evidence' && (
                                <button
                                  onClick={() => setActiveTab(event.type === 'assistance' ? 'assistance' : 'followups')}
                                  className="text-primary-500 hover:text-primary-400 transition-all cursor-pointer text-[10px] font-bold bg-transparent border-0 outline-none"
                                >
                                  Go to section &rarr;
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Tab 1 Content: Assistance Logs */}
            {activeTab === 'assistance' && (
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-bold text-slate-800">Support Logs</h4>
                  {!showAssistanceForm && (
                    <button
                      onClick={() => setShowAssistanceForm(true)}
                      className="flex items-center gap-1.5 rounded-lg bg-primary-50 hover:bg-primary-100 px-3 py-1.5 text-xs font-bold text-primary-700 transition-all"
                    >
                      <Plus className="h-4 w-4" /> Log Support
                    </button>
                  )}
                </div>

                {/* Inline Log Assistance Form */}
                {showAssistanceForm && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200/50 pb-2">
                      <h5 className="text-sm font-bold text-slate-700">
                        {editingAssistanceId ? 'Edit Assistance Entry' : 'Record Assistance Entry'}
                      </h5>
                      <button
                        onClick={resetAssistanceForm}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {assistanceError && (
                      <div className="rounded-lg bg-red-50 border border-red-200 p-2.5 text-xs font-semibold text-red-600">
                        {assistanceError}
                      </div>
                    )}

                    <form className="space-y-4" onSubmit={handleLogAssistance}>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Disbursement Amount ({currency}) <span className="text-red-500">*</span>
                          </label>
                          <div className="relative mt-1.5">
                            <span className="absolute top-2.5 left-3 text-sm font-bold text-slate-400">
                              {currency === 'USD' ? '$' : '₦'}
                            </span>
                            <input
                              type="number"
                              required
                              min="0"
                              value={amount}
                              onChange={(e) => setAmount(e.target.value)}
                              placeholder="50000"
                              className="w-full rounded-xl border border-slate-200 pl-8 pr-4 py-2 text-sm text-slate-800 focus:border-primary-500 focus:outline-none"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Assistance Category <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={assistanceCategory}
                            onChange={(e) => setAssistanceCategory(e.target.value)}
                            className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none"
                          >
                            <option value="Medical assistance">Medical Assistance</option>
                            <option value="Educational support">Educational Support</option>
                            <option value="Feeding support">Feeding Support</option>
                            <option value="Widow support">Widow Support</option>
                            <option value="Emergency assistance">Emergency Assistance</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Purpose of Assistance <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={purpose}
                          onChange={(e) => setPurpose(e.target.value)}
                          placeholder="E.g. Purchase of textbooks and uniform"
                          className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-primary-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Notes / Extra Details
                        </label>
                        <textarea
                          rows="2"
                          value={assistanceNotes}
                          onChange={(e) => setAssistanceNotes(e.target.value)}
                          placeholder="E.g. Paid directly to merchant receipt number #83..."
                          className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-primary-500 focus:outline-none resize-none"
                        ></textarea>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider block">
                          Upload Receipt / Proof of Payment {editingAssistanceId ? '' : <span className="text-red-500">*</span>}
                        </label>
                        <input
                          id="assistance-receipt-input"
                          type="file"
                          required={!editingAssistanceId}
                          onChange={(e) => setAssistanceReceipt(e.target.files[0])}
                          className="mt-2 text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer w-full"
                        />
                        {editingAssistanceId && (
                          <p className="text-[10px] text-slate-400 mt-1">
                            Leave empty to preserve current receipt, or upload a new file to replace it.
                          </p>
                        )}
                      </div>

                      <div className="flex justify-end gap-3 pt-2">
                        <button
                          type="button"
                          onClick={resetAssistanceForm}
                          className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={loggingAssistance}
                          className="flex items-center gap-1 rounded-lg bg-primary-500 hover:bg-primary-400 px-4 py-2 text-xs font-semibold text-white shadow-md disabled:opacity-50"
                        >
                          {loggingAssistance ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                          ) : (
                            'Save Record'
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Ledger Listing */}
                {beneficiary.assistance.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-sm">
                    No assistance logs recorded. Click "Log Support" above to add financial aid.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 border-t border-slate-100">
                    {beneficiary.assistance.map((item) => {
                      const receiptMatch = item.notes?.match(/\[Receipt:\s*([^\]]+)\]\(([^)]+)\)/);
                      const displayNotes = item.notes ? item.notes.replace(/\[Receipt:\s*([^\]]+)\]\(([^)]+)\)/, '').trim() : '';

                      return (
                        <div key={item.id} className="py-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between hover:bg-slate-50/20 transition-all px-2 relative group">
                          <div className="space-y-1.5 flex-1 pr-12">
                            <p className="text-sm font-semibold text-slate-800">{item.purpose}</p>
                            <span className="inline-block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Category: {item.category}
                            </span>
                            {displayNotes && (
                              <p className="text-xs text-slate-500 italic mt-1 font-medium bg-slate-50 dark:bg-slate-950/20 p-2 border border-slate-100 dark:border-slate-800 rounded-lg">
                                Notes: {displayNotes}
                              </p>
                            )}
                            {receiptMatch && (
                              <a 
                                href={receiptMatch[2].startsWith('http') ? receiptMatch[2] : `${BACKEND_URL}${receiptMatch[2]}`}
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 mt-1.5 rounded-lg bg-primary-50 hover:bg-primary-100 dark:bg-[#0d270d]/50 dark:hover:bg-[#104210]/50 px-2.5 py-1 text-xs font-bold text-primary-600 dark:text-[#feab32] border border-primary-200/20 transition-all inline-block"
                              >
                                <FileText className="h-3.5 w-3.5 shrink-0" />
                                <span>Receipt: {receiptMatch[1]}</span>
                              </a>
                            )}
                          </div>
                          <div className="text-right shrink-0 flex flex-col items-end gap-1">
                            <p className="text-sm font-extrabold text-primary-600">
                              {formatMoney(item.amount)}
                            </p>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {new Date(item.dateGiven).toLocaleDateString()}
                            </span>
                            <div className="flex items-center gap-2 mt-1">
                              <button
                                onClick={() => {
                                  setEditingAssistanceId(item.id);
                                  setAmount(currency === 'USD' ? (item.amount / 1500).toString() : item.amount.toString());
                                  setPurpose(item.purpose);
                                  setAssistanceCategory(item.category);
                                  const notesWithoutReceipt = item.notes ? item.notes.replace(/\[Receipt:\s*([^\]]+)\]\(([^)]+)\)/, '').trim() : '';
                                  setAssistanceNotes(notesWithoutReceipt);
                                  setAssistanceReceipt(null);
                                  setShowAssistanceForm(true);
                                }}
                                className="text-primary-600 hover:text-primary-500 transition-all text-xs font-bold bg-transparent border-0 cursor-pointer py-1 pr-1"
                                title="Edit support log"
                              >
                                Edit
                              </button>
                              <span className="text-slate-300">|</span>
                              <button
                                onClick={() => handleDeleteAssistance(item.id)}
                                className="text-red-600 hover:text-red-500 transition-all text-xs font-bold bg-transparent border-0 cursor-pointer py-1 pl-1"
                                title="Delete support log"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Tab 3 Content: Follow-Ups */}
            {activeTab === 'followups' && (
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-bold text-slate-800">Scheduled Follow-Ups</h4>
                  {!showFollowUpForm && (
                    <button
                      onClick={() => setShowFollowUpForm(true)}
                      className="flex items-center gap-1.5 rounded-lg bg-primary-50 hover:bg-primary-100 px-3 py-1.5 text-xs font-bold text-primary-700 transition-all"
                    >
                      <Plus className="h-4 w-4" /> Schedule Check
                    </button>
                  )}
                </div>

                {/* Inline Schedule Follow-Up Form */}
                {showFollowUpForm && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200/50 pb-2">
                      <h5 className="text-sm font-bold text-slate-700">Schedule Assessment</h5>
                      <button
                        onClick={() => {
                          setShowFollowUpForm(false);
                          setFollowUpError('');
                        }}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {followUpError && (
                      <div className="rounded-lg bg-red-50 border border-red-200 p-2.5 text-xs font-semibold text-red-600">
                        {followUpError}
                      </div>
                    )}

                    <form className="space-y-4" onSubmit={handleScheduleFollowUp}>
                      <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                          Scheduled Due Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          required
                          value={scheduledDate}
                          onChange={(e) => setScheduledDate(e.target.value)}
                          className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-primary-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Follow-Up Objective / Instructions
                        </label>
                        <textarea
                          rows="2"
                          value={followUpNotes}
                          onChange={(e) => setFollowUpNotes(e.target.value)}
                          placeholder="Detail the target goals or checklist items to query during follow-up..."
                          className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-primary-500 focus:outline-none resize-none"
                        ></textarea>
                      </div>

                      <div className="flex justify-end gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowFollowUpForm(false);
                            setFollowUpError('');
                          }}
                          className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={schedulingFollowUp}
                          className="flex items-center gap-1 rounded-lg bg-primary-500 hover:bg-primary-400 px-4 py-2 text-xs font-semibold text-white shadow-md disabled:opacity-50"
                        >
                          {schedulingFollowUp ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                          ) : (
                            'Schedule'
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Inline Complete Follow-Up outcome notes dialogue */}
                {showCompletionForm && (
                  <div className="rounded-xl border border-primary-200 bg-primary-50/20 p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-primary-100 pb-2">
                      <h5 className="text-sm font-bold text-primary-800">Close Assessment & Record Outcomes</h5>
                      <button
                        onClick={() => {
                          setShowCompletionForm(false);
                          setCompletingFollowUpId('');
                        }}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <form className="space-y-4" onSubmit={handleCompleteFollowUp}>
                      <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Follow-Up Findings & Outcome Notes <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          required
                          rows="3"
                          value={completionNotes}
                          onChange={(e) => setCompletionNotes(e.target.value)}
                          placeholder="Describe the beneficiary's situation. Did the aid have the desired impact? Document qualitative outcomes..."
                          className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 bg-white focus:border-primary-500 focus:outline-none resize-none"
                        ></textarea>
                      </div>

                      <div className="flex justify-end gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowCompletionForm(false);
                            setCompletingFollowUpId('');
                          }}
                          className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 bg-white"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="rounded-lg bg-primary-500 hover:bg-primary-400 px-4 py-2 text-xs font-semibold text-white shadow-md"
                        >
                          Complete Assessment
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Follow-Ups Listing */}
                {beneficiary.followUps.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-sm">
                    No follow-ups scheduled yet. Click "Schedule Check" to map follow-up assessments.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 border-t border-slate-100">
                    {beneficiary.followUps.map((item) => {
                      const isPending = item.status === 'PENDING';
                      const isOverdue = item.status === 'OVERDUE';
                      
                      return (
                        <div key={item.id} className="py-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between px-2 hover:bg-slate-50/20 transition-all">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                                item.status === 'COMPLETED'
                                  ? 'bg-green-100 text-green-700'
                                  : isOverdue
                                  ? 'bg-red-100 text-red-700 animate-pulse'
                                  : 'bg-amber-100 text-amber-700'
                              }`}>
                                {item.status}
                              </span>
                              <span className="text-xs text-slate-400 font-semibold">
                                Target Date: {new Date(item.scheduledDate).toLocaleDateString()}
                              </span>
                            </div>
                            
                            <p className="text-sm text-slate-700 font-medium">
                              {item.notes || <span className="text-slate-400 italic font-normal">No instructions or outcome notes logged.</span>}
                            </p>
                          </div>

                          {/* Complete check trigger action */}
                          {(isPending || isOverdue) && (
                            <button
                              onClick={() => openCompletionForm(item.id)}
                              className="flex items-center gap-1 rounded-lg bg-primary-50 hover:bg-primary-100 px-3 py-1.5 text-xs font-bold text-primary-700 shrink-0 transition-all"
                            >
                              <CheckCircle className="h-4 w-4" />
                              <span>Complete Check</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BeneficiaryDetail;
