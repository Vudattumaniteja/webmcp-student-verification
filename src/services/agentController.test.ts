import { describe, it, expect, beforeEach } from 'vitest';
import { AgentController } from './agentController';
import { StudentVault } from './vault';
import { VerificationEngine } from './verificationEngine';
import { MerchantStore } from './merchantStore';

describe('AgentController', () => {
  let vault: StudentVault;
  let engine: VerificationEngine;
  let merchantStore: MerchantStore;
  let controller: AgentController;

  beforeEach(() => {
    vault = new StudentVault('STANFORD_VALID');
    engine = new VerificationEngine();
    merchantStore = new MerchantStore();
    controller = new AgentController({ vault, engine, merchantStore });
  });

  it('should initialize with idle state and welcome messages', () => {
    const state = controller.getState();
    expect(state.step).toBe('IDLE');
    expect(state.messages.length).toBeGreaterThan(0);
    expect(state.activeMerchantId).toBeNull();
    expect(state.activeVerificationId).toBeNull();
  });

  it('should complete instant verification for MIT_INSTANT preset', async () => {
    vault.switchPreset('MIT_INSTANT');
    const result = await controller.startVerification('openai_chatgpt_plus');

    expect(result.status).toBe('APPROVED');
    const state = controller.getState();
    expect(state.step).toBe('APPROVED');
    expect(state.activeMerchantId).toBe('openai_chatgpt_plus');
    expect(state.rewardCode).toBeDefined();
    expect(state.rewardCode).toContain('EDU-');

    // Merchant store should be updated
    const merchant = merchantStore.getMerchant('openai_chatgpt_plus');
    expect(merchant?.status).toBe('APPROVED');
    expect(merchant?.rewardCode).toBe(state.rewardCode);

    // Chat messages should contain search, personal info, and approval
    const texts = state.messages.map((m) => m.text).join(' ');
    expect(texts).toContain('Massachusetts Institute of Technology');
    expect(texts).toContain('Instant registrar match confirmed');
    expect(texts).toContain(state.rewardCode!);
  });

  it('should pause for HITL consent on docUpload requirement (STANFORD_VALID)', async () => {
    vault.switchPreset('STANFORD_VALID');
    const promise = controller.startVerification('spotify_premium');
    await promise;

    const state = controller.getState();
    expect(state.step).toBe('AWAITING_CONSENT');
    expect(state.consentData).toBeDefined();
    expect(state.consentData?.documentId).toBe('doc_stan_id_2026');
    expect(state.consentData?.docType).toBe('STUDENT_ID');
    expect(state.consentData?.fileName).toBe('stanford_id_2026.png');

    // Merchant should still be VERIFYING
    const merchant = merchantStore.getMerchant('spotify_premium');
    expect(merchant?.status).toBe('VERIFYING');

    // Chat should have a consent_request message
    const consentMsg = state.messages.find((m) => m.type === 'consent_request');
    expect(consentMsg).toBeDefined();
    expect(consentMsg?.consentData?.documentId).toBe('doc_stan_id_2026');
  });

  it('should complete verification after user confirms HITL consent', async () => {
    vault.switchPreset('STANFORD_VALID');
    await controller.startVerification('spotify_premium');
    expect(controller.getState().step).toBe('AWAITING_CONSENT');

    const result = await controller.confirmConsent();
    expect(result.status).toBe('APPROVED');

    const state = controller.getState();
    expect(state.step).toBe('APPROVED');
    expect(state.rewardCode).toBeDefined();

    const merchant = merchantStore.getMerchant('spotify_premium');
    expect(merchant?.status).toBe('APPROVED');
    expect(merchant?.rewardCode).toBe(state.rewardCode);
  });

  it('should perform autonomous recovery for EXPIRED_DOCUMENT (HARVARD_EXPIRED)', async () => {
    vault.switchPreset('HARVARD_EXPIRED');
    await controller.startVerification('aws_educate');

    // Initial document is the expired ID
    expect(controller.getState().step).toBe('AWAITING_CONSENT');
    expect(controller.getState().consentData?.documentId).toBe('doc_harv_id_2024');

    // User confirms initial upload
    await controller.confirmConsent();

    // Rejection should be caught and autonomous recovery triggered
    const state = controller.getState();
    expect(state.step).toBe('RECOVERY_PROMPT');
    expect(state.remedyData).toBeDefined();
    expect(state.remedyData?.rejectionCode).toBe('EXPIRED_DOCUMENT');
    expect(state.remedyData?.suggestedDocument.documentId).toBe('doc_harv_tuition_2026');
    expect(state.remedyData?.suggestedDocument.docType).toBe('TUITION_RECEIPT');

    // Chat messages should contain rejection explanation and remedy recommendation
    const texts = state.messages.map((m) => m.text).join(' ');
    expect(texts).toContain('expired');
    expect(texts).toContain('tuition receipt');

    // User confirms recovery with suggested replacement document
    const recoveryResult = await controller.confirmRecovery();
    expect(recoveryResult.status).toBe('APPROVED');

    const finalState = controller.getState();
    expect(finalState.step).toBe('APPROVED');
    expect(finalState.rewardCode).toBeDefined();

    const merchant = merchantStore.getMerchant('aws_educate');
    expect(merchant?.status).toBe('APPROVED');
    expect(merchant?.rewardCode).toBe(finalState.rewardCode);
  });

  it('should perform autonomous recovery for ILLEGIBLE_DOCUMENT (BERKELEY_ILLEGIBLE)', async () => {
    vault.switchPreset('BERKELEY_ILLEGIBLE');
    await controller.startVerification('notion_education');

    // Initial document is the blurry ID
    expect(controller.getState().step).toBe('AWAITING_CONSENT');
    expect(controller.getState().consentData?.documentId).toBe('doc_berk_blurry_id');

    // User confirms initial upload
    await controller.confirmConsent();

    // Rejection should trigger quality recovery
    const state = controller.getState();
    expect(state.step).toBe('RECOVERY_PROMPT');
    expect(state.remedyData).toBeDefined();
    expect(state.remedyData?.rejectionCode).toBe('ILLEGIBLE_DOCUMENT');
    expect(state.remedyData?.suggestedDocument.documentId).toBe('doc_berk_transcript_2026');
    expect(state.remedyData?.suggestedDocument.docType).toBe('TRANSCRIPT');

    // Chat messages should explain the illegible scan and suggest transcript
    const texts = state.messages.map((m) => m.text).join(' ');
    expect(texts).toContain('resolution');
    expect(texts).toContain('transcript');

    // User confirms recovery with suggested replacement transcript
    const recoveryResult = await controller.confirmRecovery();
    expect(recoveryResult.status).toBe('APPROVED');

    const finalState = controller.getState();
    expect(finalState.step).toBe('APPROVED');
    expect(finalState.rewardCode).toBeDefined();

    const merchant = merchantStore.getMerchant('notion_education');
    expect(merchant?.status).toBe('APPROVED');
    expect(merchant?.rewardCode).toBe(finalState.rewardCode);
  });

  it('should allow sending manual user messages and getting agent replies', async () => {
    const userMsg = controller.sendUserMessage('What discounts can I get?');
    expect(userMsg.sender).toBe('user');
    expect(userMsg.text).toBe('What discounts can I get?');

    const state = controller.getState();
    const lastMsg = state.messages[state.messages.length - 1];
    expect(lastMsg.sender).toBe('agent');
  });

  it('should reset state cleanly', async () => {
    vault.switchPreset('MIT_INSTANT');
    await controller.startVerification('openai_chatgpt_plus');
    expect(controller.getState().step).toBe('APPROVED');

    controller.reset();
    const state = controller.getState();
    expect(state.step).toBe('IDLE');
    expect(state.activeMerchantId).toBeNull();
    expect(state.activeVerificationId).toBeNull();
    expect(state.rewardCode).toBeUndefined();
  });
});
