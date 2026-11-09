export const ART_KINDS = ['blocks', 'stripes', 'arches', 'dots', 'waves', 'sun', 'rings'] as const
export type ArtKind = (typeof ART_KINDS)[number]
