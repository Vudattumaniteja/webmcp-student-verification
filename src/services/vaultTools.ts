import { DemoPresetId, WebMCPToolDefinition } from '../types/vault.ts';
import { StudentVault } from './vault.ts';

export function createVaultTools(vault: StudentVault): WebMCPToolDefinition[] {
  return [
    {
      name: 'get_student_vault_profile',
      title: 'Get Student Vault Profile',
      description: 'Retrieves the student personal identity profile (name, email, institution) from the local browser vault without exposing document binaries.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
      annotations: {
        readOnlyHint: true,
        untrustedContentHint: false,
      },
      execute: async () => {
        const profile = vault.getSanitizedProfile();
        return JSON.stringify(profile);
      },
    },

    {
      name: 'list_vault_documents',
      title: 'List Vault Documents',
      description: 'Lists sanitized document metadata handles from the local vault for claim-check verification without raw binary data.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
      annotations: {
        readOnlyHint: true,
        untrustedContentHint: false,
      },
      execute: async () => {
        const handles = vault.listSanitizedHandles();
        return JSON.stringify(handles);
      },
    },

    {
      name: 'switch_demo_preset',
      title: 'Switch Demo Preset',
      description: 'Switches the active student persona and associated proof documents in the local vault to a selected demo preset.',
      inputSchema: {
        type: 'object',
        properties: {
          presetId: {
            type: 'string',
            enum: ['STANFORD_VALID', 'HARVARD_EXPIRED', 'BERKELEY_ILLEGIBLE', 'MIT_INSTANT'],
            description: 'The demo student preset ID to activate',
          },
        },
        required: ['presetId'],
      },
      annotations: {
        readOnlyHint: false,
        untrustedContentHint: false,
      },
      execute: async (input: { presetId?: string }) => {
        if (!input || !input.presetId) {
          throw new Error('Preset ID is required.');
        }

        const validPresets: DemoPresetId[] = [
          'STANFORD_VALID',
          'HARVARD_EXPIRED',
          'BERKELEY_ILLEGIBLE',
          'MIT_INSTANT',
        ];

        if (!validPresets.includes(input.presetId as DemoPresetId)) {
          throw new Error(`Invalid preset ID: "${input.presetId}". Valid options: ${validPresets.join(', ')}`);
        }

        vault.switchPreset(input.presetId as DemoPresetId);
        const preset = vault.getActivePreset();
        return `Activated preset ${preset.id}: "${preset.name}" (${preset.profile.fullName}, ${preset.profile.universityName}) with ${preset.documents.length} document(s).`;
      },
    },
  ];
}
