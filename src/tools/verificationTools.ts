import { searchSchools } from '../services/schoolSearch';
import { VerificationEngine, globalVerificationEngine } from '../services/verificationEngine';
import { StudentVault, globalVault } from '../services/vault';

export interface WebMCPToolDefinition {
  name: string;
  title: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
  annotations: {
    readOnlyHint: boolean;
    untrustedContentHint: boolean;
  };
  execute: (input: any) => Promise<string>;
}

export function createVerificationTools(
  engine: VerificationEngine = globalVerificationEngine,
  vault: StudentVault = globalVault,
): WebMCPToolDefinition[] {
  return [
    {
      name: 'search_school',
      title: 'Search Accredited Universities',
      description:
        'Searches accredited universities by name, alias, or domain to retrieve institution IDs for student discount verification.',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'University name, domain (e.g. "mit.edu"), or alias (e.g. "MIT", "Berkeley")',
          },
          limit: {
            type: 'number',
            description: 'Maximum number of school results to return (default: 3, max: 5)',
          },
        },
        required: ['query'],
      },
      annotations: {
        readOnlyHint: true,
        untrustedContentHint: false,
      },
      execute: async (input: { query?: string; limit?: number }) => {
        const query = input?.query || '';
        const limit = Math.min(input?.limit || 3, 5);
        const matches = searchSchools(query, { limit });

        const formatted = {
          query,
          count: matches.length,
          schools: matches.map((m) => ({
            id: m.id,
            name: m.name,
            domain: m.domain,
            instantEligible: m.instantMatchEligible,
          })),
        };

        const json = JSON.stringify(formatted);
        // Truncate safely if it ever exceeds 440 characters
        if (json.length > 440) {
          return JSON.stringify({
            query,
            count: matches.length,
            schools: matches.slice(0, 2).map((m) => ({
              id: m.id,
              name: m.name,
              instantEligible: m.instantMatchEligible,
            })),
          });
        }
        return json;
      },
    },

    {
      name: 'submit_student_verification',
      title: 'Submit Student Verification',
      description:
        'Submits student personal info to the verification authority for instant registrar matching or document upload instructions.',
      inputSchema: {
        type: 'object',
        properties: {
          schoolId: {
            type: 'string',
            description: 'Accredited university institution ID (e.g. "sch_mit_001")',
          },
          firstName: {
            type: 'string',
            description: 'Student legal first name',
          },
          lastName: {
            type: 'string',
            description: 'Student legal last name',
          },
          email: {
            type: 'string',
            description: 'Student university email address (e.g. "student@mit.edu")',
          },
          birthDate: {
            type: 'string',
            description: 'Optional date of birth (YYYY-MM-DD)',
          },
          merchantId: {
            type: 'string',
            description: 'Optional merchant discount offer ID (e.g. "chatgpt_plus", "spotify_premium")',
          },
        },
        required: ['schoolId', 'firstName', 'lastName', 'email'],
      },
      annotations: {
        readOnlyHint: false,
        untrustedContentHint: false,
      },
      execute: async (input: {
        schoolId: string;
        firstName: string;
        lastName: string;
        email: string;
        birthDate?: string;
        merchantId?: string;
      }) => {
        try {
          const result = engine.submitPersonalInfo({
            schoolId: input?.schoolId,
            firstName: input?.firstName,
            lastName: input?.lastName,
            email: input?.email,
            birthDate: input?.birthDate,
            merchantId: input?.merchantId,
          });

          if (result.status === 'APPROVED') {
            return JSON.stringify({
              verificationId: result.verificationId,
              status: result.status,
              currentStep: result.currentStep,
              rewardCode: result.rewardCode,
              message: result.message,
            });
          }

          return JSON.stringify({
            verificationId: result.verificationId,
            status: result.status,
            currentStep: result.currentStep,
            uploadUrl: result.uploadUrl,
            allowedDocTypes: result.allowedDocTypes,
            message: result.message,
          });
        } catch (err: any) {
          return JSON.stringify({
            error: err.message || 'Verification submission failed',
          });
        }
      },
    },

    {
      name: 'upload_vault_document',
      title: 'Upload Vault Document',
      description:
        'Uploads a proof document from the local student vault to the verification authority via pre-signed URL without leaking binary data.',
      inputSchema: {
        type: 'object',
        properties: {
          verificationId: {
            type: 'string',
            description: 'Active verification session ID (e.g. "ver_12345")',
          },
          documentId: {
            type: 'string',
            description: 'Vault document handle ID (e.g. "doc_stan_id_2026")',
          },
        },
        required: ['verificationId', 'documentId'],
      },
      annotations: {
        readOnlyHint: false,
        untrustedContentHint: false,
      },
      execute: async (input: { verificationId: string; documentId: string }) => {
        try {
          if (!input?.verificationId || !input?.documentId) {
            return JSON.stringify({
              error: 'verificationId and documentId are required parameters',
            });
          }

          const session = engine.getSession(input.verificationId);
          if (!session) {
            return JSON.stringify({
              error: `Verification session not found for ID "${input.verificationId}"`,
            });
          }

          const docBlob = await vault.getDocumentBlob(input.documentId);
          if (!docBlob) {
            return JSON.stringify({
              error: `Document "${input.documentId}" not found in vault.`,
            });
          }

          const metadata = vault.getDocumentMetadata(input.documentId);
          const result = engine.uploadDocumentDirect(input.verificationId, docBlob, metadata);

          if (result.status === 'APPROVED') {
            return JSON.stringify({
              verificationId: result.verificationId,
              documentId: input.documentId,
              status: result.status,
              rewardCode: result.rewardCode,
              message: 'Document uploaded and verified successfully.',
            });
          }

          return JSON.stringify({
            verificationId: result.verificationId,
            documentId: input.documentId,
            status: result.status,
            rejectionCode: result.rejectionCode,
            rejectionReason: result.rejectionReason,
            remedyText: result.remedyText,
          });
        } catch (err: any) {
          return JSON.stringify({
            error: err.message || 'Document upload failed',
          });
        }
      },
    },

    {
      name: 'check_verification_status',
      title: 'Check Verification Status',
      description:
        'Checks the real-time status and outcome of an in-progress or completed student verification session.',
      inputSchema: {
        type: 'object',
        properties: {
          verificationId: {
            type: 'string',
            description: 'Verification session ID to check',
          },
        },
        required: ['verificationId'],
      },
      annotations: {
        readOnlyHint: true,
        untrustedContentHint: false,
      },
      execute: async (input: { verificationId: string }) => {
        try {
          if (!input?.verificationId) {
            return JSON.stringify({
              error: 'verificationId is required',
            });
          }

          const session = engine.getSession(input.verificationId);
          if (!session) {
            return JSON.stringify({
              error: `Verification session not found for ID "${input.verificationId}"`,
            });
          }

          const responsePayload: Record<string, any> = {
            verificationId: session.verificationId,
            status: session.status,
            currentStep: session.currentStep,
          };

          if (session.rewardCode) {
            responsePayload.rewardCode = session.rewardCode;
          }
          if (session.rejectionCode) {
            responsePayload.rejectionCode = session.rejectionCode;
          }
          if (session.rejectionReason) {
            responsePayload.rejectionReason = session.rejectionReason;
          }
          if (session.remedyText && session.remedyText !== session.rejectionReason) {
            responsePayload.remedyText = session.remedyText;
          }
          if (session.uploadUrl && session.status === 'PENDING_DOCS') {
            responsePayload.uploadUrl = session.uploadUrl;
          }

          if (session.status === 'APPROVED') {
            responsePayload.message = `Verification approved. Reward code: ${session.rewardCode}`;
          } else if (session.status === 'PENDING_DOCS') {
            responsePayload.message = `Proof of enrollment required for ${session.schoolName}.`;
          }

          return JSON.stringify(responsePayload);
        } catch (err: any) {
          return JSON.stringify({
            error: err.message || 'Status check failed',
          });
        }
      },
    },
  ];
}
