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
  Copy,
  Check,
  Layers,
  Database,
  HardDrive,
  FileCode,
  School,
  IdCard,
  GraduationCap,
  Award,
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
    setVaultState(vault.getState());
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

  const getFormatLabel = (doc: VaultDocument) => {
    if (doc.mimeType.includes('pdf')) return 'PDF';
    if (doc.mimeType.includes('jpeg') || doc.fileName.endsWith('.jpg') || doc.fileName.endsWith('.jpeg')) return 'JPEG';
    if (doc.mimeType.includes('png') || doc.fileName.endsWith('.png')) return 'PNG';
    return doc.mimeType.split('/')[1]?.toUpperCase() || 'FILE';
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto text-stone-900 font-sans pb-16">
      {/* Editorial Header Banner */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-7 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="flex items-start sm:items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-blue-50 border border-blue-200 text-[#2563EB] flex items-center justify-center shrink-0 shadow-xs">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
                Student Identity Vault
              </h1>
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 text-[#2563EB] border border-blue-200">
                Client Sandbox
              </span>
            </div>
            <p className="text-xs sm:text-sm text-stone-600 mt-1">
              Zero-PII local credential vault &amp; multi-persona verification benchmark harness.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-stone-800 bg-[#FAF9F6] px-4 py-2 rounded-xl border border-stone-200 shadow-xs shrink-0">
          <Lock className="h-4 w-4 text-emerald-600" />
          <span className="font-semibold">Claim-Check Active</span>
        </div>
      </div>

      {/* Zero-PII Security Architecture Guarantee Card */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <h2 className="text-sm font-serif font-bold uppercase tracking-wider text-stone-900">
              Zero-PII Claim-Check Architecture
            </h2>
          </div>
          <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full uppercase">
            Client-Side Verified
          </span>
        </div>

        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          Raw binaries remain sandboxed in browser. AI agents only inspect sanitized metadata handles under 300 chars.
          All sensitive documents (student IDs, tuition receipts, transcripts) are isolated in local browser memory and IndexedDB.
        </p>

        {/* 3 Pillar Architectural Feature Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div className="bg-[#FAF9F6] border border-stone-200 p-4 rounded-xl shadow-xs flex flex-col gap-1.5">
            <div className="flex items-center gap-2 font-semibold text-xs text-stone-900">
              <HardDrive className="h-4 w-4 text-[#2563EB]" />
              <span>Local Memory Sandbox</span>
            </div>
            <p className="text-xs text-stone-500 leading-snug">
              Binary Blobs are created and stored strictly in browser memory, never leaked to backend servers.
            </p>
          </div>

          <div className="bg-[#FAF9F6] border border-stone-200 p-4 rounded-xl shadow-xs flex flex-col gap-1.5">
            <div className="flex items-center gap-2 font-semibold text-xs text-stone-900">
              <Database className="h-4 w-4 text-emerald-600" />
              <span>Claim-Check Handles</span>
            </div>
            <p className="text-xs text-stone-500 leading-snug">
              AI agents query compact handles (e.g. <code className="font-mono text-[#2563EB] bg-white px-1 rounded">doc_handle_token</code>) instead of bulky raw Base64 data.
            </p>
          </div>

          <div className="bg-[#FAF9F6] border border-stone-200 p-4 rounded-xl shadow-xs flex flex-col gap-1.5">
            <div className="flex items-center gap-2 font-semibold text-xs text-stone-900">
              <Layers className="h-4 w-4 text-purple-600" />
              <span>Direct Pre-Signed Upload</span>
            </div>
            <p className="text-xs text-stone-500 leading-snug">
              Verifications upload directly from sandbox to registrar endpoints bypassing cloud LLM context windows.
            </p>
          </div>
        </div>
      </div>

      {/* Demo Persona Switcher Cards Section */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-stone-200 pb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#2563EB]" />
            <h2 className="font-serif text-lg sm:text-xl font-bold text-stone-900">
              Interactive Demo Student Presets
            </h2>
          </div>
          <span className="text-xs font-mono text-stone-500">
            Switch persona to test automated recovery workflows
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {presets.map((preset) => {
            const isActive = vaultState.activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSwitchPreset(preset.id)}
                className={`text-left p-5 rounded-2xl border transition-all relative flex flex-col justify-between gap-3.5 cursor-pointer ${
                  isActive
                    ? 'bg-stone-900 text-white border-stone-900 shadow-md ring-2 ring-[#2563EB]'
                    : 'bg-white hover:bg-stone-50 text-stone-900 border-stone-200 shadow-sm hover:shadow'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className="font-serif font-bold text-sm sm:text-base leading-tight">
                      {preset.name}
                    </span>
                    <span
                      className={`text-[9px] uppercase font-mono font-bold px-2 py-0.5 rounded-full border ${
                        isActive
                          ? 'bg-[#2563EB] text-white border-blue-400'
                          : 'bg-stone-100 text-stone-700 border-stone-200'
                      }`}
                    >
                      {preset.badge}
                    </span>
                  </div>

                  {/* Student Legal Name & University */}
                  <div className="flex items-center gap-1.5 text-xs font-semibold mb-0.5">
                    <User className="h-3.5 w-3.5 shrink-0 opacity-80" />
                    <span className="truncate">{preset.profile.fullName}</span>
                  </div>
                  <p className={`text-xs truncate ${isActive ? 'text-stone-300' : 'text-stone-500'}`}>
                    {preset.universityName}
                  </p>
                </div>

                <div className={`pt-3 border-t text-xs ${
                  isActive ? 'border-stone-700 text-cyan-300' : 'border-stone-100 text-stone-600'
                }`}>
                  <p className="font-medium leading-snug">{preset.tagline}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Student Vault Body Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Realistic Student ID Card & Profile (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Realistic Student ID Card Widget */}
          <div className="bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 text-white rounded-2xl p-6 shadow-md border border-blue-600 relative overflow-hidden flex flex-col justify-between min-h-[260px]">
            {/* Watermark Crest */}
            <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none select-none">
              <GraduationCap className="h-56 w-56 text-white" />
            </div>

            {/* University Card Header */}
            <div className="flex items-center justify-between border-b border-white/20 pb-3 relative z-10">
              <div className="flex items-center gap-2">
                <School className="h-5 w-5 text-blue-200" />
                <span className="font-serif font-bold text-sm tracking-wide uppercase">
                  {profile.universityName}
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/30">
                STUDENT ID
              </span>
            </div>

            {/* Card Middle: Avatar & Credentials */}
            <div className="flex items-center gap-4 py-4 relative z-10">
              <div className="h-16 w-16 rounded-xl bg-white/10 border-2 border-white/40 flex flex-col items-center justify-center font-serif font-bold text-xl text-white shadow-inner shrink-0 backdrop-blur-xs">
                <span>{`${profile.firstName[0]}${profile.lastName[0]}`}</span>
                <span className="text-[8px] font-mono tracking-widest text-blue-200 mt-0.5">PHOTO</span>
              </div>

              <div className="min-w-0 flex-1 flex flex-col gap-0.5">
                <h3 className="font-serif font-bold text-lg text-white leading-tight truncate">
                  {profile.fullName}
                </h3>
                <div className="flex items-center gap-2 text-xs text-blue-100 font-mono">
                  <span>ID #{profile.studentIdNumber || '2026-ACTIVE'}</span>
                  <span>•</span>
                  <span>Class of {profile.graduationYear}</span>
                </div>
                <span className="text-[11px] text-blue-200 truncate mt-0.5 font-sans">
                  Academic Status: Active Enrollment
                </span>
              </div>
            </div>

            {/* Card Footer: Security Hologram & Status */}
            <div className="flex items-center justify-between pt-3 border-t border-white/20 text-[10px] font-mono relative z-10">
              <div className="flex items-center gap-1.5 text-emerald-300 font-semibold">
                <Award className="h-3.5 w-3.5" />
                <span>OFFICIAL ENROLLMENT VERIFIED</span>
              </div>
              <span className="text-blue-200">
                {profile.academicLevel}
              </span>
            </div>
          </div>

          {/* Student Profile Details Card */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <IdCard className="h-4 w-4 text-[#2563EB]" />
                <h3 className="text-xs font-serif font-bold uppercase tracking-wider text-stone-900">
                  Profile Attributes
                </h3>
              </div>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700">
                {activePreset.id}
              </span>
            </div>

            <div className="flex flex-col gap-2.5 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-stone-100">
                <span className="text-stone-500 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-stone-400" />
                  <span>Student Email</span>
                </span>
                <span className="font-mono text-stone-900 font-medium truncate max-w-[170px]" title={profile.email}>
                  {profile.email}
                </span>
              </div>

              {profile.studentIdNumber && (
                <div className="flex items-center justify-between py-1 border-b border-stone-100">
                  <span className="text-stone-500 flex items-center gap-1.5">
                    <Key className="h-3.5 w-3.5 text-stone-400" />
                    <span>Student ID Number</span>
                  </span>
                  <span className="font-mono text-stone-900 font-semibold bg-stone-100 px-2 py-0.5 rounded text-[11px]">
                    {profile.studentIdNumber}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between py-1 border-b border-stone-100">
                <span className="text-stone-500 flex items-center gap-1.5">
                  <School className="h-3.5 w-3.5 text-stone-400" />
                  <span>Institution ID</span>
                </span>
                <span className="font-mono text-stone-900">{profile.universityId}</span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-stone-500 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-stone-400" />
                  <span>Date of Birth</span>
                </span>
                <span className="font-mono text-stone-900">{profile.birthDate}</span>
              </div>
            </div>

            {/* Test Scenario Note */}
            <div className="bg-[#FAF9F6] rounded-xl p-3.5 border border-stone-200 text-xs text-stone-700 flex items-start gap-2.5">
              <Info className="h-4 w-4 text-[#2563EB] shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-semibold text-stone-900">Test Scenario: </span>
                <span>{activePreset.testScenario}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Academic Proof Assets & Handles Table (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-100 pb-3.5 gap-3">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-serif font-bold tracking-tight text-stone-900">
                    Academic Proof Assets &amp; Handles ({documents.length})
                  </h3>
                  <span className="text-[11px] text-stone-500 font-mono">
                    Zero-PII Claim-Check Registry
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAddDocModal(true)}
                className="py-2 px-3.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm active:scale-98"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Document</span>
              </button>
            </div>

            {/* Proof Assets Table / List */}
            {documents.length === 0 ? (
              <div className="py-12 text-center text-stone-500 text-xs bg-[#FAF9F6] border border-stone-200 rounded-xl">
                No documents found in vault. Switch persona or upload a custom file.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {documents.map((doc) => {
                  const format = getFormatLabel(doc);
                  return (
                    <div
                      key={doc.id}
                      className="bg-[#FAF9F6] border border-stone-200 rounded-xl p-4 shadow-xs hover:border-stone-300 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5"
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="h-10 w-10 rounded-xl bg-white border border-stone-200 flex flex-col items-center justify-center text-stone-800 shrink-0 shadow-xs">
                          <FileCode className="h-4 w-4 text-[#2563EB]" />
                          <span className="text-[8px] font-mono font-bold uppercase mt-0.5">{format}</span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="font-semibold text-xs text-stone-900">{doc.title}</span>
                            <span className="text-[10px] font-mono px-2 py-0.2 rounded-md bg-stone-200/70 text-stone-700 font-medium">
                              {doc.docType}
                            </span>
                            {doc.isValid ? (
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                <CheckCircle className="h-3 w-3 text-emerald-600" />
                                Valid
                              </span>
                            ) : doc.isIllegible ? (
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                                <AlertCircle className="h-3 w-3 text-amber-600" />
                                Low Resolution
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-1">
                                <AlertCircle className="h-3 w-3 text-rose-600" />
                                Expired
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-stone-500">
                            <span className="font-mono text-stone-800 font-medium">{doc.fileName}</span>
                            <span>•</span>
                            <span className="font-mono">{formatFileSize(doc.fileSizeBytes)}</span>
                            <span>•</span>
                            <span className="font-mono">Issued: {doc.issueDate}</span>
                            {doc.expirationDate && (
                              <>
                                <span>•</span>
                                <span className="font-mono">Expires: {doc.expirationDate}</span>
                              </>
                            )}
                          </div>

                          {/* Claim Check Handle Tag */}
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-[10px] font-mono uppercase text-stone-500">Handle:</span>
                            <button
                              type="button"
                              onClick={() => handleCopyHandle(doc.id)}
                              className="font-mono text-[11px] font-semibold px-2.5 py-0.5 rounded-lg bg-white border border-stone-200 text-stone-900 hover:bg-stone-100 transition cursor-pointer flex items-center gap-1 shadow-xs"
                              title="Click to copy claim-check handle ID"
                            >
                              <span>{doc.id}</span>
                              {copiedHandle === doc.id ? (
                                <span className="text-[9px] text-emerald-700 font-bold flex items-center gap-0.5 ml-1">
                                  <Check className="h-3 w-3" /> Copied!
                                </span>
                              ) : (
                                <Copy className="h-3 w-3 text-stone-400 ml-0.5" />
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
                          className="py-1.5 px-3 rounded-lg bg-white hover:bg-stone-50 text-stone-800 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer border border-stone-200 shadow-xs"
                        >
                          <Eye className="h-3.5 w-3.5 text-[#2563EB]" />
                          <span>Preview</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveDoc(doc.id)}
                          className="p-1.5 rounded-lg bg-white hover:bg-rose-50 text-stone-500 hover:text-rose-700 transition cursor-pointer border border-stone-200 shadow-xs"
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
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FAF9F6] border border-stone-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-blue-50 border border-blue-200 text-[#2563EB] flex items-center justify-center shadow-xs">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-serif font-bold text-stone-900">Document Inspector</h3>
                  <p className="text-[11px] text-stone-500 font-mono">
                    Claim-Check Handle: {selectedDocForPreview.id}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDocForPreview(null)}
                className="p-1.5 rounded-lg bg-white hover:bg-stone-100 border border-stone-200 shadow-xs text-stone-700 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Synthetic Document Visual Card */}
            <div
              className={`rounded-2xl p-5 border flex flex-col justify-between min-h-[170px] shadow-xs ${
                selectedDocForPreview.isValid
                  ? 'bg-white border-stone-200 text-stone-900'
                  : selectedDocForPreview.isIllegible
                  ? 'bg-amber-50 border-amber-200 text-amber-950 filter blur-[0.4px]'
                  : 'bg-rose-50 border-rose-200 text-rose-950'
              }`}
            >
              <div className="flex items-center justify-between border-b border-stone-200/60 pb-2">
                <span className="font-serif font-bold text-xs uppercase tracking-wider">
                  {profile.universityName}
                </span>
                <span className="text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded-full bg-stone-100 text-stone-800 border border-stone-200">
                  {selectedDocForPreview.docType}
                </span>
              </div>

              <div className="py-3 flex flex-col gap-1">
                <h4 className="text-lg font-serif font-bold text-stone-900">{profile.fullName}</h4>
                <p className="text-xs font-mono font-semibold text-stone-700">{selectedDocForPreview.title}</p>
                {selectedDocForPreview.previewText && (
                  <p className="text-[11px] font-mono text-stone-600 mt-1 bg-stone-100 p-2 rounded-lg border border-stone-200">
                    {selectedDocForPreview.previewText}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-stone-200/60 text-[10px] font-mono font-semibold text-stone-500">
                <span>Issued: {selectedDocForPreview.issueDate}</span>
                <span>
                  {selectedDocForPreview.expirationDate
                    ? `Exp: ${selectedDocForPreview.expirationDate}`
                    : 'Valid Enrollment'}
                </span>
              </div>
            </div>

            {/* Technical Handle Claim-Check Specs */}
            <div className="bg-white rounded-xl p-4 border border-stone-200 shadow-xs flex flex-col gap-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-stone-500 font-mono">Claim-Check Handle:</span>
                <span className="font-mono font-semibold text-stone-900 bg-stone-100 px-2 py-0.5 rounded">
                  {selectedDocForPreview.id}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500 font-mono">File Type / MIME:</span>
                <span className="font-mono text-stone-900">{selectedDocForPreview.mimeType}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500 font-mono">Binary Size:</span>
                <span className="font-mono text-stone-900">
                  {formatFileSize(selectedDocForPreview.fileSizeBytes)}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-stone-100 pt-2 mt-1">
                <span className="text-stone-500 font-mono">Verification Validity:</span>
                <span
                  className={`font-mono font-semibold px-2.5 py-0.5 rounded-full text-[11px] ${
                    selectedDocForPreview.isValid
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : selectedDocForPreview.isIllegible
                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
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
              className="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs uppercase transition cursor-pointer shadow-sm"
            >
              Close Preview
            </button>
          </div>
        </div>
      )}

      {/* Add Custom Document Modal */}
      {showAddDocModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateCustomDoc}
            className="bg-[#FAF9F6] border border-stone-200 rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div className="flex items-center gap-2">
                <UploadCloud className="h-5 w-5 text-[#2563EB]" />
                <h3 className="text-base font-serif font-bold text-stone-900">Add Custom Document</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddDocModal(false)}
                className="p-1.5 rounded-lg bg-white hover:bg-stone-100 border border-stone-200 shadow-xs text-stone-700 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <div>
                <label htmlFor={customDocTypeSelectId} className="block font-semibold text-stone-700 mb-1">
                  Document Type
                </label>
                <select
                  id={customDocTypeSelectId}
                  value={customDocType}
                  onChange={(e) => setCustomDocType(e.target.value as DocumentType)}
                  className="w-full bg-white border border-stone-200 rounded-xl p-2.5 text-stone-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] shadow-xs"
                >
                  <option value="STUDENT_ID">Student ID Card (STUDENT_ID)</option>
                  <option value="CLASS_SCHEDULE">Class Schedule (CLASS_SCHEDULE)</option>
                  <option value="TUITION_RECEIPT">Tuition Receipt (TUITION_RECEIPT)</option>
                  <option value="TRANSCRIPT">Official Transcript (TRANSCRIPT)</option>
                </select>
              </div>

              <div>
                <label htmlFor={customTitleInputId} className="block font-semibold text-stone-700 mb-1">
                  Document Title
                </label>
                <input
                  id={customTitleInputId}
                  type="text"
                  placeholder="e.g. Official Fall 2026 Transcript"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  required
                  className="w-full bg-white border border-stone-200 rounded-xl p-2.5 text-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] shadow-xs"
                />
              </div>

              <div>
                <label htmlFor={customFileNameInputId} className="block font-semibold text-stone-700 mb-1">
                  File Name
                </label>
                <input
                  id={customFileNameInputId}
                  type="text"
                  placeholder="e.g. official_transcript.pdf"
                  value={customFileName}
                  onChange={(e) => setCustomFileName(e.target.value)}
                  required
                  className="w-full bg-white border border-stone-200 rounded-xl p-2.5 text-stone-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] shadow-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor={customIssueDateInputId} className="block font-semibold text-stone-700 mb-1">
                    Issue Date
                  </label>
                  <input
                    id={customIssueDateInputId}
                    type="date"
                    value={customIssueDate}
                    onChange={(e) => setCustomIssueDate(e.target.value)}
                    className="w-full bg-white border border-stone-200 rounded-xl p-2.5 text-stone-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] shadow-xs"
                  />
                </div>
                <div>
                  <label htmlFor={customExpDateInputId} className="block font-semibold text-stone-700 mb-1">
                    Expiration Date
                  </label>
                  <input
                    id={customExpDateInputId}
                    type="date"
                    value={customExpirationDate}
                    onChange={(e) => setCustomExpirationDate(e.target.value)}
                    className="w-full bg-white border border-stone-200 rounded-xl p-2.5 text-stone-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] shadow-xs"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  id={customIsValidInputId}
                  type="checkbox"
                  checked={customIsValid}
                  onChange={(e) => setCustomIsValid(e.target.checked)}
                  className="rounded border-stone-300 text-[#2563EB] focus:ring-0 cursor-pointer h-4 w-4"
                />
                <label htmlFor={customIsValidInputId} className="text-stone-800 font-medium text-xs cursor-pointer">
                  Valid active document
                </label>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setShowAddDocModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-white hover:bg-stone-50 text-stone-700 font-medium text-xs border border-stone-200 shadow-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium text-xs shadow-sm cursor-pointer transition"
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

