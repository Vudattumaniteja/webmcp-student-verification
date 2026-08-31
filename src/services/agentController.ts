import { StudentVault, globalVault } from './vault';
import { VerificationEngine, globalVerificationEngine, VerificationResult } from './verificationEngine';
import { MerchantStore, globalMerchantStore } from './merchantStore';
import { searchSchools } from './schoolSearch';
import { VaultDocument } from '../types/vault';

export type AgentStep =
  | 'IDLE'
  | 'SEARCHING_SCHOOL'
  | 'SUBMITTING_DETAILS'
  | 'VAULT_MATCHING'
  | 'AWAITING_CONSENT'
  | 'UPLOADING_DOCUMENT'
  | 'CHECKING_STATUS'
  | 'RECOVERY_PROMPT'
  | 'APPROVED'
  | 'ERROR';

export type AgentMessageType =
  | 'narration'
  | 'tool_call'
  | 'consent_request'
  | 'remedy_prompt'
  | 'status_badge'
  | 'approval_card'
  | 'error';

export interface AgentToolCallInfo {
  name: string;
  title?: string;
  input?: Record<string, unknown>;
  output?: Record<string, unknown> | string;
}

export interface DocumentSummary {
  documentId: string;
  documentTitle?: string;
  docType: string;
  fileName: string;
  fileSizeBytes?: number;
  expirationDate?: string;
  issuer?: string;
}

export interface ConsentData extends DocumentSummary {
  verificationId: string;
  merchantId?: string;
  issuer: string;
}

export interface RemedyData {
  verificationId: string;
  merchantId?: string;
  rejectionCode: string;
  rejectionReason: string;
  remedyText?: string;
  currentDocumentId: string;
  suggestedDocument: DocumentSummary;
}

export interface ApprovalData {
  merchantId: string;
  merchantName: string;
  rewardCode: string;
  schoolName: string;
}

export interface AgentChatMessage {
  id: string;
  sender: 'agent' | 'user' | 'system';
  text: string;
  timestamp: string;
  type: AgentMessageType;
  toolCall?: AgentToolCallInfo;
  consentData?: ConsentData;
  remedyData?: RemedyData;
  approvalData?: ApprovalData;
}

export interface AgentState {
  step: AgentStep;
  activeMerchantId: string | null;
  activeVerificationId: string | null;
  rewardCode?: string;
  messages: AgentChatMessage[];
  consentData?: ConsentData;
  remedyData?: RemedyData;
  errorMessage?: string;
}

export interface AgentControllerOptions {
  vault?: StudentVault;
  engine?: VerificationEngine;
  merchantStore?: MerchantStore;
}

export type AgentListener = (state: AgentState) => void;

export class AgentController {
  private vault: StudentVault;
  private engine: VerificationEngine;
  private merchantStore: MerchantStore;
  private state: AgentState;
  private listeners: Set<AgentListener> = new Set();
  private messageCounter = 0;

