export type MerchantVerificationStatus =
  | 'UNVERIFIED'
  | 'VERIFYING'
  | 'APPROVED'
  | 'ERROR'
  | 'ACTION_NEEDED';

export type MerchantCategory =
  | 'All'
  | 'AI & DEV'
  | 'MUSIC & STREAMING'
  | 'CLOUD & INFRA'
  | 'PRODUCTIVITY'
  | 'AI & Research'
  | 'Music & Audio'
  | 'Cloud & DevOps'
  | 'Streaming';

export interface MerchantPerk {
  id: string;
  name: string;
  brand: string;
  domain: string;
  tagline: string;
  category: string;
  regularPrice: string;
  studentPrice: string;
  discountValue: string;
  description: string;
  perks: string[];
  tags: string[];
  status: MerchantVerificationStatus;
  rewardCode?: string;
  errorMessage?: string;
  brandGradient?: string;
  accentColor?: string;
  logoIcon?: 'bot' | 'music' | 'cloud' | 'file-text' | 'play' | 'code' | 'figma' | 'sparkles' | 'globe' | string;
  partnerUrl?: string;
  updatedAt?: string;
}

export interface MerchantStoreState {
  merchants: MerchantPerk[];
  selectedCategory: string;
}

