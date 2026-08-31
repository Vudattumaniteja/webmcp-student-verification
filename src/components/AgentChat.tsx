import { useState, useEffect, useRef } from 'react';
import {
  AgentController,
  AgentState,
  globalAgentController,
  ConsentData,
  RemedyData,
  ApprovalData,
} from '../services/agentController';
import {
  Bot,
  Sparkles,
  Send,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  UploadCloud,
  Lock,
  Copy,
  Check,
  Search,
  Key,
  ShieldCheck,
  ChevronRight,
  Loader2,
  Terminal,
  type LucideIcon,
} from 'lucide-react';

interface AgentChatProps {
  controller?: AgentController;
  onClose?: () => void;
}

interface TimelineStep {
  key: string;
  label: string;
  icon: LucideIcon | React.ComponentType<{ className?: string }>;
  status: 'pending' | 'active' | 'completed' | 'error';
}

export default function AgentChat({
  controller = globalAgentController,
}: AgentChatProps) {
  const [state, setState] = useState<AgentState>(controller.getState());
  const [inputText, setInputText] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setState(controller.getState());
    const unsubscribe = controller.subscribe((newState) => {
      setState(newState);
    });
    return () => unsubscribe();
  }, [controller]);

  useEffect(() => {
    if (typeof messagesEndRef.current?.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [state.messages, state.step]);

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    controller.sendUserMessage(inputText.trim());
    setInputText('');
  };

  const handleConfirmConsent = async (documentId?: string) => {
    try {
      await controller.confirmConsent(documentId);
    } catch (err) {
      console.error('Consent confirmation error:', err);
    }
  };

  const handleConfirmRecovery = async (replacementId?: string) => {
    try {
      await controller.confirmRecovery(replacementId);
    } catch (err) {
      console.error('Recovery confirmation error:', err);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '180 KB';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Compute live step timeline badges
  const computeTimelineSteps = (): TimelineStep[] => {
    const step = state.step;

    const isSearchDone = step !== 'IDLE' && step !== 'SEARCHING_SCHOOL';
    const isSearchActive = step === 'SEARCHING_SCHOOL';

    const isDetailsDone =
      isSearchDone &&
      step !== 'SUBMITTING_DETAILS';
    const isDetailsActive = step === 'SUBMITTING_DETAILS';

    const isVaultDone =
      isDetailsDone &&
      step !== 'VAULT_MATCHING' &&
      step !== 'AWAITING_CONSENT';
    const isVaultActive = step === 'VAULT_MATCHING' || step === 'AWAITING_CONSENT';

    const isUploadDone =
      isVaultDone &&
      step !== 'UPLOADING_DOCUMENT' &&
      step !== 'RECOVERY_PROMPT';
    const isUploadActive = step === 'UPLOADING_DOCUMENT';
    const isUploadError = step === 'RECOVERY_PROMPT';

    const isStatusDone = step === 'APPROVED';
    const isStatusActive = step === 'CHECKING_STATUS';
    const isStatusError = step === 'ERROR';

    return [
      {
        key: 'SEARCH',
        label: 'Search',
        icon: Search,
        status: isSearchActive
          ? 'active'
          : isSearchDone
          ? 'completed'
          : 'pending',
      },
      {
        key: 'DETAILS',
        label: 'Details',
        icon: Key,
        status: isDetailsActive
          ? 'active'
          : isDetailsDone
          ? 'completed'
          : 'pending',
      },
      {
        key: 'VAULT',
        label: 'Vault',
        icon: ShieldCheck,
        status: isVaultActive
          ? 'active'
          : isVaultDone
          ? 'completed'
          : 'pending',
      },
      {
        key: 'UPLOAD',
        label: 'Upload',
        icon: UploadCloud,
        status: isUploadActive
          ? 'active'
          : isUploadError
          ? 'error'
          : isUploadDone
          ? 'completed'
          : 'pending',
      },
      {
        key: 'STATUS',
        label: 'Status',
        icon: CheckCircle2,
        status: isStatusActive
          ? 'active'
          : isStatusError
          ? 'error'
          : isStatusDone
          ? 'completed'
          : 'pending',
      },
    ];
  };

  const timelineSteps = computeTimelineSteps();

  const getStatusBadge = () => {
    switch (state.step) {
      case 'APPROVED':
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-semibold">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            Approved
          </span>
        );
      case 'AWAITING_CONSENT':
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-semibold animate-pulse">
            <AlertTriangle className="h-3 w-3 text-amber-600" />
            Consent Required
          </span>
        );
      case 'RECOVERY_PROMPT':
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-800 text-[10px] font-semibold animate-pulse">
            <RotateCcw className="h-3 w-3 text-rose-600" />
            Recovery Remedy
          </span>
        );
      case 'SEARCHING_SCHOOL':
      case 'SUBMITTING_DETAILS':
      case 'VAULT_MATCHING':
      case 'UPLOADING_DOCUMENT':
      case 'CHECKING_STATUS':
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[#2563EB] text-[10px] font-semibold animate-pulse">
            <Loader2 className="h-3 w-3 text-[#2563EB] animate-spin" />
            Verifying
          </span>
        );
      case 'ERROR':
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-800 text-[10px] font-semibold">
            <AlertTriangle className="h-3 w-3 text-rose-600" />
            Error
          </span>
        );
      case 'IDLE':
      default:
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-stone-100 border border-stone-200 text-stone-600 text-[10px] font-medium">
            <Sparkles className="h-3 w-3 text-amber-500" />
            Agent Ready
          </span>
        );
    }
  };

  const renderConsentCard = (consent: ConsentData) => {
    return (
      <div className="my-2 bg-[#FAF9F6] border border-blue-200 rounded-2xl p-4 shadow-sm flex flex-col gap-3.5">
        <div className="flex items-center justify-between border-b border-stone-200 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-[#2563EB]">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-stone-900">Document Upload Consent</h4>
              <span className="text-[10px] text-[#2563EB] font-mono">Zero-PII Browser Sandbox</span>
            </div>
          </div>

          <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-800">
            {consent.docType}
          </span>
        </div>

        <p className="text-xs text-stone-600 leading-snug">
          The verification authority requested proof of academic enrollment. The following document metadata from your local vault will be streamed directly via pre-signed URL:
        </p>

        <div className="bg-white border border-stone-200 rounded-xl p-3 flex flex-col gap-2 text-[11px]">
          <div className="flex items-center justify-between">
            <span className="text-stone-500">Document:</span>
            <span className="font-semibold text-stone-900">{consent.documentTitle || consent.fileName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-stone-500">File Name:</span>
            <span className="font-mono text-[#2563EB] font-medium">{consent.fileName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-stone-500">Institution:</span>
            <span className="text-stone-800 font-medium">{consent.issuer}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-stone-500">Handle ID:</span>
            <span className="font-mono text-purple-700">{consent.documentId}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-stone-500">Payload Size:</span>
            <span className="font-mono text-stone-700">{formatFileSize(consent.fileSizeBytes)}</span>
          </div>
          {consent.expirationDate && (
            <div className="flex items-center justify-between">
              <span className="text-stone-500">Expires:</span>
              <span className="font-mono text-stone-700">{consent.expirationDate}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 font-mono text-[10px] text-stone-500">
          <Lock className="h-3 w-3 text-emerald-600 shrink-0" />
          <span>Raw binary streams directly to authority without exposing PII.</span>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => handleConfirmConsent(consent.documentId)}
            className="flex-1 py-2.5 px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm active:scale-98"
          >
            <UploadCloud className="h-4 w-4" />
            <span>Confirm &amp; Stream Upload</span>
          </button>
        </div>
      </div>
    );
  };

  const renderRemedyCard = (remedy: RemedyData) => {
    return (
      <div className="my-2 bg-rose-50/70 border border-rose-200 rounded-2xl p-4 shadow-sm flex flex-col gap-3.5">
        <div className="flex items-center justify-between border-b border-rose-200 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-700">
              <RotateCcw className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-rose-950">Autonomous Recovery Remedy</h4>
              <span className="text-[10px] text-rose-600 font-mono">Rejection Auto-Detected</span>
            </div>
          </div>

          <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-rose-100 border border-rose-300 text-rose-900">
            {remedy.rejectionCode}
          </span>
        </div>

        {/* Rejection Alert */}
        <div className="bg-white border border-rose-200 rounded-xl p-2.5 text-xs text-rose-900 flex items-start gap-2 shadow-xs">
          <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-rose-950">{remedy.rejectionReason}</p>
            {remedy.remedyText && <p className="text-[11px] text-rose-800 mt-0.5">{remedy.remedyText}</p>}
          </div>
        </div>

        {/* Suggested Replacement Document */}
        <div className="bg-white border border-emerald-200 rounded-xl p-3 flex flex-col gap-2 text-[11px] shadow-xs">
          <div className="flex items-center justify-between text-emerald-800 font-semibold border-b border-stone-100 pb-1.5">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>Suggested Replacement Proof</span>
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 uppercase">
              {remedy.suggestedDocument.docType}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-stone-500">Document Title:</span>
            <span className="font-semibold text-stone-900">{remedy.suggestedDocument.documentTitle}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-stone-500">File Name:</span>
            <span className="font-mono text-[#2563EB] font-medium">{remedy.suggestedDocument.fileName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-stone-500">Handle ID:</span>
            <span className="font-mono text-purple-700">{remedy.suggestedDocument.documentId}</span>
          </div>
          {remedy.suggestedDocument.expirationDate && (
            <div className="flex items-center justify-between">
              <span className="text-stone-500">Valid Through:</span>
              <span className="font-mono text-stone-700">{remedy.suggestedDocument.expirationDate}</span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => handleConfirmRecovery(remedy.suggestedDocument.documentId)}
          className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm active:scale-98"
        >
          <Sparkles className="h-4 w-4" />
          <span>Confirm &amp; Re-submit</span>
        </button>
      </div>
    );
  };

  const renderApprovalCard = (approval: ApprovalData) => {
    return (
      <div className="my-2 bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-800 shadow-xs">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-emerald-950">Discount Promo Code</h4>
              <span className="text-[10px] text-stone-500 font-mono">{approval.merchantName}</span>
            </div>
          </div>

          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 border border-emerald-300 text-emerald-900">
            Unlocked
          </span>
        </div>

        <div className="flex items-center gap-2 bg-white border border-emerald-200 p-2.5 rounded-xl shadow-xs">
          <div className="flex-1 font-mono text-sm font-bold text-stone-900 px-1 truncate">
            {approval.rewardCode}
          </div>
          <button
            type="button"
            aria-label="Copy Code"
            onClick={() => handleCopyCode(approval.rewardCode)}
            className="py-1 px-3 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium transition cursor-pointer flex items-center gap-1 shadow-xs shrink-0"
          >
            {copiedCode === approval.rewardCode ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>

        <p className="text-[11px] text-stone-600 leading-snug">
          Academic enrollment verified with <span className="font-semibold text-stone-900">{approval.schoolName}</span>. Promo code has been saved and applied to your perks showcase.
        </p>
      </div>
    );
  };

  return (
    <div className="bg-white border border-stone-200 rounded-2xl flex flex-col shadow-sm h-full max-h-[720px] overflow-hidden text-stone-900">
      {/* Header */}
      <div className="p-4 border-b border-stone-200 bg-[#FAF9F6] flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-9 w-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#2563EB] shadow-xs">
              <Bot className="h-5 w-5" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-serif font-bold text-stone-900">
                Autonomous Verification Agent
              </h3>
              {getStatusBadge()}
            </div>
            <p className="text-[10px] text-stone-500 font-mono mt-0.5">
              WebMCP In-Browser AI Assistant • Zero-PII Sandbox
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => controller.reset()}
            className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-600 hover:text-stone-900 transition cursor-pointer shadow-xs"
            title="Reset Agent Conversation"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Live Step Execution Timeline */}
      <div className="px-4 py-2.5 bg-stone-50/70 border-b border-stone-200 flex items-center justify-between gap-1 overflow-x-auto scrollbar-none shrink-0">
        {timelineSteps.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div key={s.key} className="flex items-center gap-1 shrink-0">
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-medium transition ${
                  s.status === 'completed'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : s.status === 'active'
                    ? 'bg-blue-50 border border-blue-200 text-[#2563EB] font-semibold animate-pulse'
                    : s.status === 'error'
                    ? 'bg-rose-50 border border-rose-200 text-rose-800'
                    : 'bg-white border border-stone-200 text-stone-500'
                }`}
              >
                {s.status === 'completed' ? (
                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                ) : s.status === 'active' ? (
                  <Loader2 className="h-3 w-3 text-[#2563EB] animate-spin" />
                ) : s.status === 'error' ? (
                  <AlertTriangle className="h-3 w-3 text-rose-600" />
                ) : (
                  <Icon className="h-3 w-3 text-stone-400" />
                )}
                <span>{s.label}</span>
              </div>
              {idx < timelineSteps.length - 1 && (
                <ChevronRight className="h-3 w-3 text-stone-300 shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      {/* Chat Messages List */}
      <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3.5 min-h-[260px] bg-[#FAF9F6]">
        {state.messages.map((msg) => {
          const isUser = msg.sender === 'user';
          const isSystem = msg.sender === 'system';

          if (isSystem && msg.toolCall) {
            return (
              <div
                key={msg.id}
                className="bg-white border border-stone-200 rounded-xl p-2.5 text-[11px] font-mono text-stone-700 flex items-start gap-2 shadow-xs"
              >
                <Terminal className="h-3.5 w-3.5 text-[#2563EB] shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1 break-words">
                  <span className="text-[#2563EB] font-semibold">{msg.toolCall.name}</span>
                  {msg.toolCall.input && Object.keys(msg.toolCall.input).length > 0 && (
                    <span className="text-stone-500 ml-1">
                      ({JSON.stringify(msg.toolCall.input)})
                    </span>
                  )}
                </div>
              </div>
            );
          }

          return (
            <div
              key={msg.id}
              className={`flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-1.5 text-[10px] text-stone-400 px-1 font-mono">
                {isUser ? (
                  <>
                    <span>You</span>
                    <span>•</span>
                    <span>{msg.timestamp}</span>
                  </>
                ) : (
                  <>
                    <Bot className="h-3 w-3 text-[#2563EB]" />
                    <span className="text-[#2563EB] font-medium font-sans">Agent</span>
                    <span>•</span>
                    <span>{msg.timestamp}</span>
                  </>
                )}
              </div>

              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                  isUser
                    ? 'bg-[#2563EB] text-white rounded-br-none shadow-xs'
                    : msg.type === 'error'
                    ? 'bg-rose-50 border border-rose-200 text-rose-900 rounded-bl-none shadow-xs'
                    : 'bg-white border border-stone-200 text-stone-800 rounded-bl-none shadow-xs'
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{msg.text}</p>
              </div>

              {/* Render Structured Action Cards */}
              {msg.consentData && renderConsentCard(msg.consentData)}
              {msg.remedyData && renderRemedyCard(msg.remedyData)}
              {msg.approvalData && renderApprovalCard(msg.approvalData)}
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompt Suggestions */}
      <div className="px-4 py-2 bg-white border-t border-stone-200 flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0">
        <button
          type="button"
          onClick={() => {
            setInputText('How does vault security work?');
            controller.sendUserMessage('How does vault security work?');
          }}
          className="text-[10px] px-3 py-1 rounded-full bg-stone-100 border border-stone-200 text-stone-700 hover:bg-stone-200 hover:text-stone-900 whitespace-nowrap cursor-pointer transition shadow-xs"
        >
          How does vault security work?
        </button>
        <button
          type="button"
          onClick={() => {
            setInputText('What student discounts can I get?');
            controller.sendUserMessage('What student discounts can I get?');
          }}
          className="text-[10px] px-3 py-1 rounded-full bg-stone-100 border border-stone-200 text-stone-700 hover:bg-stone-200 hover:text-stone-900 whitespace-nowrap cursor-pointer transition shadow-xs"
        >
          What student discounts can I get?
        </button>
        <button
          type="button"
          onClick={() => {
            setInputText('How do I switch student presets?');
            controller.sendUserMessage('How do I switch student presets?');
          }}
          className="text-[10px] px-3 py-1 rounded-full bg-stone-100 border border-stone-200 text-stone-700 hover:bg-stone-200 hover:text-stone-900 whitespace-nowrap cursor-pointer transition shadow-xs"
        >
          Switch student persona
        </button>
      </div>

      {/* Input Message Form */}
      <form
        onSubmit={handleSendMessage}
        className="p-3 border-t border-stone-200 bg-[#FAF9F6] flex items-center gap-2 shrink-0"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask agent or enter message..."
          className="flex-1 bg-white border border-stone-200 rounded-xl px-3.5 py-2 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] shadow-xs font-sans"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="py-2 px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-40 disabled:hover:bg-[#2563EB] text-white text-xs font-medium transition cursor-pointer flex items-center gap-1 shadow-sm active:scale-98"
        >
          <Send className="h-3.5 w-3.5" />
          <span>Send</span>
        </button>
      </form>
    </div>
  );
}

