import { describe, it, expect } from 'vitest';
import { searchSchools, getSchoolById, ACCREDITED_UNIVERSITIES } from './schoolSearch';

describe('School Search Service', () => {
  it('should list preloaded accredited universities including Stanford, Harvard, Berkeley, and MIT', () => {
    expect(ACCREDITED_UNIVERSITIES.length).toBeGreaterThanOrEqual(4);
    const names = ACCREDITED_UNIVERSITIES.map((u) => u.name);
    expect(names).toContain('Massachusetts Institute of Technology');
    expect(names).toContain('Stanford University');
    expect(names).toContain('Harvard University');
    expect(names).toContain('University of California, Berkeley');
  });

  it('should find universities by exact name match', () => {
    const results = searchSchools('Stanford University');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].id).toBe('sch_stanford_002');
    expect(results[0].name).toBe('Stanford University');
    expect(results[0].domain).toBe('stanford.edu');
  });

  it('should find universities by alias (e.g., "MIT", "Cal", "UC Berkeley")', () => {
    const mitResults = searchSchools('MIT');
    expect(mitResults.length).toBeGreaterThan(0);
    expect(mitResults[0].id).toBe('sch_mit_001');
    expect(mitResults[0].instantMatchEligible).toBe(true);

    const berkeleyResults = searchSchools('UC Berkeley');
    expect(berkeleyResults.length).toBeGreaterThan(0);
    expect(berkeleyResults[0].id).toBe('sch_berkeley_004');
  });

  it('should find universities by domain (e.g., "harvard.edu")', () => {
    const results = searchSchools('harvard.edu');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].id).toBe('sch_harvard_003');
  });

  it('should perform case-insensitive partial match search', () => {
    const results = searchSchools('massachusetts');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].id).toBe('sch_mit_001');
  });

  it('should respect the search result limit option', () => {
    const results = searchSchools('university', { limit: 2 });
    expect(results.length).toBeLessThanOrEqual(2);
  });

  it('should return empty array for non-matching queries', () => {
    const results = searchSchools('nonexistent_university_xyz_123');
    expect(results).toEqual([]);
  });

  it('should retrieve a school by its unique institution ID', () => {
    const school = getSchoolById('sch_mit_001');
    expect(school).toBeDefined();
    expect(school?.name).toBe('Massachusetts Institute of Technology');
    expect(school?.instantMatchEligible).toBe(true);
  });

  it('should return undefined for an unknown school ID', () => {
    const school = getSchoolById('sch_unknown');
    expect(school).toBeUndefined();
  });
});
