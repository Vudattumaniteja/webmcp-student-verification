import { useState, useEffect, useId } from 'react';
import { MerchantPerk } from '../types/merchants';
import {
  VerificationEngine,
  globalVerificationEngine,
  VerificationResult,
} from '../services/verificationEngine';
import { StudentVault, globalVault } from '../services/vault';
import { MerchantStore, globalMerchantStore } from '../services/merchantStore';
import {
  searchSchools,
  getSchoolById,
  ACCREDITED_UNIVERSITIES,
  School,
} from '../services/schoolSearch';
import { VaultDocument } from '../types/vault';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Search,
  Upload,
  Copy,
  Check,
  ExternalLink,
  ArrowRight,
  ArrowLeft,
  FileText,
  ShieldCheck,
  Zap,
  GraduationCap,
  RotateCcw,
  Loader2,
} from 'lucide-react';

export interface VerificationWizardModalProps {
  merchant: MerchantPerk | null;
  isOpen: boolean;
  onClose: () => void;
  engine?: VerificationEngine;
  vault?: StudentVault;
  store?: MerchantStore;
  onVerificationSuccess?: (merchantId: string, rewardCode: string) => void;
}

export type WizardStep =
  | 'UNIVERSITY_SELECT'
  | 'STUDENT_DETAILS'
  | 'DOCUMENT_PROOF'
  | 'VERIFYING'
  | 'REWARD_UNLOCKED';

