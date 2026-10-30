// Sanity checks run via `npm test` (tsx). Grows as the generator does.
import { contrast } from '../src/lib/color'
console.log('contrast black/white', contrast('#000000', '#ffffff').toFixed(1))
