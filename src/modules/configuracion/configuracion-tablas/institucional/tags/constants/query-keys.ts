export const tagsKeys = {
  all: ['tags'] as const,
  byFacility: (facilityId: string) => ['tags', facilityId] as const,
};
