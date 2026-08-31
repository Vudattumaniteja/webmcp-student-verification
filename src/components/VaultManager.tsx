import { useState, useEffect, useId } from 'react';
import {
  StudentVault,
  globalVault,
} from '../services/vault.ts';
import {
  DemoPresetId,
  DocumentType,
  VaultDocument,
  VaultState,
} from '../types/vault.ts';
import {
  ShieldCheck,
  FileText,
  User,
  GraduationCap,
  Calendar,
  Mail,
  CheckCircle,
  AlertCircle,
  Eye,
  Plus,
  Trash2,
  Lock,
  Key,
  X,
  UploadCloud,
  Sparkles,
  Info,
} from 'lucide-react';

interface VaultManagerProps {
  vault?: StudentVault;
}

export default function VaultManager({ vault = globalVault }: VaultManagerProps) {
  const [vaultState, setVaultState] = useState<VaultState>(vault.getState());
  const [selectedDocForPreview, setSelectedDocForPreview] = useState<VaultDocument | null>(null);
  const [showAddDocModal, setShowAddDocModal] = useState(false);
  const [copiedHandle, setCopiedHandle] = useState<string | null>(null);

  // Form state for adding custom document
  const [customTitle, setCustomTitle] = useState('');
  const [customFileName, setCustomFileName] = useState('');
  const [customDocType, setCustomDocType] = useState<DocumentType>('STUDENT_ID');
  const [customIssueDate, setCustomIssueDate] = useState('2026-08-01');
  const [customExpirationDate, setCustomExpirationDate] = useState('2027-06-30');
  const [customIsValid, setCustomIsValid] = useState(true);

  const customDocTypeSelectId = useId();
  const customTitleInputId = useId();
  const customFileNameInputId = useId();
  const customIssueDateInputId = useId();
  const customExpDateInputId = useId();
  const customIsValidInputId = useId();

  useEffect(() => {
    const unsubscribe = vault.subscribe((newState) => {
      setVaultState(newState);
    });
    return () => unsubscribe();
  }, [vault]);

  const presets = vault.getAllPresets();
  const activePreset = vault.getActivePreset();
  const { profile, documents } = vaultState;

  const handleSwitchPreset = (presetId: DemoPresetId) => {
    vault.switchPreset(presetId);
  };

  const handleCopyHandle = (handleId: string) => {
    navigator.clipboard?.writeText(handleId);
    setCopiedHandle(handleId);
    setTimeout(() => setCopiedHandle(null), 2000);
  };

  const handleRemoveDoc = (docId: string) => {
    vault.removeDocument(docId);
  };

  const handleCreateCustomDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle || !customFileName) return;

    const mimeType = customFileName.endsWith('.pdf') ? 'application/pdf' : 'image/png';
    const fakeContent = `CUSTOM_DOC::${customTitle}::${customFileName}::${new Date().toISOString()}`;
    const blob = new Blob([fakeContent], { type: mimeType });

    await vault.addCustomDocument(
      {
        title: customTitle,
        fileName: customFileName,
        docType: customDocType,
        mimeType,
        fileSizeBytes: blob.size,
        issueDate: customIssueDate,
        expirationDate: customExpirationDate || undefined,
        isValid: customIsValid,
        description: 'User uploaded custom verification asset.',
        previewText: `CUSTOM DOCUMENT | ${profile.fullName} | ${customTitle}`,
      },
      blob,
    );

    setCustomTitle('');
    setCustomFileName('');
    setShowAddDocModal(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Zero-PII Security & Privacy Guarantee Header */}
      <div className="bg-gradient-to-r from-emerald-950/70 via-slate-900/90 to-cyan-950/70 border border-emerald-800/60 rounded-2xl p-4 sm:p-5 shadow-lg shadow-emerald-950/20 backdrop-blur">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-900/80 border border-emerald-700 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-emerald-300">
                  Zero-PII Claim-Check Architecture
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-900/80 text-emerald-300 border border-emerald-700 font-mono">
                  Client Sandbox Active
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Raw binaries remain sandboxed in browser. AI agents only inspect sanitized metadata handles under 300 chars.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs text-slate-400 bg-slate-950/70 px-3 py-1.5 rounded-lg border border-slate-800 shrink-0">
            <Lock className="h-3.5 w-3.5 text-emerald-400" />
            <span>Handle Claim-Check Active</span>
          </div>
        </div>
      </div>

      {/* Preset Personas Selector */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            <span>Interactive Demo Student Presets</span>
          </div>
          <span className="text-[11px] text-slate-400">Click to switch student persona & documents</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {presets.map((preset) => {
            const isActive = vaultState.activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSwitchPreset(preset.id)}
                className={`text-left p-3.5 rounded-xl border transition-all relative flex flex-col justify-between gap-2.5 ${
                  isActive
                    ? 'bg-indigo-950/50 border-indigo-500 ring-1 ring-indigo-500/50 shadow-md shadow-indigo-950/50'
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-semibold text-xs text-slate-100">{preset.name}</span>
                    <span
                      className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                        isActive
                          ? 'bg-indigo-900 text-indigo-200 border border-indigo-700'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {preset.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">{preset.universityName}</p>
                </div>

                <div className="pt-2 border-t border-slate-800/80">
                  <p className="text-[10px] text-cyan-300 font-medium">{preset.tagline}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Student Vault Body Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Student Identity Profile (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex flex-col gap-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-indigo-950 border border-indigo-800 flex items-center justify-center text-indigo-400">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                    Student Profile
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono">Local Browser Vault</span>
                </div>
              </div>

              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {activePreset.id}
              </span>
            </div>

            {/* Profile Avatar and Name */}
            <div className="flex items-center gap-3.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800/70">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-sm text-white shadow">
                {profile.firstName[0]}
                {profile.lastName[0]}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-semibold text-slate-100 truncate">{profile.fullName}</h4>
                <p className="text-xs text-slate-400 truncate">{profile.universityName}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800/60">
                    Class of {profile.graduationYear}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                    {profile.academicLevel}
                  </span>
                </div>
              </div>
            </div>

            {/* Profile Attributes List */}
            <div className="flex flex-col gap-2.5 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-800/50">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-slate-500" />
                  <span>University Email</span>
                </span>
                <span className="font-mono text-slate-200 truncate max-w-[160px]" title={profile.email}>
                  {profile.email}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-800/50">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-500" />
                  <span>Date of Birth</span>
                </span>
                <span className="font-mono text-slate-200">{profile.birthDate}</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-800/50">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <GraduationCap className="h-3.5 w-3.5 text-slate-500" />
                  <span>Institution ID</span>
                </span>
                <span className="font-mono text-slate-200">{profile.universityId}</span>
              </div>

              {profile.studentIdNumber && (
                <div className="flex items-center justify-between py-1.5 border-b border-slate-800/50">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Key className="h-3.5 w-3.5 text-slate-500" />
                    <span>Student ID Number</span>
                  </span>
                  <span className="font-mono text-slate-200">{profile.studentIdNumber}</span>
                </div>
              )}
            </div>

            {/* Test Scenario Note */}
            <div className="bg-slate-950/70 rounded-xl p-3 border border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-2">
              <Info className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-semibold text-slate-300">Test Scenario: </span>
                <span>{activePreset.testScenario}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Vault Proof Documents & Handles (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex flex-col gap-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                    Academic Proof Assets & Handles ({documents.length})
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Zero-PII Claim-Check Registry
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAddDocModal(true)}
                className="py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm shadow-indigo-600/20"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Document</span>
              </button>
            </div>

            {/* Documents List */}
            {documents.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                No documents found in vault. Switch preset or upload a custom file.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {documents.map((doc) => {
                  return (
                    <div
                      key={doc.id}
                      className="bg-slate-950/70 border border-slate-800/90 hover:border-slate-700/90 rounded-xl p-3.5 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="h-10 w-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                          <FileText className="h-5 w-5 text-cyan-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="font-semibold text-xs text-slate-100">{doc.title}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                              {doc.docType}
                            </span>
                            {doc.isValid ? (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" />
                                Valid
                              </span>
                            ) : doc.isIllegible ? (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800 flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                Illegible Scan
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800 flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                Expired
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
                            <span className="font-mono text-slate-300">{doc.fileName}</span>
                            <span>•</span>
                            <span>{formatFileSize(doc.fileSizeBytes)}</span>
                            {doc.expirationDate && (
                              <>
                                <span>•</span>
                                <span>Expires: {doc.expirationDate}</span>
                              </>
                            )}
                          </div>

                          {/* Claim Check Handle Tag */}
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-[10px] text-slate-400">Handle:</span>
                            <button
                              type="button"
                              onClick={() => handleCopyHandle(doc.id)}
                              className="font-mono text-[11px] px-2 py-0.5 rounded bg-indigo-950/70 border border-indigo-800/80 text-indigo-300 hover:bg-indigo-900/90 transition cursor-pointer flex items-center gap-1"
                              title="Click to copy claim-check handle ID"
                            >
                              <span>{doc.id}</span>
                              {copiedHandle === doc.id && (
                                <span className="text-[9px] text-emerald-400 ml-1">Copied!</span>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Document Actions */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => setSelectedDocForPreview(doc)}
                          className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5 text-cyan-400" />
                          <span>Preview</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveDoc(doc.id)}
                          className="p-1.5 rounded-lg hover:bg-rose-950/60 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                          title="Remove document from vault"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Document Inspector & Preview Modal */}
      {selectedDocForPreview && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-indigo-950 border border-indigo-800 flex items-center justify-center text-indigo-400">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-100">Document Inspector</h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Handle: {selectedDocForPreview.id}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDocForPreview(null)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Synthetic Document Visual Card */}
            <div
              className={`rounded-xl p-5 border flex flex-col justify-between min-h-[160px] shadow-inner ${
                selectedDocForPreview.isValid
                  ? 'bg-gradient-to-br from-indigo-950/80 via-slate-950 to-slate-900 border-indigo-800/80 text-indigo-100'
                  : selectedDocForPreview.isIllegible
                  ? 'bg-gradient-to-br from-amber-950/60 via-slate-950 to-slate-900 border-amber-800/80 text-amber-200 filter blur-[0.6px]'
                  : 'bg-gradient-to-br from-rose-950/60 via-slate-950 to-slate-900 border-rose-800/80 text-rose-200'
              }`}
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="font-bold text-xs uppercase tracking-wider">
                  {profile.universityName}
                </span>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-black/40">
                  {selectedDocForPreview.docType}
                </span>
              </div>

              <div className="py-3 flex flex-col gap-1">
                <h4 className="text-base font-bold text-white">{profile.fullName}</h4>
                <p className="text-xs font-mono opacity-90">{selectedDocForPreview.title}</p>
                {selectedDocForPreview.previewText && (
                  <p className="text-[11px] opacity-75 font-mono mt-1">
                    {selectedDocForPreview.previewText}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[10px] font-mono">
                <span>Issued: {selectedDocForPreview.issueDate}</span>
                <span>
                  {selectedDocForPreview.expirationDate
                    ? `Exp: ${selectedDocForPreview.expirationDate}`
                    : 'Valid Enrollment'}
                </span>
              </div>
            </div>

            {/* Technical Handle Claim-Check Specs */}
            <div className="bg-slate-950 rounded-xl p-3.5 border border-slate-800/80 flex flex-col gap-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Claim-Check Handle:</span>
                <span className="font-mono text-indigo-300">{selectedDocForPreview.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">File Type / MIME:</span>
                <span className="font-mono text-slate-300">{selectedDocForPreview.mimeType}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Binary Size:</span>
                <span className="font-mono text-slate-300">
                  {formatFileSize(selectedDocForPreview.fileSizeBytes)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Verification Validity:</span>
                <span
                  className={`font-semibold ${
                    selectedDocForPreview.isValid ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {selectedDocForPreview.isValid
                    ? 'Valid & Ready for Verification'
                    : selectedDocForPreview.isIllegible
                    ? 'Rejected (ILLEGIBLE_DOCUMENT)'
                    : 'Rejected (EXPIRED_DOCUMENT)'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedDocForPreview(null)}
              className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition cursor-pointer"
            >
              Close Preview
            </button>
          </div>
        </div>
      )}

      {/* Add Custom Document Modal */}
      {showAddDocModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateCustomDoc}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl flex flex-col gap-4"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <UploadCloud className="h-5 w-5 text-indigo-400" />
                <h3 className="text-sm font-semibold text-slate-100">Add Custom Document</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddDocModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <div>
                <label htmlFor={customDocTypeSelectId} className="block text-slate-400 mb-1">
                  Document Type
                </label>
                <select
                  id={customDocTypeSelectId}
                  value={customDocType}
                  onChange={(e) => setCustomDocType(e.target.value as DocumentType)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="STUDENT_ID">Student ID Card (STUDENT_ID)</option>
                  <option value="CLASS_SCHEDULE">Class Schedule (CLASS_SCHEDULE)</option>
                  <option value="TUITION_RECEIPT">Tuition Receipt (TUITION_RECEIPT)</option>
                  <option value="TRANSCRIPT">Official Transcript (TRANSCRIPT)</option>
                </select>
              </div>

              <div>
                <label htmlFor={customTitleInputId} className="block text-slate-400 mb-1">
                  Document Title
                </label>
                <input
                  id={customTitleInputId}
                  type="text"
                  placeholder="e.g. Official Fall 2026 Transcript"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label htmlFor={customFileNameInputId} className="block text-slate-400 mb-1">
                  File Name
                </label>
                <input
                  id={customFileNameInputId}
                  type="text"
                  placeholder="e.g. official_transcript.pdf"
                  value={customFileName}
                  onChange={(e) => setCustomFileName(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor={customIssueDateInputId} className="block text-slate-400 mb-1">
                    Issue Date
                  </label>
                  <input
                    id={customIssueDateInputId}
                    type="date"
                    value={customIssueDate}
                    onChange={(e) => setCustomIssueDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor={customExpDateInputId} className="block text-slate-400 mb-1">
                    Expiration Date
                  </label>
                  <input
                    id={customExpDateInputId}
                    type="date"
                    value={customExpirationDate}
                    onChange={(e) => setCustomExpirationDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  id={customIsValidInputId}
                  type="checkbox"
                  checked={customIsValid}
                  onChange={(e) => setCustomIsValid(e.target.checked)}
                  className="rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-0 cursor-pointer"
                />
                <label htmlFor={customIsValidInputId} className="text-slate-300 cursor-pointer">
                  Valid active document
                </label>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddDocModal(false)}
                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-md shadow-indigo-600/20 cursor-pointer"
              >
                Add to Vault
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
