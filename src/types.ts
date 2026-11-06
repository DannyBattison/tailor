export type NodeType =
  | 'page' | 'section' | 'box' | 'heading' | 'text' | 'button' | 'image' | 'nav'
  | 'tag' | 'stat' | 'table' | 'list' | 'divider' | 'input' | 'marquee' | 'quote' | 'logos' | 'faq'

export type Props = Record<string, any>

export interface DNode {
  id: string
  type: NodeType
  props: Props
  children: DNode[]
}

export interface Palette {
  bg: string
  surface: string
  ink: string
  muted: string
  line: string
  accent: string
  accent2: string
  onAccent: string
  accentText: string
  inverse: string
  onInverse: string
}

export interface PaletteSpec {
  bg: { l: number; c: number; h: number }
  surfaceShift: number
  ink: { l: number; c: number; h: number }
  accent: { l: number; c: number; h: number }
  accent2: { l: number; c: number; h: number }
  dark: boolean
}

export type ShadowKind = 'none' | 'soft' | 'hard'
export type Signature = 'hardShadow' | 'oversized' | 'ruled' | 'grain' | 'tilted' | 'inverted' | 'marquee'
export type Motion = 'smooth' | 'snappy' | 'springy'
export type HeadingCase = 'none' | 'uppercase' | 'lowercase'

export type FontCat = 'serif' | 'sans' | 'display' | 'script' | 'mono'
export interface HeadingFace { family: string; cat: FontCat; weight: number }
export interface BodyFace { family: string; cat: FontCat; weights: number[] }
/** Exactly two Google fonts: one for headings, one for everything else. */
export interface FontSpec { heading: HeadingFace; body: BodyFace }

export interface Tokens {
  palette: Palette
  paletteStrategy: string
  /** the palette's full-strength colour intent; bgBold blends the background between quiet and this */
  spec?: PaletteSpec
  /** 0 = near-neutral paper (or near-black), 1 = the strategy's full background colour */
  bgBold?: number
  /** explicit light/dark choice; absent = whatever the palette naturally is */
  mode?: 'light' | 'dark'
  hue: number
  fonts?: FontSpec
  /** designs saved before free-form fonts: id of a curated pair */
  fontId?: string
  radius: number
  border: number
  shadow: ShadowKind
  density: number
  scale: number
  headingCase: HeadingCase
  tracking: number
  signature: Signature
  /** how hovers, reveals and backdrops move; absent = smooth */
  motion?: Motion
}

export type Kind = 'marketing' | 'app'

/** Independent 5-digit seeds, one per re-rollable part. */
export interface PartSeeds {
  palette: number
  fonts: number
  shape: number
  layout: number
  text: number
  backdrops: number
}

export interface Meta {
  seed: number
  kind: Kind
  mood: string
  archetype: string
  layoutSeed: number
  contentSeed?: number
  parts?: PartSeeds
  /** changed by hand since generation (tree edits, sliders, swatches): the design code no longer recreates it exactly */
  edited?: boolean
  name: string
}

export interface Doc {
  root: DNode
  tokens: Tokens
  meta: Meta
}

export interface Locks {
  palette: boolean
  fonts: boolean
  shape: boolean
  layout: boolean
  copy: boolean
}
