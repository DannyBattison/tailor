// A three-word handle for a design code ("quiet-copper-harbor"): easy to say and remember, but only a label.
// A code carries far more than 3 words can (about 180 bits), so the words are a hash of it and can't be loaded back.
import { hashStr } from '../lib/rng'

const A = 'amber brisk calm clever cosy crisp dusty eager faint fond gentle glad hazy idle jolly keen kind lazy lucid mellow merry mild misty modest neat noble plain proud quick quiet rapid rosy rustic sandy shy silent silver sleek slow snug soft spry steady still sunny swift tidy tiny vivid warm wild wise witty young zesty bold bright brave breezy fresh golden humble lively lofty'.split(' ')
const B = 'copper coral cobalt indigo olive ochre plum rust sage slate teal umber violet linen cedar birch maple willow pine moss fern ivory ebony jade onyx opal pearl ruby saffron sienna topaz walnut denim flint ember dawn dusk frost gale haze mist rain snow storm tide wave cloud meadow orchard prairie canyon glacier lagoon reef summit valley'.split(' ')
const C = 'harbor lantern compass anchor arbor bridge cabin canoe castle chapel cliff cove creek dune fable garden grove hearth island kettle ladder lodge market mill orchard paddle pier pond quarry ridge river sail shore spire stable studio tavern tower trail trellis tunnel vessel village wharf window workshop atlas almanac beacon bell bench bloom brook cairn cottage harvest haven journal loft mosaic'.split(' ')

export function wordsFor(code: string): string {
  const h = hashStr(code), g = hashStr(code + '/b'), k = hashStr(code + '/c')
  return [A[h % A.length], B[g % B.length], C[k % C.length]].join('-')
}
