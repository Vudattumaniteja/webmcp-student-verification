import { MerchantPerk, MerchantVerificationStatus } from '../types/merchants';

export const INITIAL_MERCHANTS: MerchantPerk[] = [
  {
    id: 'spotify_premium',
    name: 'Spotify Premium Student',
    brand: 'Spotify',
    domain: 'spotify.com',
    tagline: 'Spotify Premium Student with Hulu - 50% OFF ($5.99/mo)',
    category: 'MUSIC & STREAMING',
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
    partnerUrl: 'https://spotify.com/student',
  },
  {
    id: 'openai_chatgpt_plus',
    name: 'OpenAI ChatGPT Plus',
    brand: 'OpenAI',
    domain: 'openai.com',
    tagline: 'ChatGPT Plus Student - 4 months free access to GPT-4o & Canvas',
    category: 'AI & DEV',
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
    partnerUrl: 'https://openai.com/edu',
  },
  {
    id: 'youtube_premium',
    name: 'YouTube Premium Student',
    brand: 'YouTube',
    domain: 'youtube.com',
    tagline: 'YouTube Premium & Music - 43% OFF ($7.99/mo)',
    category: 'MUSIC & STREAMING',
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
    partnerUrl: 'https://youtube.com/premium/student',
  },
  {
    id: 'aws_educate',
    name: 'AWS Educate',
    brand: 'Amazon Web Services',
    domain: 'aws.amazon.com',
    tagline: '$100 annual cloud compute & ML credits + certified training',
    category: 'CLOUD & INFRA',
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
    partnerUrl: 'https://aws.amazon.com/education/awseducate/',
  },
  {
    id: 'notion_education',
    name: 'Notion Education Plus',
    brand: 'Notion',
    domain: 'notion.so',
    tagline: 'Free Team Plus plan for students and educators',
    category: 'PRODUCTIVITY',
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
    partnerUrl: 'https://notion.so/students',
  },
  {
    id: 'github_student_pack',
    name: 'GitHub Student Developer Pack',
    brand: 'GitHub',
    domain: 'github.com',
    tagline: 'Free GitHub Pro, GitHub Copilot, and $200k+ developer tool suite',
    category: 'AI & DEV',
    regularPrice: '$10/mo',
    studentPrice: 'Free Pro ($0)',
    discountValue: '100% OFF',
    description:
      'The best developer tools, free for students. Includes GitHub Copilot, Codespaces, domain names, and cloud credits.',
    perks: [
      'Free GitHub Pro & Copilot AI',
      'Codespaces 180 core hours/mo',
      'Free .me domain from Namecheap',
      'Cloud compute vouchers',
    ],
    tags: ['Developer Tools', 'Copilot', 'Git', 'Open Source'],
    status: 'UNVERIFIED',
    brandGradient: 'from-slate-900 via-neutral-900 to-zinc-950',
    accentColor: 'neutral',
    logoIcon: 'code',
    partnerUrl: 'https://education.github.com/pack',
  },
  {
    id: 'figma_education',
    name: 'Figma Education Plan',
    brand: 'Figma',
    domain: 'figma.com',
    tagline: 'Free Figma & FigJam Professional for Students and Educators',
    category: 'PRODUCTIVITY',
    regularPrice: '$15/mo',
    studentPrice: 'Free Pro ($0)',
    discountValue: '100% OFF ($180/yr Value)',
    description:
      'Unlimited projects, unlimited version history, team component libraries, and collaborative design tools.',
    perks: [
      'Unlimited Figma & FigJam files',
      'Shared team component libraries',
      'Unlimited version history',
      'Dev Mode inspection suite',
    ],
    tags: ['Design', 'UI/UX', 'Collaboration', 'Prototyping'],
    status: 'UNVERIFIED',
    brandGradient: 'from-purple-950/60 via-slate-900 to-violet-950/40',
    accentColor: 'purple',
    logoIcon: 'figma',
    partnerUrl: 'https://figma.com/education',
  },
  {
    id: 'jetbrains_pack',
    name: 'JetBrains All Products Pack',
    brand: 'JetBrains',
    domain: 'jetbrains.com',
    tagline: 'Free access to IntelliJ IDEA Ultimate, PyCharm, WebStorm & all IDEs',
    category: 'AI & DEV',
    regularPrice: '$28.90/mo',
    studentPrice: 'Free ($0)',
    discountValue: '100% OFF ($289/yr Value)',
    description:
      'Complete developer toolbox including 15+ industry-leading professional IDEs and .NET developer tools.',
    perks: [
      'IntelliJ IDEA Ultimate & PyCharm Pro',
      'WebStorm, CLion, Rider, GoLand',
      'Full database & profiling tools',
      'JetBrains AI Assistant integration',
    ],
    tags: ['IDE', 'Python', 'Java', 'TypeScript'],
    status: 'UNVERIFIED',
    brandGradient: 'from-pink-950/60 via-slate-900 to-rose-950/40',
    accentColor: 'rose',
    logoIcon: 'code',
    partnerUrl: 'https://jetbrains.com/community/education',
  },
  {
    id: 'anthropic_claude',
    name: 'Anthropic Claude Pro',
    brand: 'Anthropic',
    domain: 'claude.ai',
    tagline: '50% OFF Claude 3.5 Sonnet & Claude Projects for Research',
    category: 'AI & DEV',
    regularPrice: '$20/mo',
    studentPrice: '$10/mo',
    discountValue: '50% OFF',
    description:
      '5x more usage of Claude 3.5 Sonnet, priority access during peak hours, and early access to new reasoning features.',
    perks: [
      '5x higher Claude 3.5 Sonnet limits',
      'Claude Artifacts & Projects workspace',
      'Large 200k context window',
      'Priority compute access',
    ],
    tags: ['AI', 'Sonnet', 'Research', 'Writing'],
    status: 'UNVERIFIED',
    brandGradient: 'from-orange-950/60 via-slate-900 to-amber-950/40',
    accentColor: 'orange',
    logoIcon: 'bot',
    partnerUrl: 'https://claude.ai',
  },
  {
    id: 'perplexity_pro',
    name: 'Perplexity Pro Student',
    brand: 'Perplexity AI',
    domain: 'perplexity.ai',
    tagline: '1 Year Free Perplexity Pro Search & Academic Research Suite',
    category: 'AI & DEV',
    regularPrice: '$20/mo',
    studentPrice: 'Free ($0)',
    discountValue: '$240 Value (100% OFF)',
    description:
      'Unlimited Pro Search queries, access to leading AI models (Claude 3.5, GPT-4o, Sonar), file upload analysis, and academic citations.',
    perks: [
      'Unlimited Pro Research Queries',
      'Model switching: Claude 3.5 & GPT-4o',
      'Academic citation search',
      'Unlimited PDF & data uploads',
    ],
    tags: ['Search', 'AI', 'Research', 'Citations'],
    status: 'UNVERIFIED',
    brandGradient: 'from-teal-950/60 via-slate-900 to-cyan-950/40',
    accentColor: 'teal',
    logoIcon: 'bot',
    partnerUrl: 'https://perplexity.ai',
  },
  {
    id: 'apple_music',
    name: 'Apple Music Student',
    brand: 'Apple',
    domain: 'apple.com',
    tagline: 'Apple Music + Free Apple TV+ Bundle for $5.99/mo',
    category: 'MUSIC & STREAMING',
    regularPrice: '$10.99/mo',
    studentPrice: '$5.99/mo + Apple TV+',
    discountValue: '45% OFF + Free Apple TV+',
    description:
      'Stream over 100 million songs in lossless spatial audio, plus complimentary subscription to Apple TV+ original shows.',
    perks: [
      '100M+ songs with Lossless Spatial Audio',
      'Free Apple TV+ subscription included',
      'Time-synced lyrics with sing mode',
      'Offline music library downloads',
    ],
    tags: ['Music', 'Apple TV+', 'Streaming', 'Spatial Audio'],
    status: 'UNVERIFIED',
    brandGradient: 'from-red-950/60 via-slate-900 to-rose-950/40',
    accentColor: 'red',
    logoIcon: 'music',
    partnerUrl: 'https://apple.com/apple-music',
  },
  {
    id: 'digitalocean_hatch',
    name: 'DigitalOcean Student',
    brand: 'DigitalOcean',
    domain: 'digitalocean.com',
    tagline: '$200 1-Year Cloud Compute & Kubernetes Credits',
    category: 'CLOUD & INFRA',
    regularPrice: '$200/yr',
    studentPrice: '$200 Free Credits',
    discountValue: '$200 Free Credits',
    description:
      'Deploy scalable virtual machines (Droplets), managed databases, serverless functions, and containerized clusters.',
    perks: [
      '$200 free cloud compute credits',
      'Deploy Droplets & Managed Databases',
      'App Platform serverless hosting',
      '1-Click open-source app deploys',
    ],
    tags: ['Cloud', 'Compute', 'VPS', 'Databases'],
    status: 'UNVERIFIED',
    brandGradient: 'from-blue-950/60 via-slate-900 to-sky-950/40',
    accentColor: 'sky',
    logoIcon: 'cloud',
    partnerUrl: 'https://digitalocean.com',
  },
  {
    id: 'canva_student',
    name: 'Canva for Students',
    brand: 'Canva',
    domain: 'canva.com',
    tagline: 'Free Canva Pro visual suite with Magic AI & premium assets',
    category: 'PRODUCTIVITY',
    regularPrice: '$12.99/mo',
    studentPrice: 'Free ($0)',
    discountValue: '100% OFF ($155/yr)',
    description:
      '100+ million stock photos, videos, audio tracks, fonts, background remover, and Magic Studio AI tools.',
    perks: [
      '100M+ premium stock templates & photos',
      'Magic Studio AI generative design',
      '1-Click background remover & resize',
      '1TB cloud storage for projects',
    ],
    tags: ['Design', 'Presentations', 'Graphics', 'Video'],
    status: 'UNVERIFIED',
    brandGradient: 'from-cyan-950/60 via-slate-900 to-blue-950/40',
    accentColor: 'cyan',
    logoIcon: 'sparkles',
    partnerUrl: 'https://canva.com/education',
  },
  {
    id: 'linear_education',
    name: 'Linear for Students',
    brand: 'Linear',
    domain: 'linear.app',
    tagline: 'Free Linear Standard plan for student project teams & hackathons',
    category: 'PRODUCTIVITY',
    regularPrice: '$8/mo',
    studentPrice: 'Free ($0)',
    discountValue: '100% OFF',
    description:
      'High-speed issue tracking, sprint cycles, product roadmaps, and Git integrations for software development teams.',
    perks: [
      'Unlimited team members & issues',
      'Real-time sprint & roadmap planning',
      'GitHub & GitLab PR synchronizations',
      'Keyboard-first lightning UX',
    ],
    tags: ['Productivity', 'Issues', 'Sprint', 'Roadmaps'],
    status: 'UNVERIFIED',
    brandGradient: 'from-indigo-950/60 via-slate-900 to-slate-900',
    accentColor: 'indigo',
    logoIcon: 'file-text',
    partnerUrl: 'https://linear.app',
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