  constructor(options: AgentControllerOptions = {}) {
    this.vault = options.vault || globalVault;
    this.engine = options.engine || globalVerificationEngine;
    this.merchantStore = options.merchantStore || globalMerchantStore;

    this.state = {
      step: 'IDLE',
      activeMerchantId: null,
      activeVerificationId: null,
      messages: [
        {
          id: `msg_${Date.now()}_${++this.messageCounter}`,
          sender: 'agent',
          type: 'narration',
          text: 'Hello! I am your Autonomous Student Verification Agent. Select any perk or discount offer to begin zero-PII in-browser verification.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        },
      ],
    };
  }

  public getState(): AgentState {
    return {
      ...this.state,
      messages: [...this.state.messages],
    };
  }

  public subscribe(listener: AgentListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const currentState = this.getState();
    for (const listener of this.listeners) {
      listener(currentState);
    }
  }

  private addMessage(
    sender: 'agent' | 'user' | 'system',
    text: string,
    type: AgentMessageType = 'narration',
    extras?: Partial<AgentChatMessage>,
  ): AgentChatMessage {
    const newMsg: AgentChatMessage = {
      id: `msg_${Date.now()}_${++this.messageCounter}`,
      sender,
      text,
      type,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      ...extras,
    };

    this.state.messages.push(newMsg);
    this.notify();
    return newMsg;
  }

  public async startVerification(merchantId: string): Promise<VerificationResult> {
    this.state.activeMerchantId = merchantId;
    this.state.rewardCode = undefined;
    this.state.consentData = undefined;
    this.state.remedyData = undefined;
    this.state.errorMessage = undefined;

    const merchant = this.merchantStore.getMerchant(merchantId);
    const merchantName = merchant ? merchant.name : merchantId;
    this.merchantStore.updateMerchantStatus(merchantId, 'VERIFYING');

    this.addMessage(
      'agent',
      `Starting automated student verification for ${merchantName}. Inspecting local sandbox student vault...`,
      'narration',
    );

    // Step 1: School Search
    this.state.step = 'SEARCHING_SCHOOL';
    this.notify();

    const profile = this.vault.getProfile();
    this.addMessage('system', `[Tool Call] search_school({ query: "${profile.universityName}" })`, 'tool_call', {
      toolCall: {
        name: 'search_school',
        title: 'Search Accredited Universities',
        input: { query: profile.universityName },
      },
    });

    const schoolMatches = searchSchools(profile.universityName, { limit: 3 });
    const matchedSchool = schoolMatches.find((s) => s.id === profile.universityId) || schoolMatches[0];

    if (!matchedSchool) {
      const errMsg = `Accredited institution "${profile.universityName}" could not be resolved.`;
      this.state.step = 'ERROR';
      this.state.errorMessage = errMsg;
      this.merchantStore.updateMerchantStatus(merchantId, 'ERROR', undefined, errMsg);
      this.addMessage('agent', errMsg, 'error');
      return {
        verificationId: '',
        status: 'REJECTED',
        currentStep: 'collectStudentPersonalInfo',
        message: errMsg,
      };
    }

    this.addMessage(
      'agent',
      `Resolved accredited institution: ${matchedSchool.name} (${matchedSchool.domain}). Instant Registrar Match: ${
        matchedSchool.instantMatchEligible ? 'Supported' : 'Document Required'
      }.`,
      'narration',
    );

    // Step 2: Personal Details
    this.state.step = 'SUBMITTING_DETAILS';
    this.notify();

    this.addMessage(
      'system',
      `[Tool Call] submit_student_verification({ schoolId: "${matchedSchool.id}", name: "${profile.fullName}", email: "${profile.email}" })`,
      'tool_call',
      {
        toolCall: {
          name: 'submit_student_verification',
          title: 'Submit Student Verification',
          input: {
            schoolId: matchedSchool.id,
            firstName: profile.firstName,
            lastName: profile.lastName,
            email: profile.email,
            merchantId,
          },
        },
      },
    );

    const submissionResult = this.engine.submitPersonalInfo({
      schoolId: matchedSchool.id,
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      birthDate: profile.birthDate,
      merchantId,
    });

    this.state.activeVerificationId = submissionResult.verificationId;

    // Step 3: Check Instant Match Outcome
    if (submissionResult.status === 'APPROVED') {
      this.state.step = 'APPROVED';
      this.state.rewardCode = submissionResult.rewardCode;
      this.merchantStore.updateMerchantStatus(merchantId, 'APPROVED', submissionResult.rewardCode);

      this.addMessage(
        'agent',
        `Instant registrar match confirmed with ${matchedSchool.name}. Student discount reward code unlocked: ${submissionResult.rewardCode}`,
        'narration',
      );

      this.addMessage(
        'agent',
        `Verification completed! Promo code "${submissionResult.rewardCode}" has been applied to ${merchantName}.`,
        'approval_card',
        {
          approvalData: {
            merchantId,
            merchantName,
            rewardCode: submissionResult.rewardCode || '',
            schoolName: matchedSchool.name,
          },
        },
      );

      return submissionResult;
    }

    // Step 4: Document Upload Required -> Vault Match & HITL Consent
    this.state.step = 'VAULT_MATCHING';
    this.notify();

    this.addMessage(
      'system',
      '[Tool Call] list_vault_documents()',
      'tool_call',
      {
        toolCall: {
          name: 'list_vault_documents',
          title: 'List Vault Documents',
          input: {},
        },
      },
    );

    const docs = this.vault.listDocuments();
    if (docs.length === 0) {
      const errMsg = 'No proof documents found in student vault. Please add a document to proceed.';
      this.state.step = 'ERROR';
      this.state.errorMessage = errMsg;
      this.merchantStore.updateMerchantStatus(merchantId, 'ERROR', undefined, errMsg);
      this.addMessage('agent', errMsg, 'error');
      return submissionResult;
    }

    // Select primary document (first document in vault)
    const primaryDoc = docs[0];
    const consentData: ConsentData = {
      documentId: primaryDoc.id,
      documentTitle: primaryDoc.title,
      docType: primaryDoc.docType,
      issuer: profile.universityName,
      fileName: primaryDoc.fileName,
      fileSizeBytes: primaryDoc.fileSizeBytes,
      expirationDate: primaryDoc.expirationDate,
      verificationId: submissionResult.verificationId,
      merchantId,
    };

    this.state.consentData = consentData;
    this.state.step = 'AWAITING_CONSENT';

    this.addMessage(
      'agent',
      `Proof of enrollment is required. Found document "${primaryDoc.title}" (${primaryDoc.fileName}) in your vault. Requesting your explicit consent before streaming upload.`,
      'consent_request',
      { consentData },
    );

    return submissionResult;
  }

  public async confirmConsent(documentIdOverride?: string): Promise<VerificationResult> {
    const targetDocId = documentIdOverride || this.state.consentData?.documentId;
    const verificationId = this.state.activeVerificationId || this.state.consentData?.verificationId;
    const merchantId = this.state.activeMerchantId || this.state.consentData?.merchantId;

    if (!verificationId || !targetDocId) {
      const errMsg = 'Cannot confirm upload: missing active verification session or document ID.';
      this.state.step = 'ERROR';
      this.state.errorMessage = errMsg;
      this.addMessage('agent', errMsg, 'error');
      throw new Error(errMsg);
    }

    const docMetadata = this.vault.getDocumentMetadata(targetDocId);
    const docTitle = docMetadata ? docMetadata.title : targetDocId;

    this.addMessage('user', `Confirmed: Stream upload proof asset "${docTitle}" to verification authority.`, 'narration');

    // Step: Uploading Document
    this.state.step = 'UPLOADING_DOCUMENT';
    this.notify();

    this.addMessage(
      'system',
      `[Tool Call] upload_vault_document({ verificationId: "${verificationId}", documentId: "${targetDocId}" })`,
      'tool_call',
      {
        toolCall: {
          name: 'upload_vault_document',
          title: 'Upload Vault Document',
          input: { verificationId, documentId: targetDocId },
        },
      },
    );

    const docBlob = await this.vault.getDocumentBlob(targetDocId);
    if (!docBlob) {
      const errMsg = `Document binary missing in sandbox for handle "${targetDocId}".`;
      this.state.step = 'ERROR';
      this.state.errorMessage = errMsg;
      if (merchantId) {
        this.merchantStore.updateMerchantStatus(merchantId, 'ERROR', undefined, errMsg);
      }
      this.addMessage('agent', errMsg, 'error');
      return {
        verificationId,
        status: 'REJECTED',
        currentStep: 'docUpload',
        message: errMsg,
      };
    }

    const uploadResult = this.engine.uploadDocumentDirect(verificationId, docBlob, docMetadata);

    // Step: Checking Status
    this.state.step = 'CHECKING_STATUS';
    this.notify();

    return this.handleVerificationOutcome(uploadResult, targetDocId);
  }

  public async confirmRecovery(replacementDocumentIdOverride?: string): Promise<VerificationResult> {
    const targetDocId =
      replacementDocumentIdOverride || this.state.remedyData?.suggestedDocument.documentId;
    const verificationId = this.state.activeVerificationId || this.state.remedyData?.verificationId;
    const merchantId = this.state.activeMerchantId || this.state.remedyData?.merchantId;

    if (!verificationId || !targetDocId) {
      const errMsg = 'Cannot re-submit: missing active verification session or replacement document ID.';
      this.state.step = 'ERROR';
      this.state.errorMessage = errMsg;
      this.addMessage('agent', errMsg, 'error');
      throw new Error(errMsg);
    }

    const docMetadata = this.vault.getDocumentMetadata(targetDocId);
    const docTitle = docMetadata ? docMetadata.title : targetDocId;

    this.addMessage(
      'user',
      `Confirmed: Re-submitting verification with replacement document "${docTitle}".`,
      'narration',
    );

    this.state.step = 'UPLOADING_DOCUMENT';
    this.notify();

    this.addMessage(
      'system',
      `[Tool Call] upload_vault_document({ verificationId: "${verificationId}", documentId: "${targetDocId}" })`,
      'tool_call',
      {
        toolCall: {
          name: 'upload_vault_document',
          title: 'Upload Replacement Document',
          input: { verificationId, documentId: targetDocId },
        },
      },
    );

    const docBlob = await this.vault.getDocumentBlob(targetDocId);
    if (!docBlob) {
      const errMsg = `Replacement document binary missing in sandbox for handle "${targetDocId}".`;
      this.state.step = 'ERROR';
      this.state.errorMessage = errMsg;
      if (merchantId) {
        this.merchantStore.updateMerchantStatus(merchantId, 'ERROR', undefined, errMsg);
      }
      this.addMessage('agent', errMsg, 'error');
      return {
        verificationId,
        status: 'REJECTED',
        currentStep: 'docUpload',
        message: errMsg,
      };
    }

    const uploadResult = this.engine.uploadDocumentDirect(verificationId, docBlob, docMetadata);

    this.state.step = 'CHECKING_STATUS';
    this.notify();

    return this.handleVerificationOutcome(uploadResult, targetDocId, true);
  }

  private handleVerificationOutcome(
    result: VerificationResult,
    uploadedDocId: string,
    isRecovery = false,
  ): VerificationResult {
    const merchantId = this.state.activeMerchantId;
    const merchant = merchantId ? this.merchantStore.getMerchant(merchantId) : undefined;
    const merchantName = merchant ? merchant.name : merchantId || 'Perk';
    const profile = this.vault.getProfile();

    if (result.status === 'APPROVED') {
      this.state.step = 'APPROVED';
      this.state.rewardCode = result.rewardCode;
      this.state.consentData = undefined;
      this.state.remedyData = undefined;
      if (merchantId) {
        this.merchantStore.updateMerchantStatus(merchantId, 'APPROVED', result.rewardCode);
      }

      this.addMessage(
        'agent',
        isRecovery
          ? `Autonomous recovery successful! Enrollment confirmed with replacement document. Discount promo code unlocked: ${result.rewardCode}`
          : `Document verified successfully! Student discount reward code unlocked: ${result.rewardCode}`,
        'narration',
      );

      this.addMessage(
        'agent',
        `Verification approved! Code "${result.rewardCode}" unlocked for ${merchantName}.`,
        'approval_card',
        {
          approvalData: {
            merchantId: merchantId || '',
            merchantName,
            rewardCode: result.rewardCode || '',
            schoolName: profile.universityName,
          },
        },
      );

      return result;
    }

    // Handle Rejections & Autonomous Recovery
    const rejectionCode = result.rejectionCode || 'REJECTED';
    const rejectionReason = result.rejectionReason || 'Document could not be verified.';
    const remedyText = result.remedyText || 'Please submit an alternative official document.';

    this.addMessage(
      'agent',
      `Verification Authority Rejection (${rejectionCode}): ${rejectionReason} ${remedyText}`,
      'narration',
    );

    // Autonomous Error Recovery Flow: Scan vault for alternative valid document
    const replacementDoc = this.findReplacementDocument(uploadedDocId, rejectionCode);

    if (replacementDoc) {
      const remedyData: RemedyData = {
        verificationId: result.verificationId,
        merchantId: merchantId || undefined,
        rejectionCode,
        rejectionReason,
        remedyText,
        currentDocumentId: uploadedDocId,
        suggestedDocument: {
          documentId: replacementDoc.id,
          documentTitle: replacementDoc.title,
          docType: replacementDoc.docType,
          fileName: replacementDoc.fileName,
          fileSizeBytes: replacementDoc.fileSizeBytes,
          expirationDate: replacementDoc.expirationDate,
        },
      };

      this.state.remedyData = remedyData;
      this.state.step = 'RECOVERY_PROMPT';

      this.addMessage(
        'agent',
        `Autonomous Recovery Triggered: Found valid replacement document "${replacementDoc.title}" (${replacementDoc.fileName}) in your vault. Would you like me to re-submit verification with this document?`,
        'remedy_prompt',
        { remedyData },
      );
    } else {
      // No replacement available
      this.state.step = 'ERROR';
      this.state.errorMessage = `${rejectionReason} ${remedyText}`;
      if (merchantId) {
        this.merchantStore.updateMerchantStatus(
          merchantId,
          'ERROR',
          undefined,
          `${rejectionReason} ${remedyText}`,
        );
      }
      this.addMessage(
        'agent',
        `No alternative valid documents found in your vault. Please add a valid document in the Student Vault tab.`,
        'error',
      );
    }

    return result;
  }

  private findReplacementDocument(
    currentDocId: string,
    rejectionCode: string,
  ): VaultDocument | undefined {
    const allDocs = this.vault.listDocuments();
    const otherDocs = allDocs.filter((d) => d.id !== currentDocId && d.isValid && !d.isIllegible);

    if (rejectionCode === 'EXPIRED_DOCUMENT') {
      // Prioritize tuition receipt or transcript or schedule
      const tuitionDoc = otherDocs.find((d) => d.docType === 'TUITION_RECEIPT');
      if (tuitionDoc) return tuitionDoc;
      const transcriptDoc = otherDocs.find((d) => d.docType === 'TRANSCRIPT');
      if (transcriptDoc) return transcriptDoc;
      const scheduleDoc = otherDocs.find((d) => d.docType === 'CLASS_SCHEDULE');
      if (scheduleDoc) return scheduleDoc;
      return otherDocs[0];
    }

    if (rejectionCode === 'ILLEGIBLE_DOCUMENT') {
      // Prioritize official transcript or tuition receipt
      const transcriptDoc = otherDocs.find((d) => d.docType === 'TRANSCRIPT');
      if (transcriptDoc) return transcriptDoc;
      const tuitionDoc = otherDocs.find((d) => d.docType === 'TUITION_RECEIPT');
      if (tuitionDoc) return tuitionDoc;
      const scheduleDoc = otherDocs.find((d) => d.docType === 'CLASS_SCHEDULE');
      if (scheduleDoc) return scheduleDoc;
      return otherDocs[0];
    }

    return otherDocs[0];
  }

  public sendUserMessage(text: string): AgentChatMessage {
    const userMsg = this.addMessage('user', text, 'narration');

    const lower = text.toLowerCase();
    let reply = 'I am monitoring your student verification session. Let me know if you would like me to claim any student discount perk.';

    if (lower.includes('discount') || lower.includes('perk') || lower.includes('offer')) {
      reply = 'You can claim exclusive discounts like OpenAI ChatGPT Plus, Spotify Premium, AWS Educate, Notion, and YouTube Premium. Simply click "Claim with WebMCP" on any card.';
    } else if (lower.includes('vault') || lower.includes('document')) {
      reply = 'Your document binaries are safely sandboxed locally in your browser. I only view sanitized claim-check handles to preserve your privacy.';
    } else if (lower.includes('preset') || lower.includes('switch') || lower.includes('persona')) {
      reply = 'You can switch between Stanford (standard flow), Harvard (expired ID recovery), Berkeley (blurry scan recovery), and MIT (instant registrar match) in the Student Vault tab.';
    }

    this.addMessage('agent', reply, 'narration');
    return userMsg;
  }

  public reset(): void {
    this.state = {
      step: 'IDLE',
      activeMerchantId: null,
      activeVerificationId: null,
      rewardCode: undefined,
      consentData: undefined,
      remedyData: undefined,
      errorMessage: undefined,
      messages: [
        {
          id: `msg_${Date.now()}_${++this.messageCounter}`,
          sender: 'agent',
          type: 'narration',
          text: 'Autonomous Verification Agent reset. Select any merchant perk to begin.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        },
      ],
    };
    this.notify();
  }
}

export const globalAgentController = new AgentController();
