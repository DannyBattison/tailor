import type { HeadingCase, Signature } from '../types'
import type { Strategy } from './palette'

export interface MoodProfile {
  strategies: [Strategy, number][]
  hues: [number, number][]
  radius: number[]
  border: number[]
  shadow: ('none' | 'soft' | 'hard')[]
  density: [number, number]
  scale: [number, number]
  cases: HeadingCase[]
  tracking: [number, number]
  signatures: Signature[]
}

export const MOODS: Record<string, MoodProfile> = {
  calm: { strategies: [['tonal', 3], ['paper', 3], ['earth', 2]], hues: [[130, 230], [20, 60]], radius: [8, 14, 24], border: [0, 1], shadow: ['soft', 'none'], density: [1.05, 1.3], scale: [1.2, 1.28], cases: ['none'], tracking: [-0.02, 0], signatures: ['grain', 'inverted', 'ruled'] },
  bold: { strategies: [['pop', 4], ['complement', 3], ['dark', 2]], hues: [[0, 60], [90, 200]], radius: [0, 4, 999], border: [2, 3], shadow: ['hard', 'none'], density: [0.9, 1.1], scale: [1.4, 1.618], cases: ['uppercase', 'none'], tracking: [-0.04, 0.01], signatures: ['oversized', 'hardShadow', 'marquee', 'tilted'] },
  playful: { strategies: [['pop', 4], ['complement', 3], ['tonal', 1]], hues: [[0, 70], [100, 200]], radius: [14, 24, 999], border: [2, 3], shadow: ['hard', 'soft'], density: [1, 1.2], scale: [1.3, 1.5], cases: ['none', 'lowercase'], tracking: [-0.03, 0.01], signatures: ['tilted', 'hardShadow', 'marquee'] },
  editorial: { strategies: [['paper', 4], ['tonal', 2], ['earth', 2]], hues: [[0, 50], [80, 180]], radius: [0, 2, 4], border: [1, 2], shadow: ['none'], density: [1, 1.25], scale: [1.33, 1.5], cases: ['none'], tracking: [-0.025, 0], signatures: ['ruled', 'oversized', 'inverted', 'grain'] },
  technical: { strategies: [['dark', 4], ['paper', 2], ['complement', 2]], hues: [[130, 215], [20, 50]], radius: [0, 2, 6], border: [1, 2], shadow: ['none', 'hard'], density: [0.8, 1], scale: [1.2, 1.3], cases: ['none', 'uppercase'], tracking: [-0.01, 0.04], signatures: ['ruled', 'marquee', 'hardShadow'] },
  warm: { strategies: [['earth', 4], ['paper', 3], ['tonal', 2]], hues: [[10, 70]], radius: [8, 14, 24], border: [0, 1, 2], shadow: ['soft', 'none'], density: [1.05, 1.3], scale: [1.25, 1.4], cases: ['none'], tracking: [-0.025, 0], signatures: ['grain', 'tilted', 'inverted'] },
  luxe: { strategies: [['dark', 4], ['paper', 3]], hues: [[20, 80], [140, 180]], radius: [0, 2], border: [0, 1], shadow: ['none'], density: [1.15, 1.3], scale: [1.4, 1.618], cases: ['none', 'uppercase'], tracking: [0, 0.06], signatures: ['ruled', 'grain', 'oversized'] },
  brutal: { strategies: [['pop', 4], ['paper', 3], ['complement', 2]], hues: [[0, 110], [150, 200]], radius: [0], border: [3], shadow: ['hard', 'none'], density: [0.8, 1], scale: [1.4, 1.618], cases: ['uppercase'], tracking: [-0.05, 0], signatures: ['hardShadow', 'ruled', 'marquee', 'oversized'] },
  organic: { strategies: [['earth', 4], ['tonal', 3]], hues: [[85, 170]], radius: [14, 24, 999], border: [0, 1], shadow: ['soft', 'none'], density: [1.1, 1.3], scale: [1.25, 1.4], cases: ['none', 'lowercase'], tracking: [-0.02, 0.01], signatures: ['grain', 'inverted', 'tilted'] },
  retro: { strategies: [['pop', 3], ['earth', 3], ['paper', 2]], hues: [[10, 90], [160, 200]], radius: [0, 4, 14], border: [2, 3], shadow: ['hard'], density: [0.95, 1.15], scale: [1.3, 1.5], cases: ['uppercase', 'none'], tracking: [-0.01, 0.03], signatures: ['hardShadow', 'grain', 'tilted', 'marquee'] },
}

export const MOOD_NAMES = Object.keys(MOODS)
