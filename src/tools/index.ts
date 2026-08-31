import { createVerificationTools } from './verificationTools';
import { createVaultTools } from '../services/vaultTools';
import { VerificationEngine, globalVerificationEngine } from '../services/verificationEngine';
import { StudentVault, globalVault } from '../services/vault';
import { ArchitectureStore, globalStore } from '../shared/state';
import { CallerSource } from '../shared/tools';
import { WebMCPToolDefinition } from '../types/vault';

export * from './verificationTools';
export * from '../services/vaultTools';

export interface WrappedWebMCPToolDefinition extends WebMCPToolDefinition {
  execute: (input: Record<string, unknown>, store?: ArchitectureStore, callerSource?: CallerSource) => Promise<string>;
}

export function wrapToolWithLogging(
  tool: WebMCPToolDefinition,
  store: ArchitectureStore = globalStore,
): WrappedWebMCPToolDefinition {
  return {
    ...tool,
    execute: async (
      input: Record<string, unknown>,
      customStore?: ArchitectureStore,
      callerSource: CallerSource = 'WebMCP',
    ) => {
      const activeStore = customStore || store;
      const result = await tool.execute(input as any);
      activeStore.addLog(callerSource, `[${tool.name}] ${result}`);
      return result;
    },
  };
}

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
  store: ArchitectureStore = globalStore,
): WrappedWebMCPToolDefinition[] {
  const verificationTools = createVerificationTools(engine, vault);
  const vaultTools = createVaultTools(vault);
  const rawTools = [...verificationTools, ...vaultTools];

  return rawTools.map((tool) => wrapToolWithLogging(tool, store));
}
