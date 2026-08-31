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

  const getFormatLabel = (doc: VaultDocument) => {
    if (doc.mimeType.includes('pdf')) return 'PDF';
    if (doc.mimeType.includes('jpeg') || doc.fileName.endsWith('.jpg') || doc.fileName.endsWith('.jpeg')) return 'JPEG';
    if (doc.mimeType.includes('png') || doc.fileName.endsWith('.png')) return 'PNG';
    return doc.mimeType.split('/')[1]?.toUpperCase() || 'FILE';
  };

  return (
    <div className="flex flex-col gap-6 w-full text-neutral-900 font-sans">
      {/* Editorial Header Banner */}
      <div className="bg-[#fbf9f4] border-2 border-neutral-900 rounded-md p-5 sm:p-6 shadow-[3px_3px_0px_0px_#000] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="h-12 w-12 rounded-md bg-[#0070f3] border-2 border-neutral-900 flex items-center justify-center text-white shrink-0 shadow-[2px_2px_0px_0px_#000]">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
                Student Identity Vault
              </h1>
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded-sm bg-black text-white border border-neutral-900">
                Client Sandbox
              </span>
            </div>
            <p className="text-xs sm:text-sm text-neutral-700 mt-1">
              Zero-PII local credential vault & multi-persona verification benchmark harness.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-neutral-900 bg-[#f4efe4] px-3.5 py-2 rounded-sm border border-neutral-900 shadow-[2px_2px_0px_0px_#000] shrink-0">
          <Lock className="h-4 w-4 text-emerald-700" />
          <span className="font-bold">Claim-Check Active</span>
        </div>
      </div>

      {/* Zero-PII Security Architecture Guarantee Card */}
      <div className="bg-[#f4efe4] border-2 border-neutral-900 rounded-md p-5 shadow-[3px_3px_0px_0px_#000] flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-neutral-900/40 pb-2.5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-800" />
            <h2 className="text-sm font-bold font-serif uppercase tracking-wider text-neutral-900">
              Zero-PII Claim-Check Architecture
            </h2>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-100 text-emerald-900 border border-neutral-900 font-bold uppercase">
            Client-Side Verified
          </span>
        </div>

        <p className="text-xs text-neutral-800 leading-relaxed">
          Raw binaries remain sandboxed in browser. AI agents only inspect sanitized metadata handles under 300 chars.
          All sensitive documents (passports, student IDs, transcripts) are isolated in local browser memory and IndexedDB.
        </p>

        {/* 3 Pillar Architectural Feature Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="bg-white border border-neutral-900 p-3 rounded-sm shadow-[2px_2px_0px_0px_#000] flex flex-col gap-1">
            <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-neutral-900">
              <HardDrive className="h-3.5 w-3.5 text-[#0070f3]" />
              <span>Local Memory Sandbox</span>
            </div>
            <p className="text-[11px] text-neutral-600 leading-snug">
              Binary Blobs are created and stored strictly in browser memory, never leaked to backend servers.
            </p>
          </div>

          <div className="bg-white border border-neutral-900 p-3 rounded-sm shadow-[2px_2px_0px_0px_#000] flex flex-col gap-1">
            <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-neutral-900">
              <Database className="h-3.5 w-3.5 text-emerald-700" />
              <span>Claim-Check Handles</span>
            </div>
            <p className="text-[11px] text-neutral-600 leading-snug">
              AI agents query compact handles (e.g. <code className="font-mono bg-neutral-100 px-1">doc_handle_token</code>) instead of bulky raw Base64 data.
            </p>
          </div>

          <div className="bg-white border border-neutral-900 p-3 rounded-sm shadow-[2px_2px_0px_0px_#000] flex flex-col gap-1">
            <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-neutral-900">
              <Layers className="h-3.5 w-3.5 text-purple-700" />
              <span>Direct Pre-Signed Upload</span>
            </div>
            <p className="text-[11px] text-neutral-600 leading-snug">
              Verifications upload directly from sandbox to registrar endpoints bypassing cloud LLM context windows.
            </p>
          </div>
        </div>
      </div>

      {/* Demo Persona Switcher Cards Section */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-neutral-900 pb-1.5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#0070f3]" />
            <h2 className="font-serif text-base sm:text-lg font-bold text-neutral-900">
              Interactive Demo Student Presets
            </h2>
          </div>
          <span className="text-xs font-mono text-neutral-600">
            Switch persona to test automated recovery workflows
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {presets.map((preset) => {
            const isActive = vaultState.activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSwitchPreset(preset.id)}
                className={`text-left p-4 rounded-md border-2 transition-all relative flex flex-col justify-between gap-3 cursor-pointer ${
                  isActive
                    ? 'bg-[#18181b] text-white border-neutral-900 shadow-[4px_4px_0px_0px_#0070f3] -translate-x-0.5 -translate-y-0.5'
                    : 'bg-[#fbf9f4] hover:bg-white text-neutral-900 border-neutral-900 shadow-[3px_3px_0px_0px_#000] hover:shadow-[4px_4px_0px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="font-serif font-bold text-sm leading-tight">
                      {preset.name}
                    </span>
                    <span
                      className={`text-[9px] uppercase font-mono font-bold px-1.5 py-0.5 rounded-sm border ${
                        isActive
                          ? 'bg-[#0070f3] text-white border-white'
                          : 'bg-[#f4efe4] text-neutral-900 border-neutral-900'
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
                  <p className={`text-[11px] truncate ${isActive ? 'text-neutral-300' : 'text-neutral-600'}`}>
                    {preset.universityName}
                  </p>
                </div>

                <div className={`pt-2.5 border-t text-[11px] ${
                  isActive ? 'border-neutral-700 text-cyan-300' : 'border-neutral-900/20 text-neutral-800'
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
        {/* Left Column: Student Identity Profile Card (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-[#fbf9f4] border-2 border-neutral-900 rounded-md p-5 flex flex-col gap-4 shadow-[3px_3px_0px_0px_#000]">
            <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-sm bg-[#f4efe4] border border-neutral-900 flex items-center justify-center text-neutral-900 shadow-[1px_1px_0px_0px_#000]">
                  <IdCard className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold font-serif uppercase tracking-wider text-neutral-900">
                    Student Profile
                  </h3>
                  <span className="text-[10px] text-neutral-600 font-mono">Local Browser Vault</span>
                </div>
              </div>

              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-sm bg-neutral-900 text-white border border-neutral-900">
                {activePreset.id}
              </span>
            </div>

            {/* Profile Avatar and Name Card */}
            <div className="flex items-center gap-3.5 bg-white p-3.5 rounded-sm border-2 border-neutral-900 shadow-[2px_2px_0px_0px_#000]">
              <div className="h-14 w-14 rounded-sm bg-[#f4efe4] border-2 border-neutral-900 flex flex-col items-center justify-center font-serif font-bold text-lg text-neutral-900 shadow-[1px_1px_0px_0px_#000] shrink-0">
                <span>{profile.firstName[0]}{profile.lastName[0]}</span>
                <span className="text-[8px] font-mono uppercase tracking-widest text-neutral-500">ID</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-bold text-neutral-900 truncate font-serif">{profile.fullName}</h4>
                  <span className="text-[9px] font-mono px-1 py-0.2 bg-emerald-100 text-emerald-900 border border-neutral-900 font-bold">
                    Active
                  </span>
                </div>
                <p className="text-xs text-neutral-700 truncate font-medium">{profile.universityName}</p>
                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-sm bg-[#f4efe4] text-neutral-900 border border-neutral-900">
                    Class of {profile.graduationYear}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-neutral-100 text-neutral-700 border border-neutral-300">
                    {profile.academicLevel}
                  </span>
                </div>
              </div>
            </div>

            {/* Profile Attributes List */}
            <div className="flex flex-col gap-2 text-xs bg-white p-3 rounded-sm border border-neutral-900 shadow-[2px_2px_0px_0px_#000]">
              <div className="flex items-center justify-between py-1 border-b border-neutral-200">
                <span className="text-neutral-600 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-neutral-700" />
                  <span>Student Email</span>
                </span>
                <span className="font-mono text-neutral-900 font-medium truncate max-w-[160px]" title={profile.email}>
                  {profile.email}
                </span>
              </div>

              {profile.studentIdNumber && (
                <div className="flex items-center justify-between py-1 border-b border-neutral-200">
                  <span className="text-neutral-600 flex items-center gap-1.5">
                    <Key className="h-3.5 w-3.5 text-neutral-700" />
                    <span>Student ID Number</span>
                  </span>
                  <span className="font-mono text-neutral-900 font-bold bg-[#f4efe4] px-1.5 py-0.2 border border-neutral-900 text-[11px]">
                    {profile.studentIdNumber}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between py-1 border-b border-neutral-200">
                <span className="text-neutral-600 flex items-center gap-1.5">
                  <School className="h-3.5 w-3.5 text-neutral-700" />
                  <span>Institution ID</span>
                </span>
                <span className="font-mono text-neutral-900">{profile.universityId}</span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-neutral-600 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-neutral-700" />
                  <span>Date of Birth</span>
                </span>
                <span className="font-mono text-neutral-900">{profile.birthDate}</span>
              </div>
            </div>

            {/* Test Scenario Note Box */}
            <div className="bg-[#f4efe4] rounded-sm p-3 border border-neutral-900 shadow-[2px_2px_0px_0px_#000] text-xs text-neutral-800 flex items-start gap-2">
              <Info className="h-4 w-4 text-[#0070f3] shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-bold text-neutral-900">Test Scenario: </span>
                <span>{activePreset.testScenario}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Stored Proof Assets Table (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="bg-[#fbf9f4] border-2 border-neutral-900 rounded-md p-5 flex flex-col gap-4 shadow-[3px_3px_0px_0px_#000]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-neutral-900 pb-3 gap-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-sm bg-[#f4efe4] border border-neutral-900 flex items-center justify-center text-neutral-900 shadow-[1px_1px_0px_0px_#000]">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold font-serif uppercase tracking-wider text-neutral-900">
                    Academic Proof Assets & Handles ({documents.length})
                  </h3>
                  <span className="text-[10px] text-neutral-600 font-mono">
                    Zero-PII Claim-Check Registry
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAddDocModal(true)}
                className="py-1.5 px-3 rounded-sm bg-[#0070f3] hover:bg-[#005bb5] text-white font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer border border-neutral-900 shadow-[2px_2px_0px_0px_#000] hover:shadow-[3px_3px_0px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Document</span>
              </button>
            </div>

            {/* Proof Assets Table / List */}
            {documents.length === 0 ? (
              <div className="py-8 text-center text-neutral-600 text-xs bg-white border border-neutral-900 rounded-sm">
                No documents found in vault. Switch preset or upload a custom file.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {documents.map((doc) => {
                  const format = getFormatLabel(doc);
                  return (
                    <div
                      key={doc.id}
                      className="bg-white border-2 border-neutral-900 rounded-sm p-3.5 shadow-[2px_2px_0px_0px_#000] hover:shadow-[3px_3px_0px_0px_#000] transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="h-10 w-10 rounded-sm bg-[#f4efe4] border border-neutral-900 flex flex-col items-center justify-center text-neutral-900 shrink-0 shadow-[1px_1px_0px_0px_#000]">
                          <FileCode className="h-4 w-4 text-neutral-800" />
                          <span className="text-[8px] font-mono font-bold uppercase">{format}</span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="font-bold text-xs text-neutral-900 font-serif">{doc.title}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-sm bg-neutral-100 text-neutral-800 border border-neutral-900">
                              {doc.docType}
                            </span>
                            {doc.isValid ? (
                              <span className="text-[10px] font-mono font-bold px-2 py-0.2 rounded-sm bg-emerald-100 text-emerald-900 border border-neutral-900 flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" />
                                Valid
                              </span>
                            ) : doc.isIllegible ? (
                              <span className="text-[10px] font-mono font-bold px-2 py-0.2 rounded-sm bg-amber-100 text-amber-900 border border-neutral-900 flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                Low Resolution
                              </span>
                            ) : (
                              <span className="text-[10px] font-mono font-bold px-2 py-0.2 rounded-sm bg-rose-100 text-rose-900 border border-neutral-900 flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                Expired
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-neutral-600">
                            <span className="font-mono text-neutral-900 font-medium">{doc.fileName}</span>
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
                            <span className="text-[10px] font-mono uppercase text-neutral-600">Handle:</span>
                            <button
                              type="button"
                              onClick={() => handleCopyHandle(doc.id)}
                              className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-sm bg-[#f4efe4] border border-neutral-900 text-neutral-900 hover:bg-neutral-200 transition cursor-pointer flex items-center gap-1 shadow-[1px_1px_0px_0px_#000]"
                              title="Click to copy claim-check handle ID"
                            >
                              <span>{doc.id}</span>
                              {copiedHandle === doc.id ? (
                                <span className="text-[9px] text-emerald-700 font-bold flex items-center gap-0.5 ml-1">
                                  <Check className="h-3 w-3" /> Copied!
                                </span>
                              ) : (
                                <Copy className="h-3 w-3 text-neutral-500 ml-0.5" />
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
                          className="py-1.5 px-3 rounded-sm bg-white hover:bg-neutral-100 text-neutral-900 text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer border border-neutral-900 shadow-[2px_2px_0px_0px_#000] hover:shadow-[3px_3px_0px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5"
                        >
                          <Eye className="h-3.5 w-3.5 text-[#0070f3]" />
                          <span>Preview</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveDoc(doc.id)}
                          className="p-1.5 rounded-sm bg-white hover:bg-rose-100 text-neutral-700 hover:text-rose-900 transition cursor-pointer border border-neutral-900 shadow-[1px_1px_0px_0px_#000]"
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#fbf9f4] border-2 border-neutral-900 rounded-md max-w-lg w-full p-6 shadow-[6px_6px_0px_0px_#000] flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-sm bg-[#0070f3] border-2 border-neutral-900 flex items-center justify-center text-white shadow-[1px_1px_0px_0px_#000]">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-serif font-bold text-neutral-900">Document Inspector</h3>
                  <p className="text-[11px] text-neutral-600 font-mono">
                    Claim-Check Handle: {selectedDocForPreview.id}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDocForPreview(null)}
                className="p-1.5 rounded-sm bg-white hover:bg-neutral-200 border border-neutral-900 shadow-[1px_1px_0px_0px_#000] text-neutral-900 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Synthetic Document Visual Card */}
            <div
              className={`rounded-sm p-5 border-2 border-neutral-900 flex flex-col justify-between min-h-[170px] shadow-[3px_3px_0px_0px_#000] ${
                selectedDocForPreview.isValid
                  ? 'bg-gradient-to-br from-white via-[#fbf9f4] to-[#f4efe4] text-neutral-900'
                  : selectedDocForPreview.isIllegible
                  ? 'bg-gradient-to-br from-amber-50 to-amber-100 text-amber-950 filter blur-[0.4px]'
                  : 'bg-gradient-to-br from-rose-50 to-rose-100 text-rose-950'
              }`}
            >
              <div className="flex items-center justify-between border-b border-neutral-900/30 pb-2">
                <span className="font-serif font-bold text-xs uppercase tracking-wider">
                  {profile.universityName}
                </span>
                <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded-sm bg-neutral-900 text-white border border-neutral-900">
                  {selectedDocForPreview.docType}
                </span>
              </div>

              <div className="py-3 flex flex-col gap-1">
                <h4 className="text-lg font-serif font-bold text-neutral-900">{profile.fullName}</h4>
                <p className="text-xs font-mono font-semibold text-neutral-800">{selectedDocForPreview.title}</p>
                {selectedDocForPreview.previewText && (
                  <p className="text-[11px] font-mono text-neutral-700 mt-1 bg-black/5 p-1.5 rounded-sm border border-neutral-900/10">
                    {selectedDocForPreview.previewText}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-neutral-900/30 text-[10px] font-mono font-semibold">
                <span>Issued: {selectedDocForPreview.issueDate}</span>
                <span>
                  {selectedDocForPreview.expirationDate
                    ? `Exp: ${selectedDocForPreview.expirationDate}`
                    : 'Valid Enrollment'}
                </span>
              </div>
            </div>

            {/* Technical Handle Claim-Check Specs */}
            <div className="bg-white rounded-sm p-4 border-2 border-neutral-900 shadow-[2px_2px_0px_0px_#000] flex flex-col gap-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-neutral-600 font-mono">Claim-Check Handle:</span>
                <span className="font-mono font-bold text-neutral-900 bg-[#f4efe4] px-1.5 py-0.2 border border-neutral-900">
                  {selectedDocForPreview.id}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-600 font-mono">File Type / MIME:</span>
                <span className="font-mono text-neutral-900">{selectedDocForPreview.mimeType}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-600 font-mono">Binary Size:</span>
                <span className="font-mono text-neutral-900">
                  {formatFileSize(selectedDocForPreview.fileSizeBytes)}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-neutral-200 pt-2 mt-1">
                <span className="text-neutral-600 font-mono">Verification Validity:</span>
                <span
                  className={`font-mono font-bold px-2 py-0.5 rounded-sm border border-neutral-900 text-[11px] ${
                    selectedDocForPreview.isValid
                      ? 'bg-emerald-100 text-emerald-900'
                      : selectedDocForPreview.isIllegible
                      ? 'bg-amber-100 text-amber-900'
                      : 'bg-rose-100 text-rose-900'
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
              className="w-full py-2 rounded-sm bg-neutral-900 hover:bg-neutral-800 text-white font-mono text-xs font-bold uppercase transition cursor-pointer border-2 border-neutral-900 shadow-[2px_2px_0px_0px_#000] hover:shadow-[3px_3px_0px_0px_#000]"
            >
              Close Preview
            </button>
          </div>
        </div>
      )}

      {/* Add Custom Document Modal */}
      {showAddDocModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateCustomDoc}
            className="bg-[#fbf9f4] border-2 border-neutral-900 rounded-md max-w-md w-full p-6 shadow-[6px_6px_0px_0px_#000] flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
              <div className="flex items-center gap-2">
                <UploadCloud className="h-5 w-5 text-[#0070f3]" />
                <h3 className="text-base font-serif font-bold text-neutral-900">Add Custom Document</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddDocModal(false)}
                className="p-1.5 rounded-sm bg-white hover:bg-neutral-200 border border-neutral-900 shadow-[1px_1px_0px_0px_#000] text-neutral-900 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <div>
                <label htmlFor={customDocTypeSelectId} className="block font-mono text-neutral-700 mb-1 font-bold">
                  Document Type
                </label>
                <select
                  id={customDocTypeSelectId}
                  value={customDocType}
                  onChange={(e) => setCustomDocType(e.target.value as DocumentType)}
                  className="w-full bg-white border border-neutral-900 rounded-sm p-2 text-neutral-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="STUDENT_ID">Student ID Card (STUDENT_ID)</option>
                  <option value="CLASS_SCHEDULE">Class Schedule (CLASS_SCHEDULE)</option>
                  <option value="TUITION_RECEIPT">Tuition Receipt (TUITION_RECEIPT)</option>
                  <option value="TRANSCRIPT">Official Transcript (TRANSCRIPT)</option>
                </select>
              </div>

              <div>
                <label htmlFor={customTitleInputId} className="block font-mono text-neutral-700 mb-1 font-bold">
                  Document Title
                </label>
                <input
                  id={customTitleInputId}
                  type="text"
                  placeholder="e.g. Official Fall 2026 Transcript"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  required
                  className="w-full bg-white border border-neutral-900 rounded-sm p-2 text-neutral-900 text-xs focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label htmlFor={customFileNameInputId} className="block font-mono text-neutral-700 mb-1 font-bold">
                  File Name
                </label>
                <input
                  id={customFileNameInputId}
                  type="text"
                  placeholder="e.g. official_transcript.pdf"
                  value={customFileName}
                  onChange={(e) => setCustomFileName(e.target.value)}
                  required
                  className="w-full bg-white border border-neutral-900 rounded-sm p-2 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-black font-mono text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor={customIssueDateInputId} className="block font-mono text-neutral-700 mb-1 font-bold">
                    Issue Date
                  </label>
                  <input
                    id={customIssueDateInputId}
                    type="date"
                    value={customIssueDate}
                    onChange={(e) => setCustomIssueDate(e.target.value)}
                    className="w-full bg-white border border-neutral-900 rounded-sm p-2 text-neutral-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
                <div>
                  <label htmlFor={customExpDateInputId} className="block font-mono text-neutral-700 mb-1 font-bold">
                    Expiration Date
                  </label>
                  <input
                    id={customExpDateInputId}
                    type="date"
                    value={customExpirationDate}
                    onChange={(e) => setCustomExpirationDate(e.target.value)}
                    className="w-full bg-white border border-neutral-900 rounded-sm p-2 text-neutral-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  id={customIsValidInputId}
                  type="checkbox"
                  checked={customIsValid}
                  onChange={(e) => setCustomIsValid(e.target.checked)}
                  className="rounded-none border-neutral-900 text-black focus:ring-0 cursor-pointer h-4 w-4"
                />
                <label htmlFor={customIsValidInputId} className="text-neutral-900 font-mono text-xs cursor-pointer font-bold">
                  Valid active document
                </label>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-neutral-900">
              <button
                type="button"
                onClick={() => setShowAddDocModal(false)}
                className="flex-1 py-2 rounded-sm bg-white hover:bg-neutral-100 text-neutral-900 font-mono text-xs font-bold border border-neutral-900 shadow-[2px_2px_0px_0px_#000] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-sm bg-[#0070f3] hover:bg-[#005bb5] text-white font-mono text-xs font-bold border border-neutral-900 shadow-[2px_2px_0px_0px_#000] hover:shadow-[3px_3px_0px_0px_#000] cursor-pointer"
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
