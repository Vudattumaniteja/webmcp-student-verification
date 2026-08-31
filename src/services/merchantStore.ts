import { MerchantPerk, MerchantVerificationStatus } from '../types/merchants';

export const INITIAL_MERCHANTS: MerchantPerk[] = [
  {
    id: 'openai_chatgpt_plus',
    name: 'OpenAI ChatGPT Plus',
    brand: 'OpenAI',
    tagline: '4 months free access to GPT-4o, Canvas, and Advanced Voice',
    category: 'AI & Research',
    regularPrice: '$20/mo',
    studentPrice: '4 months free',
    discountValue: '$80 Value (100% OFF)',
    description:
      'Full access to GPT-4o with higher message limits, DALL·E 3, code interpreter, and custom GPT workspace tools.',
    perks: [
      'GPT-4o & o1 Reasoning Models',
      'Advanced Voice Mode',
      'Canvas & Data Analysis Workspace',
      'Custom GPT creation & sharing',
    ],
    tags: ['AI', 'GPT-4o', 'Research', 'Coding'],
    status: 'UNVERIFIED',
    brandGradient: 'from-emerald-950/60 via-slate-900 to-teal-950/40',
    accentColor: 'emerald',
    logoIcon: 'bot',
  },
  {
    id: 'spotify_premium',
    name: 'Spotify Premium Student',
    brand: 'Spotify',
    tagline: '$5.99/mo with Hulu (With Ads) included',
    category: 'Music & Audio',
    regularPrice: '$11.99/mo',
    studentPrice: '$5.99/mo + Hulu',
    discountValue: '50% OFF + Free Hulu',
    description:
      'Ad-free music listening with unlimited skips, offline song downloads, and free bundled subscription to Hulu.',
    perks: [
      'Ad-free on-demand music',
      'Offline playback downloads',
      'Included Hulu (With Ads) subscription',
      'High fidelity 320kbps audio',
    ],
    tags: ['Music', 'Hulu Bundle', 'Streaming', 'Podcasts'],
    status: 'UNVERIFIED',
    brandGradient: 'from-green-950/60 via-slate-900 to-emerald-950/40',
    accentColor: 'green',
    logoIcon: 'music',
  },
  {
    id: 'aws_educate',
    name: 'AWS Educate',
    brand: 'Amazon Web Services',
    tagline: '$100 annual cloud compute & ML credits + certified training',
    category: 'Cloud & DevOps',
    regularPrice: '$100/yr',
    studentPrice: '$100 annual credits + free labs',
    discountValue: '$100 Free Credits',
    description:
      'Access to 100+ hands-on cloud labs, compute instances, DynamoDB, Bedrock AI models, and AWS Academy training paths.',
    perks: [
      '$100 Annual AWS Cloud Credits',
      'No credit card required for sandbox',
      'AWS Bedrock & SageMaker access',
      'Official AWS certification discounts',
    ],
    tags: ['Cloud', 'Credits', 'DevOps', 'Machine Learning'],
    status: 'UNVERIFIED',
    brandGradient: 'from-amber-950/60 via-slate-900 to-orange-950/40',
    accentColor: 'amber',
    logoIcon: 'cloud',
  },
  {
    id: 'notion_education',
    name: 'Notion Education Plus',
    brand: 'Notion',
    tagline: 'Free Team Plus plan for students and educators',
    category: 'Productivity',
    regularPrice: '$10/mo',
    studentPrice: 'Free Plus Plan ($0)',
    discountValue: '100% OFF ($120/yr Value)',
    description:
      'Unlimited file uploads, unlimited page history up to 30 days, collaborative student workspaces, and Notion AI integration.',
    perks: [
      'Unlimited file uploads',
      '30-day page version history',
      'Collaborative workspace up to 100 guests',
      'Synced databases & LaTeX equations',
    ],
    tags: ['Productivity', 'Notes', 'Wiki', 'Collaboration'],
    status: 'UNVERIFIED',
    brandGradient: 'from-indigo-950/60 via-slate-900 to-slate-900',
    accentColor: 'indigo',
    logoIcon: 'file-text',
  },
  {
    id: 'youtube_premium',
    name: 'YouTube Premium Student',
    brand: 'YouTube',
    tagline: '$7.99/mo for ad-free videos & YouTube Music',
    category: 'Streaming',
    regularPrice: '$13.99/mo',
    studentPrice: '$7.99/mo',
    discountValue: '43% OFF',
    description:
      'Ad-free YouTube playback, background video playback on mobile, video downloads, and bundled YouTube Music Premium.',
    perks: [
      'Ad-free video streaming',
      'Background playback with screen locked',
      'Offline video and music downloads',
      'YouTube Music Premium included',
    ],
    tags: ['Streaming', 'Video', 'YouTube Music', 'Ad-Free'],
    status: 'UNVERIFIED',
    brandGradient: 'from-rose-950/60 via-slate-900 to-red-950/40',
    accentColor: 'rose',
    logoIcon: 'play',
  },
];

export class MerchantStore {
  private merchants: MerchantPerk[];
  private listeners: Set<(merchants: MerchantPerk[]) => void> = new Set();

  constructor(initialMerchants?: MerchantPerk[]) {
    this.merchants = initialMerchants ? JSON.parse(JSON.stringify(initialMerchants)) : JSON.parse(JSON.stringify(INITIAL_MERCHANTS));
  }

  getMerchants(): MerchantPerk[] {
    return [...this.merchants];
  }

  getMerchant(id: string): MerchantPerk | undefined {
    return this.merchants.find((m) => m.id === id);
  }

  updateMerchantStatus(
    merchantId: string,
    status: MerchantVerificationStatus,
    rewardCode?: string,
    errorMessage?: string,
  ): MerchantPerk {
    const index = this.merchants.findIndex((m) => m.id === merchantId);
    if (index === -1) {
      throw new Error(`Merchant with ID "${merchantId}" not found`);
    }

    const updated: MerchantPerk = {
      ...this.merchants[index],
      status,
      rewardCode: rewardCode !== undefined ? rewardCode : this.merchants[index].rewardCode,
      errorMessage: errorMessage !== undefined ? errorMessage : this.merchants[index].errorMessage,
      updatedAt: new Date().toISOString(),
    };

    if (status === 'UNVERIFIED') {
      updated.rewardCode = undefined;
      updated.errorMessage = undefined;
    }

    this.merchants[index] = updated;
    this.notify();
    return updated;
  }

  claimPerk(merchantId: string): MerchantPerk {
    return this.updateMerchantStatus(merchantId, 'VERIFYING');
  }

  reset(): void {
    this.merchants = JSON.parse(JSON.stringify(INITIAL_MERCHANTS));
    this.notify();
  }

  subscribe(listener: (merchants: MerchantPerk[]) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const data = this.getMerchants();
    this.listeners.forEach((listener) => listener(data));
  }
}

export const globalMerchantStore = new MerchantStore();