export default function VerificationWizardModal({
  merchant,
  isOpen,
  onClose,
  engine = globalVerificationEngine,
  vault = globalVault,
  store = globalMerchantStore,
  onVerificationSuccess,
}: VerificationWizardModalProps) {
  // Wizard Navigation State
  const [currentStep, setCurrentStep] = useState<WizardStep>('UNIVERSITY_SELECT');
  const [activeVerificationId, setActiveVerificationId] = useState<string | null>(null);

  // Step 1: School Selection
  const [schoolSearchQuery, setSchoolSearchQuery] = useState('');
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);

  // Step 2: Student Details Form
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('2003-04-15');
  const [email, setEmail] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [autofillSuccess, setAutofillSuccess] = useState(false);

  // Step 3: Document Proof & Recovery
  const [vaultDocuments, setVaultDocuments] = useState<VaultDocument[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [customFile, setCustomFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [rejectionResult, setRejectionResult] = useState<VerificationResult | null>(null);

  // Step 4: Unlocked Reward State
  const [unlockedRewardCode, setUnlockedRewardCode] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState(false);

  // Form IDs for accessibility
  const firstNameInputId = useId();
  const lastNameInputId = useId();
  const birthDateInputId = useId();
  const emailInputId = useId();
  const schoolSearchInputId = useId();
  const fileUploadInputId = useId();

  // Initialize and synchronize with Vault
  useEffect(() => {
    if (isOpen) {
      const profile = vault.getProfile();
      const docs = vault.listDocuments();
      setVaultDocuments(docs);

      // Pre-fill default student data from active vault profile
      setFirstName(profile.firstName || '');
      setLastName(profile.lastName || '');
      setBirthDate(profile.birthDate || '2003-04-15');
      setEmail(profile.email || '');

      const matchedSchool =
        getSchoolById(profile.universityId) ||
        ACCREDITED_UNIVERSITIES.find(
          (s) => s.name.toLowerCase() === profile.universityName.toLowerCase(),
        ) ||
        ACCREDITED_UNIVERSITIES[1]; // Default to Stanford

      setSelectedSchool(matchedSchool || null);
      if (docs.length > 0) {
        setSelectedDocumentId(docs[0].id);
      }

      // Reset step
      setCurrentStep('UNIVERSITY_SELECT');
      setRejectionResult(null);
      setUploadProgress(0);
      setFormError(null);
      setAutofillSuccess(false);

      if (merchant && merchant.status === 'APPROVED' && merchant.rewardCode) {
        setUnlockedRewardCode(merchant.rewardCode);
        setCurrentStep('REWARD_UNLOCKED');
      }
    }
  }, [isOpen, merchant, vault]);

  if (!isOpen || !merchant) {
    return null;
  }

  // Filtered universities for autocomplete
  const filteredSchools = schoolSearchQuery.trim()
    ? searchSchools(schoolSearchQuery, { limit: 6 })
    : ACCREDITED_UNIVERSITIES.slice(0, 5);

  // Action: Autofill from Vault Persona
  const handleAutoFillFromVault = () => {
    const profile = vault.getProfile();
    const docs = vault.listDocuments();
    setVaultDocuments(docs);

    setFirstName(profile.firstName);
    setLastName(profile.lastName);
    setBirthDate(profile.birthDate);
    setEmail(profile.email);

    const school =
      getSchoolById(profile.universityId) ||
      ACCREDITED_UNIVERSITIES.find(
        (s) => s.name.toLowerCase() === profile.universityName.toLowerCase(),
      );
    if (school) {
      setSelectedSchool(school);
    }
    if (docs.length > 0) {
      setSelectedDocumentId(docs[0].id);
    }

    setAutofillSuccess(true);
    setTimeout(() => setAutofillSuccess(false), 2500);
  };

  // Step 1 -> Step 2
  const handleProceedToDetails = () => {
    if (!selectedSchool) {
      setFormError('Please select your accredited institution.');
      return;
    }
    setFormError(null);
    setCurrentStep('STUDENT_DETAILS');
  };

  // Step 2 -> Submit Student Details
  const handleSubmitDetails = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!selectedSchool) {
      setFormError('Please select your university.');
      return;
    }
    if (!firstName.trim() || !lastName.trim()) {
      setFormError('Please enter your legal first and last name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setFormError('Please enter a valid university (.edu) email address.');
      return;
    }

    setFormError(null);
    store.updateMerchantStatus(merchant.id, 'VERIFYING');

    try {
      const result = engine.submitPersonalInfo({
        schoolId: selectedSchool.id,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        birthDate,
        email: email.trim(),
        merchantId: merchant.id,
      });

      setActiveVerificationId(result.verificationId);

      // Check if instant registrar match
      if (result.status === 'APPROVED' && result.rewardCode) {
        setUnlockedRewardCode(result.rewardCode);
        store.updateMerchantStatus(merchant.id, 'APPROVED', result.rewardCode);
        if (onVerificationSuccess) {
          onVerificationSuccess(merchant.id, result.rewardCode);
        }
        setCurrentStep('REWARD_UNLOCKED');
      } else {
        // Document upload required
        const docs = vault.listDocuments();
        setVaultDocuments(docs);
        if (docs.length > 0 && !selectedDocumentId) {
          setSelectedDocumentId(docs[0].id);
        }
        setCurrentStep('DOCUMENT_PROOF');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFormError(msg);
    }
  };

  // Step 3 -> Submit Document Proof
  const handleSubmitDocument = async (docIdToUpload?: string) => {
    const docId = docIdToUpload || selectedDocumentId;
    if (!activeVerificationId) {
      setFormError('Verification session expired. Please re-enter student details.');
      setCurrentStep('STUDENT_DETAILS');
      return;
    }

    setFormError(null);
    setRejectionResult(null);
    setCurrentStep('VERIFYING');
    setUploadProgress(15);

    // Simulate pre-signed S3 binary upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 25;
      });
    }, 120);

    try {
      let docBlob: Blob | null = null;
      let docMetadata: VaultDocument | undefined;

      if (customFile) {
        docBlob = customFile;
        docMetadata = {
          id: `custom_${Date.now()}`,
          title: customFile.name,
          fileName: customFile.name,
          docType: 'STUDENT_ID',
          mimeType: customFile.type || 'application/pdf',
          fileSizeBytes: customFile.size,
          issueDate: new Date().toISOString().split('T')[0],
          isValid: true,
        };
      } else if (docId) {
        docBlob = await vault.getDocumentBlob(docId);
        docMetadata = vault.getDocumentMetadata(docId);
      }

      if (!docBlob) {
        clearInterval(progressInterval);
        setFormError('No document binary selected for upload.');
        setCurrentStep('DOCUMENT_PROOF');
        return;
      }

      // Finish simulated progress
      setTimeout(() => {
        clearInterval(progressInterval);
        setUploadProgress(100);

        try {
          const outcome = engine.uploadDocumentDirect(
            activeVerificationId,
            docBlob!,
            docMetadata,
          );

          if (outcome.status === 'APPROVED' && outcome.rewardCode) {
            setUnlockedRewardCode(outcome.rewardCode);
            store.updateMerchantStatus(merchant.id, 'APPROVED', outcome.rewardCode);
            if (onVerificationSuccess) {
              onVerificationSuccess(merchant.id, outcome.rewardCode);
            }
            setCurrentStep('REWARD_UNLOCKED');
          } else {
            // Rejection (Expired, Illegible, etc.)
            setRejectionResult(outcome);
            store.updateMerchantStatus(
              merchant.id,
              'ERROR',
              undefined,
              `${outcome.rejectionReason || 'Document rejected'} ${outcome.remedyText || ''}`,
            );
            setCurrentStep('DOCUMENT_PROOF');
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          setFormError(msg);
          setCurrentStep('DOCUMENT_PROOF');
        }
      }, 600);
    } catch (err: unknown) {
      clearInterval(progressInterval);
      const msg = err instanceof Error ? err.message : String(err);
      setFormError(msg);
      setCurrentStep('DOCUMENT_PROOF');
    }
  };

  // 1-Click Recovery Action for Expired / Illegible document
  const handleOneClickRecovery = (replacementDocId: string) => {
    setSelectedDocumentId(replacementDocId);
    setCustomFile(null);
    setRejectionResult(null);
    void handleSubmitDocument(replacementDocId);
  };

  // Copy Reward Promo Code
  const handleCopyPromoCode = () => {
    if (!unlockedRewardCode) return;
    navigator.clipboard?.writeText(unlockedRewardCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Find recommended replacement doc if rejected
  const getRecommendedReplacementDoc = (): VaultDocument | undefined => {
    if (!rejectionResult) return undefined;
    const docs = vault.listDocuments();

    if (rejectionResult.rejectionCode === 'EXPIRED_DOCUMENT') {
      return (
        docs.find((d) => d.docType === 'TUITION_RECEIPT' && d.isValid) ||
        docs.find((d) => d.docType === 'TRANSCRIPT' && d.isValid) ||
        docs.find((d) => d.docType === 'CLASS_SCHEDULE' && d.isValid) ||
        docs.find((d) => d.id !== selectedDocumentId && d.isValid)
      );
    }

    if (rejectionResult.rejectionCode === 'ILLEGIBLE_DOCUMENT') {
      return (
        docs.find((d) => d.docType === 'TRANSCRIPT' && d.isValid) ||
        docs.find((d) => d.docType === 'TUITION_RECEIPT' && d.isValid) ||
        docs.find((d) => d.docType === 'CLASS_SCHEDULE' && d.isValid) ||
        docs.find((d) => d.id !== selectedDocumentId && d.isValid)
      );
    }

    return docs.find((d) => d.id !== selectedDocumentId && d.isValid);
  };

  const recommendedDoc = getRecommendedReplacementDoc();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="wizard-title"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
    >
      <div className="bg-[#FAF7F2] text-neutral-900 border-2 border-neutral-900 rounded-2xl max-w-2xl w-full shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
        {/* Wizard Top Header */}
        <div className="bg-white border-b-2 border-neutral-900 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-neutral-900 text-white flex items-center justify-center font-bold text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0">
              {merchant.brand[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="wizard-title" className="font-serif font-bold text-base text-neutral-900 leading-tight">
                  {merchant.name}
                </h2>
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 border border-neutral-900 text-emerald-900">
                  SheerID & WebMCP
                </span>
              </div>
              <p className="text-xs text-neutral-600 font-sans">
                {merchant.discountValue} • Student Verification
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close verification modal"
            className="p-1.5 rounded-lg border border-neutral-900 hover:bg-neutral-100 text-neutral-900 transition shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Step Indicator Bar */}
        <div className="bg-[#F5F1E9] border-b border-neutral-900 px-5 py-2.5 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <span
              className={`flex items-center justify-center h-5 w-5 rounded-full text-[11px] font-bold border border-neutral-900 ${
                currentStep === 'UNIVERSITY_SELECT'
                  ? 'bg-neutral-900 text-white'
                  : 'bg-white text-neutral-900'
              }`}
            >
              1
            </span>
            <span className={currentStep === 'UNIVERSITY_SELECT' ? 'font-bold' : 'text-neutral-600'}>
              University
            </span>
          </div>

          <span className="text-neutral-400">→</span>

          <div className="flex items-center gap-2">
            <span
              className={`flex items-center justify-center h-5 w-5 rounded-full text-[11px] font-bold border border-neutral-900 ${
                currentStep === 'STUDENT_DETAILS'
                  ? 'bg-neutral-900 text-white'
                  : 'bg-white text-neutral-900'
              }`}
            >
              2
            </span>
            <span className={currentStep === 'STUDENT_DETAILS' ? 'font-bold' : 'text-neutral-600'}>
              Student Details
            </span>
          </div>

          <span className="text-neutral-400">→</span>

          <div className="flex items-center gap-2">
            <span
              className={`flex items-center justify-center h-5 w-5 rounded-full text-[11px] font-bold border border-neutral-900 ${
                currentStep === 'DOCUMENT_PROOF' || currentStep === 'VERIFYING'
                  ? 'bg-neutral-900 text-white'
                  : 'bg-white text-neutral-900'
              }`}
            >
              3
            </span>
            <span
              className={
                currentStep === 'DOCUMENT_PROOF' || currentStep === 'VERIFYING'
                  ? 'font-bold'
                  : 'text-neutral-600'
              }
            >
              Verification
            </span>
          </div>

          <span className="text-neutral-400">→</span>

          <div className="flex items-center gap-2">
            <span
              className={`flex items-center justify-center h-5 w-5 rounded-full text-[11px] font-bold border border-neutral-900 ${
                currentStep === 'REWARD_UNLOCKED'
                  ? 'bg-emerald-600 text-white border-emerald-800'
                  : 'bg-white text-neutral-900'
              }`}
            >
              4
            </span>
            <span className={currentStep === 'REWARD_UNLOCKED' ? 'font-bold text-emerald-800' : 'text-neutral-600'}>
              Reward
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 flex flex-col gap-4 overflow-y-auto max-h-[70vh]">
          {/* Error Banner */}
          {formError && (
            <div className="p-3 bg-rose-50 border-2 border-neutral-900 rounded-xl text-xs text-rose-900 flex items-start gap-2.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <p className="leading-snug font-medium">{formError}</p>
            </div>
          )}

          {/* Quick Auto-Fill Toast Notification */}
          {autofillSuccess && (
            <div className="p-2.5 bg-emerald-50 border border-neutral-900 rounded-xl text-xs text-emerald-900 flex items-center gap-2 animate-in fade-in shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span className="font-medium">Student identity credentials synced from Vault!</span>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 1: SELECT / SEARCH UNIVERSITY                                       */}
          {/* ========================================================================= */}
          {currentStep === 'UNIVERSITY_SELECT' && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif font-bold text-lg text-neutral-900">
                    Select Your Higher Education Institution
                  </h3>
                  <p className="text-xs text-neutral-600 mt-0.5 font-sans">
                    Search accredited universities in the SheerID and WebMCP verification network.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAutoFillFromVault}
                  className="px-3 py-1.5 bg-white border border-neutral-900 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-neutral-900 hover:text-white transition cursor-pointer"
                  title="Auto-fill with currently loaded student vault persona"
                >
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  <span>Auto-fill from Vault</span>
                </button>
              </div>

              {/* Quick Pick Chips */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[11px] font-mono uppercase text-neutral-500 font-bold">
                  Quick Select:
                </span>
                {[
                  { name: 'MIT', id: 'sch_mit_001', instant: true },
                  { name: 'Stanford', id: 'sch_stanford_002', instant: false },
                  { name: 'Harvard', id: 'sch_harvard_003', instant: false },
                  { name: 'UC Berkeley', id: 'sch_berkeley_004', instant: false },
                ].map((item) => {
                  const school = getSchoolById(item.id);
                  const isSelected = selectedSchool?.id === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        if (school) setSelectedSchool(school);
                      }}
                      className={`px-2.5 py-1 rounded-full border border-neutral-900 text-xs font-mono font-medium transition cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-neutral-900 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                          : 'bg-white hover:bg-neutral-100 text-neutral-900 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                      }`}
                    >
                      <span>{item.name}</span>
                      {item.instant && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-amber-300 text-neutral-900 font-bold">
                          INSTANT
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Search Bar Input */}
              <div className="relative mt-1">
                <label htmlFor={schoolSearchInputId} className="sr-only">
                  Search university
                </label>
                <Search className="h-4 w-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id={schoolSearchInputId}
                  type="text"
                  placeholder="Type university name (e.g. Stanford, MIT, Harvard, UC Berkeley)..."
                  value={schoolSearchQuery}
                  onChange={(e) => setSchoolSearchQuery(e.target.value)}
                  className="w-full bg-white border-2 border-neutral-900 rounded-xl pl-10 pr-4 py-2.5 text-xs text-neutral-900 placeholder-neutral-400 font-sans focus:outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                />
              </div>

              {/* University List / Autocomplete Results */}
              <div className="flex flex-col gap-2 max-h-52 overflow-y-auto pr-1">
                {filteredSchools.map((school) => {
                  const isSelected = selectedSchool?.id === school.id;
                  return (
                    <div
                      key={school.id}
                      onClick={() => setSelectedSchool(school)}
                      className={`p-3 rounded-xl border-2 transition cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-amber-50/80 border-neutral-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                          : 'bg-white border-neutral-900/40 hover:border-neutral-900 hover:bg-white shadow-[1px_1px_0px_0px_rgba(0,0,0,0.5)]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-neutral-900 text-white flex items-center justify-center shrink-0">
                          <GraduationCap className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-neutral-900">{school.name}</h4>
                          <span className="font-mono text-[11px] text-neutral-500">
                            {school.domain} • {school.country}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {school.instantMatchEligible ? (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 border border-neutral-900 text-emerald-900 flex items-center gap-1">
                            <Zap className="h-3 w-3 fill-emerald-600 text-emerald-600" />
                            <span>Instant Match Eligible</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-100 border border-neutral-400 text-neutral-600">
                            Document Required
                          </span>
                        )}

                        {isSelected && (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Step Footer Action */}
              <div className="flex items-center justify-between pt-3 border-t border-neutral-900/20">
                <span className="text-xs text-neutral-500 font-mono">
                  {selectedSchool ? `Selected: ${selectedSchool.name}` : 'No school selected'}
                </span>

                <button
                  type="button"
                  onClick={handleProceedToDetails}
                  disabled={!selectedSchool}
                  className="px-5 py-2.5 bg-neutral-900 text-white border-2 border-neutral-900 rounded-xl text-xs font-mono font-bold flex items-center gap-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  <span>Continue to Student Info</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: STUDENT DETAILS FORM                                             */}
          {/* ========================================================================= */}
          {currentStep === 'STUDENT_DETAILS' && (
            <form onSubmit={handleSubmitDetails} className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif font-bold text-lg text-neutral-900">
                    Verify Your Student Identity
                  </h3>
                  <p className="text-xs text-neutral-600 mt-0.5 font-sans">
                    Enter your enrollment details for{' '}
                    <strong className="text-neutral-900">{selectedSchool?.name}</strong>.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAutoFillFromVault}
                  className="px-3 py-1.5 bg-white border border-neutral-900 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-neutral-900 hover:text-white transition cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  <span>Auto-fill from Vault</span>
                </button>
              </div>

              {/* Institution Summary Card */}
              {selectedSchool && (
                <div className="p-3 bg-white border border-neutral-900 rounded-xl flex items-center justify-between text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <div className="flex items-center gap-2.5">
                    <GraduationCap className="h-4 w-4 text-neutral-700" />
                    <span className="font-bold text-neutral-900">{selectedSchool.name}</span>
                  </div>
                  {selectedSchool.instantMatchEligible ? (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 border border-neutral-900 text-emerald-900 flex items-center gap-1">
                      <Zap className="h-3 w-3 fill-emerald-600 text-emerald-600" />
                      <span>Instant Match Enabled</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-neutral-500">
                      Standard Proof Flow
                    </span>
                  )}
                </div>
              )}

              {/* Form Input Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label htmlFor={firstNameInputId} className="block text-neutral-700 font-bold mb-1">
                    First Name
                  </label>
                  <input
                    id={firstNameInputId}
                    type="text"
                    placeholder="e.g. Alex"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="w-full bg-white border-2 border-neutral-900 rounded-xl p-2.5 text-xs text-neutral-900 font-sans focus:outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  />
                </div>

                <div>
                  <label htmlFor={lastNameInputId} className="block text-neutral-700 font-bold mb-1">
                    Last Name
                  </label>
                  <input
                    id={lastNameInputId}
                    type="text"
                    placeholder="e.g. Chen"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="w-full bg-white border-2 border-neutral-900 rounded-xl p-2.5 text-xs text-neutral-900 font-sans focus:outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  />
                </div>

                <div>
                  <label htmlFor={birthDateInputId} className="block text-neutral-700 font-bold mb-1">
                    Date of Birth
                  </label>
                  <input
                    id={birthDateInputId}
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    required
                    className="w-full bg-white border-2 border-neutral-900 rounded-xl p-2.5 text-xs text-neutral-900 font-mono focus:outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  />
                </div>

                <div>
                  <label htmlFor={emailInputId} className="block text-neutral-700 font-bold mb-1">
                    University Email (.edu)
                  </label>
                  <input
                    id={emailInputId}
                    type="email"
                    placeholder="e.g. student@stanford.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-white border-2 border-neutral-900 rounded-xl p-2.5 text-xs text-neutral-900 font-mono focus:outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  />
                </div>
              </div>

              {/* Zero-PII Security Assurance Note */}
              <div className="p-3 bg-neutral-100 border border-neutral-900/60 rounded-xl text-[11px] text-neutral-600 flex items-start gap-2 font-sans">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="leading-snug">
                  Zero-PII Assurance: Personal details are evaluated in client sandbox and sent only to SheerID verification registrar.
                </p>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-neutral-900/20">
                <button
                  type="button"
                  onClick={() => setCurrentStep('UNIVERSITY_SELECT')}
                  className="px-4 py-2 bg-white text-neutral-900 border border-neutral-900 rounded-xl text-xs font-mono font-medium flex items-center gap-1.5 hover:bg-neutral-100 transition cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back</span>
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-neutral-900 text-white border-2 border-neutral-900 rounded-xl text-xs font-mono font-bold flex items-center gap-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-neutral-800 transition cursor-pointer"
                >
                  <span>Submit & Verify</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: DOCUMENT PROOF & AUTONOMOUS RECOVERY                             */}
          {/* ========================================================================= */}
          {currentStep === 'DOCUMENT_PROOF' && (
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="font-serif font-bold text-lg text-neutral-900">
                  Upload Proof of Enrollment
                </h3>
                <p className="text-xs text-neutral-600 mt-0.5 font-sans">
                  Proof is required for <strong>{selectedSchool?.name}</strong>. Choose a document from your Vault or upload a file.
                </p>
              </div>

              {/* Autonomous Recovery Alert Banner if rejected */}
              {rejectionResult && (
                <div
                  className={`p-4 rounded-xl border-2 border-neutral-900 flex flex-col gap-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ${
                    rejectionResult.rejectionCode === 'EXPIRED_DOCUMENT'
                      ? 'bg-rose-50 text-rose-950'
                      : 'bg-amber-50 text-amber-950'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle
                      className={`h-5 w-5 shrink-0 mt-0.5 ${
                        rejectionResult.rejectionCode === 'EXPIRED_DOCUMENT'
                          ? 'text-rose-600'
                          : 'text-amber-600'
                      }`}
                    />
                    <div className="leading-snug">
                      <h4 className="font-bold text-xs uppercase tracking-wide font-mono">
                        Verification Issue: {rejectionResult.rejectionCode}
                      </h4>
                      <p className="text-xs mt-0.5 font-sans">
                        {rejectionResult.rejectionReason} {rejectionResult.remedyText}
                      </p>
                    </div>
                  </div>

                  {/* 1-Click Recovery Recommendation */}
                  {recommendedDoc && (
                    <div className="bg-white border border-neutral-900 p-3 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-emerald-600" />
                        <div>
                          <span className="font-bold text-xs text-neutral-900 block">
                            Recommended Replacement: {recommendedDoc.title}
                          </span>
                          <span className="text-[11px] text-neutral-500 font-mono">
                            {recommendedDoc.fileName} • {recommendedDoc.docType}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOneClickRecovery(recommendedDoc.id)}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white border border-neutral-900 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition cursor-pointer shrink-0"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>Re-verify with {recommendedDoc.docType === 'TUITION_RECEIPT' ? 'Tuition Receipt' : 'Transcript'}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Vault Documents Pick List */}
              <div className="flex flex-col gap-2.5">
                <span className="text-xs font-bold text-neutral-800 font-mono uppercase tracking-wide">
                  Select from Student Vault ({vaultDocuments.length} available):
                </span>

                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                  {vaultDocuments.map((doc) => {
                    const isSelected = selectedDocumentId === doc.id && !customFile;
                    return (
                      <div
                        key={doc.id}
                        onClick={() => {
                          setSelectedDocumentId(doc.id);
                          setCustomFile(null);
                        }}
                        className={`p-3 rounded-xl border-2 transition cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-amber-50 border-neutral-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                            : 'bg-white border-neutral-900/40 hover:border-neutral-900 hover:bg-white shadow-[1px_1px_0px_0px_rgba(0,0,0,0.5)]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center shrink-0">
                            <FileText className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-xs text-neutral-900">{doc.title}</h4>
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-neutral-100 border border-neutral-400">
                                {doc.docType}
                              </span>
                            </div>
                            <span className="font-mono text-[11px] text-neutral-500">
                              {doc.fileName} • {Math.round(doc.fileSizeBytes / 1024)} KB
                              {doc.expirationDate && ` • Exp: ${doc.expirationDate}`}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {doc.isValid ? (
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 border border-neutral-900 text-emerald-900">
                              VALID
                            </span>
                          ) : doc.isIllegible ? (
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-100 border border-neutral-900 text-amber-900">
                              BLURRY
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-100 border border-neutral-900 text-rose-900">
                              EXPIRED
                            </span>
                          )}

                          {isSelected && (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Or Upload Custom File */}
              <div className="p-3 bg-white border border-dashed border-neutral-900 rounded-xl flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <Upload className="h-4 w-4 text-neutral-600" />
                  <div>
                    <span className="font-bold text-neutral-900">Upload File from Device</span>
                    <span className="text-[11px] text-neutral-500 font-mono block">
                      PDF, PNG, JPEG up to 10MB
                    </span>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor={fileUploadInputId}
                    className="px-3 py-1.5 bg-neutral-900 text-white rounded-lg font-mono text-xs font-bold cursor-pointer hover:bg-neutral-800 inline-block"
                  >
                    {customFile ? customFile.name : 'Choose File'}
                  </label>
                  <input
                    id={fileUploadInputId}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setCustomFile(e.target.files[0]);
                        setSelectedDocumentId(null);
                      }
                    }}
                  />
                </div>
              </div>

              {/* Step Footer Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-neutral-900/20">
                <button
                  type="button"
                  onClick={() => setCurrentStep('STUDENT_DETAILS')}
                  className="px-4 py-2 bg-white text-neutral-900 border border-neutral-900 rounded-xl text-xs font-mono font-medium flex items-center gap-1.5 hover:bg-neutral-100 transition cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSubmitDocument()}
                  disabled={!selectedDocumentId && !customFile}
                  className="px-5 py-2.5 bg-neutral-900 text-white border-2 border-neutral-900 rounded-xl text-xs font-mono font-bold flex items-center gap-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  <span>Submit Proof Document</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 3.5: VERIFYING IN PROGRESS WITH PRE-SIGNED UPLOAD PROGRESS          */}
          {/* ========================================================================= */}
          {currentStep === 'VERIFYING' && (
            <div className="py-8 px-4 flex flex-col items-center justify-center text-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-neutral-900 text-white flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>

              <div>
                <h3 className="font-serif font-bold text-xl text-neutral-900">
                  Verifying with SheerID & WebMCP
                </h3>
                <p className="text-xs text-neutral-600 mt-1 font-mono">
                  Streaming pre-signed binary asset to verification authority...
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full max-w-md bg-neutral-200 border-2 border-neutral-900 rounded-full h-4 overflow-hidden p-0.5">
                <div
                  className="bg-neutral-900 h-full rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>

              <span className="text-xs font-mono font-bold text-neutral-800">
                {uploadProgress}% Upload Completed
              </span>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 4: UNLOCKED REWARD SCREEN                                           */}
          {/* ========================================================================= */}
          {currentStep === 'REWARD_UNLOCKED' && (
            <div className="flex flex-col items-center text-center gap-5 py-2">
              {/* Success Icon */}
              <div className="h-16 w-16 rounded-full bg-emerald-100 border-2 border-neutral-900 text-emerald-800 flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <CheckCircle2 className="h-9 w-9" />
              </div>

              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 border border-neutral-900 text-emerald-900 text-xs font-mono font-bold uppercase mb-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Student Verification Approved</span>
                </div>
                <h3 className="font-serif font-bold text-2xl text-neutral-900">
                  Your Student Perk is Unlocked!
                </h3>
                <p className="text-xs text-neutral-600 mt-1 font-sans max-w-md mx-auto">
                  Congratulations! We verified your student status with{' '}
                  <strong className="text-neutral-900">{selectedSchool?.name || 'your institution'}</strong>.
                </p>
              </div>

              {/* Offer Summary Card */}
              <div className="w-full bg-white border-2 border-neutral-900 rounded-2xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-4 text-left">
                <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                  <div>
                    <span className="text-[11px] font-mono uppercase text-neutral-500 font-bold block">
                      Unlocked Reward
                    </span>
                    <h4 className="font-bold text-sm text-neutral-900">{merchant.name}</h4>
                  </div>
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-amber-100 border border-neutral-900 text-neutral-900">
                    {merchant.discountValue}
                  </span>
                </div>

                {/* Promo Code Box */}
                <div>
                  <label className="text-[11px] font-mono text-neutral-600 uppercase font-bold block mb-1.5">
                    Exclusive Single-Use Promo Code:
                  </label>
                  <div className="flex items-stretch gap-2 bg-[#F5F1E9] border-2 border-neutral-900 rounded-xl p-2">
                    <div className="flex-1 font-mono text-base font-bold text-neutral-900 px-3 py-1 flex items-center select-all">
                      {unlockedRewardCode || 'EDU-SPOTIFY-8X29K'}
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyPromoCode}
                      className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0"
                    >
                      {copiedCode ? (
                        <>
                          <Check className="h-4 w-4 text-emerald-400" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          <span>Copy Code</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-neutral-600 font-sans">
                  {merchant.tagline}. Valid for the 2026-2027 academic year.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full pt-2">
                <a
                  href={merchant.partnerUrl || `https://${merchant.domain}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 w-full py-3 px-4 bg-neutral-900 hover:bg-neutral-800 text-white border-2 border-neutral-900 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition cursor-pointer"
                >
                  <span>Apply at Checkout ({merchant.domain})</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto py-3 px-6 bg-white hover:bg-neutral-100 text-neutral-900 border-2 border-neutral-900 rounded-xl text-xs font-mono font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
