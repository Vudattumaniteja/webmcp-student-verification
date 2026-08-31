export interface School {
  id: string;
  name: string;
  domain: string;
  country: string;
  aliases: string[];
  instantMatchEligible: boolean;
}

export const ACCREDITED_UNIVERSITIES: School[] = [
  {
    id: 'sch_mit_001',
    name: 'Massachusetts Institute of Technology',
    domain: 'mit.edu',
    country: 'USA',
    aliases: ['MIT', 'Mass Tech'],
    instantMatchEligible: true,
  },
  {
    id: 'sch_stanford_002',
    name: 'Stanford University',
    domain: 'stanford.edu',
    country: 'USA',
    aliases: ['Stanford'],
    instantMatchEligible: false,
  },
  {
    id: 'sch_harvard_003',
    name: 'Harvard University',
    domain: 'harvard.edu',
    country: 'USA',
    aliases: ['Harvard'],
    instantMatchEligible: false,
  },
  {
    id: 'sch_berkeley_004',
    name: 'University of California, Berkeley',
    domain: 'berkeley.edu',
    country: 'USA',
    aliases: ['UC Berkeley', 'Cal', 'Berkeley'],
    instantMatchEligible: false,
  },
  {
    id: 'sch_cmu_005',
    name: 'Carnegie Mellon University',
    domain: 'cmu.edu',
    country: 'USA',
    aliases: ['CMU', 'Carnegie Mellon'],
    instantMatchEligible: false,
  },
  {
    id: 'sch_uw_006',
    name: 'University of Washington',
    domain: 'uw.edu',
    country: 'USA',
    aliases: ['UW', 'U-Dub', 'Washington'],
    instantMatchEligible: false,
  },
  {
    id: 'sch_nyu_007',
    name: 'New York University',
    domain: 'nyu.edu',
    country: 'USA',
    aliases: ['NYU'],
    instantMatchEligible: false,
  },
  {
    id: 'sch_oxford_008',
    name: 'University of Oxford',
    domain: 'ox.ac.uk',
    country: 'UK',
    aliases: ['Oxford'],
    instantMatchEligible: false,
  },
  {
    id: 'sch_cambridge_009',
    name: 'University of Cambridge',
    domain: 'cam.ac.uk',
    country: 'UK',
    aliases: ['Cambridge'],
    instantMatchEligible: false,
  },
  {
    id: 'sch_columbia_010',
    name: 'Columbia University',
    domain: 'columbia.edu',
    country: 'USA',
    aliases: ['Columbia'],
    instantMatchEligible: false,
  },
];

export interface SearchSchoolOptions {
  limit?: number;
}

export function searchSchools(query: string, options: SearchSchoolOptions = {}): School[] {
  const normalizedQuery = (query || '').trim().toLowerCase();
  if (!normalizedQuery) {
    return [];
  }

  const limit = options.limit && options.limit > 0 ? options.limit : 5;

  const matches = ACCREDITED_UNIVERSITIES.filter((school) => {
    if (school.id.toLowerCase().includes(normalizedQuery)) return true;
    if (school.name.toLowerCase().includes(normalizedQuery)) return true;
    if (school.domain.toLowerCase().includes(normalizedQuery)) return true;
    if (school.aliases.some((alias) => alias.toLowerCase().includes(normalizedQuery))) return true;
    return false;
  });

  return matches.slice(0, limit);
}

export function getSchoolById(schoolId: string): School | undefined {
  return ACCREDITED_UNIVERSITIES.find((school) => school.id === schoolId);
}
