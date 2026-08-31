import { createVerificationTools } from './verificationTools';
import { createVaultTools } from '../services/vaultTools';
import { VerificationEngine, globalVerificationEngine } from '../services/verificationEngine';
import { StudentVault, globalVault } from '../services/vault';
import { WebMCPToolDefinition } from '../types/vault';

export * from './verificationTools';
export * from '../services/vaultTools';

/**
 * Returns the 7 primary WebMCP Student Verification suite tools:
 * 1. search_school
 * 2. submit_student_verification
 * 3. upload_vault_document
 * 4. check_verification_status
 * 5. get_student_vault_profile
 * 6. list_vault_documents
 * 7. switch_demo_preset
 */
export function createAllWebMCPTools(
  engine: VerificationEngine = globalVerificationEngine,
  vault: StudentVault = globalVault,
): WebMCPToolDefinition[] {
  const verificationTools = createVerificationTools(engine, vault);
  const vaultTools = createVaultTools(vault);

  return [...verificationTools, ...vaultTools];
}
