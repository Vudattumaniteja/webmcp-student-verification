export type MerchantVerificationStatus =
  | 'UNVERIFIED'
  | 'VERIFYING'
  | 'APPROVED'
  | 'ERROR'
  | 'ACTION_NEEDED';

export type MerchantCategory =
  | 'All'
  | 'AI & Research'
  | 'Music & Audio'
  | 'Cloud & DevOps'
  | 'Productivity'
  | 'Streaming';

export interface MerchantPerk {
  id: string;
  name: string;
  brand: string;
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
  brandGradient: string;
  accentColor: string;
  logoIcon: 'bot' | 'music' | 'cloud' | 'file-text' | 'play';
  partnerUrl?: string;
  updatedAt?: string;
}

export interface MerchantStoreState {
  merchants: MerchantPerk[];
  selectedCategory: string;
}
