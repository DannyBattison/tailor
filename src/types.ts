export type NodeType =
  | 'page' | 'section' | 'box' | 'heading' | 'text' | 'button' | 'image' | 'nav'
  | 'tag' | 'stat' | 'table' | 'list' | 'divider' | 'input' | 'marquee' | 'quote'

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

export type ShadowKind = 'none' | 'soft' | 'hard'
export type Signature = 'hardShadow' | 'oversized' | 'ruled' | 'grain' | 'tilted' | 'inverted' | 'marquee'
export type HeadingCase = 'none' | 'uppercase' | 'lowercase'

export interface FontPair {
  id: string
  name: string
  display: string
  body: string
  mono?: string
  /** google fonts css2 `family=` fragments */
  gf: string[]
  tags: string[]
  displayWeight: number
  displayFallback: 'serif' | 'sans-serif'
  bodyFallback: 'serif' | 'sans-serif'
  caps?: boolean // happy being uppercase
}

export interface Tokens {
  palette: Palette
  paletteStrategy: string
  hue: number
  fontId: string
  radius: number
  border: number
  shadow: ShadowKind
  density: number
  scale: number
  headingCase: HeadingCase
  tracking: number
  signature: Signature
}

export type Kind = 'marketing' | 'app'

export interface Meta {
  seed: number
  kind: Kind
  mood: string
  archetype: string
  layoutSeed: number
  siteKind: string
  brief: string
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
}
