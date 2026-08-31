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
} from 'lucide-react';

interface AgentChatProps {
  controller?: AgentController;
  onClose?: () => void;
}

interface TimelineStep {
  key: string;
  label: string;
  icon: any;
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
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-700 text-emerald-300 text-[10px] font-semibold">
            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
            Approved
          </span>
        );
      case 'AWAITING_CONSENT':
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-950 border border-amber-700 text-amber-300 text-[10px] font-semibold animate-pulse">
            <AlertTriangle className="h-3 w-3 text-amber-400" />
            Consent Required
          </span>
        );
      case 'RECOVERY_PROMPT':
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-950 border border-rose-700 text-rose-300 text-[10px] font-semibold animate-pulse">
            <RotateCcw className="h-3 w-3 text-rose-400" />
            Recovery Remedy
          </span>
        );
      case 'SEARCHING_SCHOOL':
      case 'SUBMITTING_DETAILS':
      case 'VAULT_MATCHING':
      case 'UPLOADING_DOCUMENT':
      case 'CHECKING_STATUS':
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-950 border border-cyan-700 text-cyan-300 text-[10px] font-semibold animate-pulse">
            <Loader2 className="h-3 w-3 text-cyan-400 animate-spin" />
            Verifying
          </span>
        );
      case 'ERROR':
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-950 border border-rose-700 text-rose-300 text-[10px] font-semibold">
            <AlertTriangle className="h-3 w-3 text-rose-400" />
            Error
          </span>
        );
      case 'IDLE':
      default:
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 text-[10px] font-medium">
            <Sparkles className="h-3 w-3 text-indigo-400" />
            Agent Ready
          </span>
        );
    }
  };

  const renderConsentCard = (consent: ConsentData) => {
    return (
      <div className="my-2 bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-950 border border-indigo-700/80 rounded-2xl p-4 shadow-xl flex flex-col gap-3.5">
        <div className="flex items-center justify-between border-b border-indigo-800/60 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-indigo-900/90 border border-indigo-700 flex items-center justify-center text-indigo-300 shadow-inner">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-100">Document Upload Consent</h4>
              <span className="text-[10px] text-indigo-300 font-mono">Zero-PII Browser Sandbox</span>
            </div>
          </div>

          <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded bg-indigo-950 border border-indigo-700 text-indigo-300">
            {consent.docType}
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-snug">
          The verification authority requested proof of academic enrollment. The following document metadata from your local vault will be streamed directly via pre-signed URL:
        </p>

        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col gap-2 text-[11px]">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Document:</span>
            <span className="font-semibold text-slate-200">{consent.documentTitle || consent.fileName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">File Name:</span>
            <span className="font-mono text-cyan-300">{consent.fileName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Institution:</span>
            <span className="text-slate-200">{consent.issuer}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Handle ID:</span>
            <span className="font-mono text-indigo-300">{consent.documentId}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Payload Size:</span>
            <span className="font-mono text-slate-300">{formatFileSize(consent.fileSizeBytes)}</span>
          </div>
          {consent.expirationDate && (
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Expires:</span>
              <span className="font-mono text-slate-300">{consent.expirationDate}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 font-mono text-[10px] text-slate-400">
          <Lock className="h-3 w-3 text-emerald-400 shrink-0" />
          <span>Raw binary streams directly to authority without exposing PII.</span>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => handleConfirmConsent(consent.documentId)}
            className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md shadow-indigo-600/25"
          >
            <UploadCloud className="h-4 w-4" />
            <span>Confirm & Stream Upload</span>
          </button>
        </div>
      </div>
    );
  };

  const renderRemedyCard = (remedy: RemedyData) => {
    return (
      <div className="my-2 bg-gradient-to-br from-rose-950/70 via-slate-900 to-slate-950 border border-rose-700/80 rounded-2xl p-4 shadow-xl flex flex-col gap-3.5">
        <div className="flex items-center justify-between border-b border-rose-800/60 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-rose-900/80 border border-rose-700 flex items-center justify-center text-rose-300 shadow-inner">
              <RotateCcw className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-100">Autonomous Recovery Remedy</h4>
              <span className="text-[10px] text-rose-300 font-mono">Rejection Auto-Detected</span>
            </div>
          </div>

          <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-rose-950 border border-rose-700 text-rose-300">
            {remedy.rejectionCode}
          </span>
        </div>

        {/* Rejection Alert */}
        <div className="bg-rose-950/40 border border-rose-800/80 rounded-xl p-2.5 text-xs text-rose-200 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-rose-300">{remedy.rejectionReason}</p>
            {remedy.remedyText && <p className="text-[11px] text-rose-200/90 mt-0.5">{remedy.remedyText}</p>}
          </div>
        </div>

        {/* Suggested Replacement Document */}
        <div className="bg-slate-950/80 border border-emerald-800/70 rounded-xl p-3 flex flex-col gap-2 text-[11px]">
          <div className="flex items-center justify-between text-emerald-400 font-semibold border-b border-slate-800/80 pb-1.5">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Suggested Replacement Proof</span>
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 border border-emerald-800 text-emerald-300 uppercase">
              {remedy.suggestedDocument.docType}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400">Document Title:</span>
            <span className="font-semibold text-slate-200">{remedy.suggestedDocument.documentTitle}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">File Name:</span>
            <span className="font-mono text-cyan-300">{remedy.suggestedDocument.fileName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Handle ID:</span>
            <span className="font-mono text-indigo-300">{remedy.suggestedDocument.documentId}</span>
          </div>
          {remedy.suggestedDocument.expirationDate && (
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Valid Through:</span>
              <span className="font-mono text-slate-300">{remedy.suggestedDocument.expirationDate}</span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => handleConfirmRecovery(remedy.suggestedDocument.documentId)}
          className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md shadow-emerald-600/25"
        >
          <Sparkles className="h-4 w-4" />
          <span>Confirm & Re-submit</span>
        </button>
      </div>
    );
  };

  const renderApprovalCard = (approval: ApprovalData) => {
    return (
      <div className="my-2 bg-gradient-to-br from-emerald-950/80 via-slate-900 to-slate-950 border border-emerald-600/80 rounded-2xl p-4 shadow-xl flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-emerald-800/60 pb-2">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-emerald-900 border border-emerald-700 flex items-center justify-center text-emerald-300 shadow-inner">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-emerald-300">Discount Promo Code</h4>
              <span className="text-[10px] text-slate-400 font-mono">{approval.merchantName}</span>
            </div>
          </div>

          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 border border-emerald-700 text-emerald-300">
            Unlocked
          </span>
        </div>

        <div className="flex items-center gap-2 bg-slate-950/90 border border-emerald-700/80 p-2.5 rounded-xl">
          <div className="flex-1 font-mono text-sm font-bold text-emerald-300 px-1 truncate">
            {approval.rewardCode}
          </div>
          <button
            type="button"
            aria-label="Copy Code"
            onClick={() => handleCopyCode(approval.rewardCode)}
            className="py-1 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition cursor-pointer flex items-center gap-1 shadow-sm shrink-0"
          >
            {copiedCode === approval.rewardCode ? (
              <>
                <Check className="h-3.5 w-3.5" />
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

        <p className="text-[11px] text-slate-300 leading-snug">
          Academic enrollment verified with <span className="font-semibold text-white">{approval.schoolName}</span>. Promo code has been saved and applied to your perks showcase.
        </p>
      </div>
    );
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-col shadow-2xl backdrop-blur h-full max-h-[720px] overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
              <Bot className="h-5 w-5" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-100">
                Autonomous Verification Agent
              </h3>
              {getStatusBadge()}
            </div>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
              WebMCP In-Browser AI Assistant • Zero-PII Sandbox
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => controller.reset()}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
            title="Reset Agent Conversation"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Live Step Execution Timeline */}
      <div className="px-4 py-2.5 bg-slate-950/90 border-b border-slate-800/80 flex items-center justify-between gap-1 overflow-x-auto scrollbar-none shrink-0">
        {timelineSteps.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div key={s.key} className="flex items-center gap-1 shrink-0">
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-medium transition ${
                  s.status === 'completed'
                    ? 'bg-emerald-950/60 border border-emerald-800/80 text-emerald-300'
                    : s.status === 'active'
                    ? 'bg-cyan-950/80 border border-cyan-700/80 text-cyan-300 animate-pulse'
                    : s.status === 'error'
                    ? 'bg-rose-950/60 border border-rose-800/80 text-rose-300'
                    : 'bg-slate-900/60 border border-slate-800 text-slate-500'
                }`}
              >
                {s.status === 'completed' ? (
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                ) : s.status === 'active' ? (
                  <Loader2 className="h-3 w-3 text-cyan-400 animate-spin" />
                ) : s.status === 'error' ? (
                  <AlertTriangle className="h-3 w-3 text-rose-400" />
                ) : (
                  <Icon className="h-3 w-3 text-slate-500" />
                )}
                <span>{s.label}</span>
              </div>
              {idx < timelineSteps.length - 1 && (
                <ChevronRight className="h-3 w-3 text-slate-700 shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      {/* Chat Messages List */}
      <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3.5 min-h-[260px]">
        {state.messages.map((msg) => {
          const isUser = msg.sender === 'user';
          const isSystem = msg.sender === 'system';

          if (isSystem && msg.toolCall) {
            return (
              <div
                key={msg.id}
                className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-2.5 text-[11px] font-mono text-slate-300 flex items-start gap-2"
              >
                <Terminal className="h-3.5 w-3.5 text-cyan-400 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1 break-words">
                  <span className="text-cyan-400 font-semibold">{msg.toolCall.name}</span>
                  {msg.toolCall.input && Object.keys(msg.toolCall.input).length > 0 && (
                    <span className="text-slate-400 ml-1">
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
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 px-1">
                {isUser ? (
                  <>
                    <span>You</span>
                    <span>•</span>
                    <span>{msg.timestamp}</span>
                  </>
                ) : (
                  <>
                    <Bot className="h-3 w-3 text-indigo-400" />
                    <span className="text-indigo-300 font-medium">Agent</span>
                    <span>•</span>
                    <span>{msg.timestamp}</span>
                  </>
                )}
              </div>

              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                  isUser
                    ? 'bg-indigo-600 text-white rounded-br-none shadow-md shadow-indigo-600/20'
                    : msg.type === 'error'
                    ? 'bg-rose-950/60 border border-rose-800/80 text-rose-200 rounded-bl-none'
                    : 'bg-slate-950/80 border border-slate-800 text-slate-200 rounded-bl-none'
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
      <div className="px-4 py-1.5 bg-slate-950/60 border-t border-slate-800/60 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
        <button
          type="button"
          onClick={() => {
            setInputText('How does vault security work?');
            controller.sendUserMessage('How does vault security work?');
          }}
          className="text-[10px] px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 whitespace-nowrap cursor-pointer transition"
        >
          How does vault security work?
        </button>
        <button
          type="button"
          onClick={() => {
            setInputText('What student discounts can I get?');
            controller.sendUserMessage('What student discounts can I get?');
          }}
          className="text-[10px] px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 whitespace-nowrap cursor-pointer transition"
        >
          What student discounts can I get?
        </button>
        <button
          type="button"
          onClick={() => {
            setInputText('How do I switch student presets?');
            controller.sendUserMessage('How do I switch student presets?');
          }}
          className="text-[10px] px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 whitespace-nowrap cursor-pointer transition"
        >
          Switch student persona
        </button>
      </div>

      {/* Input Message Form */}
      <form
        onSubmit={handleSendMessage}
        className="p-3 border-t border-slate-800 bg-slate-950 flex items-center gap-2 shrink-0"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask agent or enter message..."
          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="py-2 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white text-xs font-medium transition cursor-pointer flex items-center gap-1 shadow-md shadow-indigo-600/20"
        >
          <Send className="h-3.5 w-3.5" />
          <span>Send</span>
        </button>
      </form>
    </div>
  );
}
