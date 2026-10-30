// Content bank: specific, non-generic copy per kind. No emoji, no "unlock the power of".
export interface MarketingContent {
  id: string
  name: string
  nav: string[]
  cta: string
  ctaAlt: string
  eyebrow: string
  headline: string
  short: string
  sub: string
  features: { title: string; body: string }[]
  stats: { value: string; label: string }[]
  quotes: { text: string; who: string }[]
  index: string[]
  tableCols: string[]
  tableRows: string[]
  marquee: string[]
  tags: string[]
  closing: string
  closingSub: string
  footer: string
  art: ('blocks' | 'stripes' | 'arches' | 'dots' | 'waves' | 'sun' | 'rings')[]
}

export interface AppContent {
  id: string
  name: string
  nav: string[]
  user: string
  title: string
  sub: string
  primary: string
  kpis: { value: string; label: string }[]
  tableCols: string[]
  tableRows: string[]
  side: string[]
  columns: { title: string; cards: { title: string; tag: string; meta: string }[] }[]
  threads: { from: string; subject: string; preview: string; time: string }[]
  settings: { group: string; fields: { label: string; kind: 'text' | 'select' | 'toggle' | 'textarea'; value?: string; on?: boolean }[] }[]
}

export const MARKETING: MarketingContent[] = [
  {
    id: 'cafe', name: 'Tidewater Roasters',
    nav: ['Beans', 'Subscriptions', 'Our farms', 'Visit'], cta: 'Order a bag', ctaAlt: 'Read the roast notes',
    eyebrow: 'Small-batch roasting, Hobart', headline: 'Coffee roasted on Tuesdays, at your door by Thursday.',
    short: 'Roasted this week.', sub: 'We buy from nine farms we have visited, roast 12 kilos at a time on a 1974 drum roaster, and post it before it can go stale.',
    features: [
      { title: 'Roasted to order', body: 'Nothing sits on a shelf. Your bag is roasted the day the order closes.' },
      { title: 'Farms with names', body: 'Every bag lists the farmer, the altitude, and what we paid per kilo.' },
      { title: 'Pause any time', body: 'Skip a fortnight, swap origins, or cancel from a link in the box.' },
      { title: 'Filter and espresso', body: 'The same coffee, profiled twice. Pick the bag that matches your machine.' },
      { title: 'Compostable packing', body: 'Paper bags, cardboard tape, and a valve you can pull off and bin.' },
      { title: 'Cupping Saturdays', body: 'Come to the roastery, taste six coffees blind, argue about them with us.' },
    ],
    stats: [{ value: '12 kg', label: 'per batch, never more' }, { value: '48 h', label: 'roast to doorstep' }, { value: '9', label: 'farms we have visited' }, { value: '1974', label: 'year our roaster was built' }],
    quotes: [
      { text: 'The Huila tastes like blackcurrant jam and I have stopped buying anything else.', who: 'Marit, subscriber since 2022' },
      { text: 'They emailed me to say my grinder was too coarse. That is customer service.', who: 'Dev, Launceston' },
      { text: 'Finally, a bag that tells me the roast date in plain numbers.', who: 'Ines, café owner' },
    ],
    index: ['Huila Washed|Colombia · 1,800 m', 'Sidamo Natural|Ethiopia · 2,100 m', 'Kirinyaga AA|Kenya · 1,700 m', 'Cerrado Pulp|Brazil · 1,100 m', 'Tarrazú Honey|Costa Rica · 1,600 m', 'Gayo Wet-hulled|Sumatra · 1,400 m', 'Nariño Washed|Colombia · 2,000 m', 'Decaf Sugarcane|Colombia · 1,750 m'],
    tableCols: ['Bag', 'Size', 'Roast', 'Price'], tableRows: ['Huila Washed|250 g|Medium|$19', 'Sidamo Natural|250 g|Light|$22', 'Cerrado Pulp|1 kg|Dark|$54', 'House Espresso|1 kg|Medium|$49'],
    marquee: ['Roasted Tuesday', 'Posted Wednesday', 'Brewed Thursday', 'Traceable to the farm'], tags: ['New harvest', 'Limited', 'Roasted Tuesday', 'Single origin'],
    closing: 'Next roast closes Monday at noon.', closingSub: 'Order by then and it is on the drum Tuesday morning.', footer: '14 Salamanca Row, Hobart · roast@tidewater.example',
    art: ['sun', 'arches', 'rings', 'waves'],
  },
  {
    id: 'studio', name: 'Halden & Rowe',
    nav: ['Work', 'Studio', 'Journal', 'Contact'], cta: 'Start a conversation', ctaAlt: 'See selected work',
    eyebrow: 'Architecture and interiors, since 2009', headline: 'Houses that get better at being lived in.',
    short: 'Built slowly.', sub: 'A twelve-person practice designing homes, small public buildings and the occasional bakery. We draw by hand first and argue about window seats later.',
    features: [
      { title: 'Drawn before modelled', body: 'Every project starts as pencil on trace. The computer comes after we agree what the room is for.' },
      { title: 'Local timber', body: 'We specify within 200 km wherever the structure allows, and name the mill in the drawings.' },
      { title: 'Site visits, weekly', body: 'Someone from the studio is on site every week. Not a project manager: an architect.' },
      { title: 'Fixed-fee feasibility', body: 'A four-week study with a price, a plan and an honest list of what could go wrong.' },
      { title: 'Post-occupancy visits', body: 'We return after a year to see what you actually do with the space.' },
      { title: 'Small by choice', body: 'We take six commissions a year so the same people see each one through.' },
    ],
    stats: [{ value: '63', label: 'buildings completed' }, { value: '6', label: 'commissions per year' }, { value: '200 km', label: 'timber sourcing radius' }, { value: '14 yrs', label: 'average client relationship' }],
    quotes: [
      { text: 'They talked us out of the extension we asked for and into the one we needed.', who: 'The Okafor family, Ridge House' },
      { text: 'Nobody else visited the site in the rain. They did, with a flask.', who: 'Pieter, builder' },
      { text: 'Every drawer closes the way you hoped it would.', who: 'Lucía Marín, Studio Bakery' },
    ],
    index: ['Ridge House|Residential · 2023', 'Mill Lane Library|Public · 2022', 'Two Sheds|Residential · 2021', 'Bakery on Quay Street|Commercial · 2021', 'Fennel Cottage|Renovation · 2020', 'Orchard Pavilion|Public · 2019', 'North Rooms|Residential · 2018', 'Harbour Steps|Landscape · 2017'],
    tableCols: ['Project', 'Type', 'Area', 'Year'], tableRows: ['Ridge House|Residential|212 m²|2023', 'Mill Lane Library|Public|480 m²|2022', 'Two Sheds|Residential|96 m²|2021', 'Orchard Pavilion|Public|60 m²|2019'],
    marquee: ['Residential', 'Public buildings', 'Interiors', 'Feasibility', 'Renovation'], tags: ['2023', 'Residential', 'Shortlisted', 'Timber'],
    closing: 'We have room for two commissions next spring.', closingSub: 'Write a paragraph about the place and the people. We reply within a week.', footer: 'Halden & Rowe Architects · 3 Tannery Yard · studio@haldenrowe.example',
    art: ['blocks', 'arches', 'stripes', 'sun'],
  },
  {
    id: 'devtool', name: 'Plumbline',
    nav: ['Docs', 'Changelog', 'Pricing', 'Status'], cta: 'Read the quickstart', ctaAlt: 'View on GitHub',
    eyebrow: 'Schema migrations for Postgres', headline: 'Migrate production without the held breath.',
    short: 'Ship the column.', sub: 'Plumbline plans every migration against a copy of your real schema, shows the locks it will take, and refuses to run what it cannot prove is safe.',
    features: [
      { title: 'Lock budget', body: 'Declare how long a table may be locked. Plumbline fails the plan in CI if a step exceeds it.' },
      { title: 'Shadow rehearsal', body: 'Replays the migration on a sampled copy of production and reports row counts and timings.' },
      { title: 'Reversible by default', body: 'Each step generates its inverse. Rollback is a command, not a meeting.' },
      { title: 'One binary', body: 'No agent, no sidecar. A static binary and a connection string.' },
      { title: 'Readable plans', body: 'Plans are plain text, reviewed in pull requests like any other change.' },
      { title: 'Honest about limits', body: 'When a change cannot be made online, it says so and proposes a two-phase route.' },
    ],
    stats: [{ value: '38 ms', label: 'median lock held' }, { value: '2.1 B', label: 'rows migrated in the wild' }, { value: '0', label: 'agents to install' }, { value: '11 MB', label: 'binary size' }],
    quotes: [
      { text: 'We dropped a NOT NULL on a 400M-row table at lunchtime. Nobody noticed.', who: 'Priya Nair, platform lead' },
      { text: 'The lock budget alone paid for the afternoon we spent adopting it.', who: 'Tomasz, SRE' },
      { text: 'It told me no. Politely, with a better plan attached.', who: 'Aoife, backend engineer' },
    ],
    index: ['plumbline plan|Show locks and timings', 'plumbline rehearse|Replay on a sampled copy', 'plumbline apply|Run, with a budget', 'plumbline revert|Undo the last step', 'plumbline lint|Flag unsafe statements', 'plumbline diff|Compare two schemas', 'plumbline baseline|Adopt an existing database', 'plumbline doctor|Check connections and roles'],
    tableCols: ['Plan', 'Statement', 'Lock', 'Time'], tableRows: ['001|ADD COLUMN plan_id|none|4 ms', '002|CREATE INDEX CONCURRENTLY|share|2m 14s', '003|BACKFILL plan_id (batched)|none|18m', '004|SET NOT NULL|access excl.|38 ms'],
    marquee: ['No agents', 'No downtime', 'Reversible', 'Reviewed in pull requests'], tags: ['v2.4', 'Postgres 13–17', 'Open source', 'Static binary'],
    closing: 'Run your next migration with a budget.', closingSub: 'brew install plumbline, point it at a staging database, read the plan.', footer: 'Plumbline is MIT licensed · status.plumbline.example',
    art: ['stripes', 'blocks', 'dots', 'rings'],
  },
  {
    id: 'shop', name: 'Kiln & Kettle',
    nav: ['Mugs', 'Plates', 'Seconds', 'About'], cta: 'Browse this week\'s firing', ctaAlt: 'How we make them',
    eyebrow: 'Wheel-thrown ceramics from Leeds', headline: 'Mugs with a thumb rest, thrown by one pair of hands.',
    short: 'Thrown, not cast.', sub: 'Forty pieces come out of the kiln every Friday. Each is signed on the foot, photographed in daylight, and gone by Sunday.',
    features: [
      { title: 'Every piece unique', body: 'Glaze runs differently every firing. You see the exact mug you are buying.' },
      { title: 'Dishwasher safe, really', body: 'Fired to cone 6 and tested through two hundred cycles in our own kitchen.' },
      { title: 'Seconds shelf', body: 'Slight wobble, pinhole, a glaze kiss. Half price and just as good for tea.' },
      { title: 'Repair, don\'t replace', body: 'Chip a rim and post it back. We grind it smooth for the cost of postage.' },
      { title: 'Packed in newsprint', body: 'Wrapped in local newspaper and shredded paper. No plastic, no peanuts.' },
      { title: 'Restocks on Fridays', body: 'Sign up for the list and we email at 10am, forty minutes before the shop opens.' },
    ],
    stats: [{ value: '40', label: 'pieces per firing' }, { value: '1,240°C', label: 'peak kiln temperature' }, { value: '200', label: 'dishwasher cycles tested' }, { value: '0', label: 'plastic in the parcel' }],
    quotes: [
      { text: 'My daughter calls hers "the good cup" and will not share it.', who: 'Hannah, Sheffield' },
      { text: 'I dropped it on tile and it chipped. They fixed it for £3.', who: 'Marcus' },
      { text: 'The glaze looks different at every hour of the day.', who: 'Yuki, collector' },
    ],
    index: ['Thumb-rest mug|£28', 'Wide breakfast bowl|£34', 'Dinner plate, speckled|£32', 'Milk jug|£26', 'Small tea cup|£18', 'Salt pig|£22', 'Egg cup, pair|£16', 'Seconds: assorted|£12'],
    tableCols: ['Piece', 'Glaze', 'Volume', 'Price'], tableRows: ['Thumb-rest mug|Oatmeal|320 ml|£28', 'Wide bowl|Moss|700 ml|£34', 'Milk jug|Tenmoku|250 ml|£26', 'Tea cup|Ash|120 ml|£18'],
    marquee: ['Fired Friday', 'Gone by Sunday', 'Signed on the foot', 'Seconds shelf'], tags: ['Friday firing', 'Last one', 'Seconds', 'Oatmeal glaze'],
    closing: 'The next firing opens Friday at ten.', closingSub: 'Join the list and we will email forty minutes before.', footer: 'Kiln & Kettle · Unit 4, Kirkstall Forge, Leeds',
    art: ['rings', 'arches', 'dots', 'sun'],
  },
  {
    id: 'community', name: 'Lowfield Seed Library',
    nav: ['Borrow', 'Return', 'Volunteer', 'Events'], cta: 'Join the library', ctaAlt: 'See what\'s in the drawers',
    eyebrow: 'Free to borrow, free to keep going', headline: 'Borrow seeds. Grow them out. Bring some back.',
    short: 'Take. Grow. Return.', sub: 'A card catalogue of 612 varieties, kept in an old post-office cabinet on Marsh Road. Local, open-pollinated, and mostly very good at surviving us.',
    features: [
      { title: 'No card needed', body: 'Take up to five packets. We trust you, and the beans trust you more.' },
      { title: 'Grown for here', body: 'Every variety has been saved for at least three seasons in our wet, windy soil.' },
      { title: 'Saving workshops', body: 'First Sunday of the month: how to dry, label and store without a freezer.' },
      { title: 'Swap table', body: 'Bring cuttings, bulbs, jars of your own saved seed. Leave with someone else\'s.' },
      { title: 'Kids\' drawer', body: 'Sunflowers, radishes, and nasturtiums. Fast, forgiving and a little bit ridiculous.' },
      { title: 'Run by neighbours', body: '41 volunteers, one spreadsheet, and a kettle that has seen things.' },
    ],
    stats: [{ value: '612', label: 'varieties in the drawers' }, { value: '41', label: 'volunteers' }, { value: '3,900', label: 'packets borrowed last year' }, { value: '£0', label: 'to join' }],
    quotes: [
      { text: 'I returned a jar of purple carrot seed and felt more proud than I should.', who: 'Bea, allotment 14' },
      { text: 'My nan\'s runner bean is in the drawer. I did not tell anyone I put it there.', who: 'Rafi' },
      { text: 'The tomatoes taste like something again.', who: 'Colm, Marsh Road' },
    ],
    index: ['Borlotti, Lowfield strain|Bean · easy', 'Crimson-flowered broad bean|Bean · easy', 'Purple Haze carrot|Root · medium', 'Black Krim tomato|Fruit · medium', 'Sorrel, broad-leaved|Herb · easy', 'Painted Lady sweet pea|Flower · easy', 'Winter purslane|Salad · easy', 'Red Russian kale|Leaf · easy'],
    tableCols: ['Date', 'Event', 'Where', 'Cost'], tableRows: ['Sun 3 Mar|Seed saving basics|Post office|Free', 'Sat 16 Mar|Swap table|Marsh Road hall|Free', 'Sun 7 Apr|Tomato sowing|Greenhouse 2|£3', 'Sat 20 Apr|Bean day|Allotments|Free'],
    marquee: ['Take five packets', 'Open-pollinated', 'Bring some back', 'Grown on Marsh Road'], tags: ['Easy', 'Local strain', 'Saved 2024', 'Kids'],
    closing: 'Sowing starts the first weekend of March.', closingSub: 'Drop in on Saturday morning, or email us to volunteer for a shift.', footer: 'Lowfield Seed Library · Marsh Road Post Office · hello@lowfieldseeds.example',
    art: ['dots', 'waves', 'arches', 'sun'],
  },
  {
    id: 'event', name: 'Low Tide Festival',
    nav: ['Lineup', 'Tickets', 'Getting there', 'Info'], cta: 'Get tickets', ctaAlt: 'See the lineup',
    eyebrow: '12–14 September · Whitby sands', headline: 'Three days of loud music on a very quiet beach.',
    short: 'Low Tide 24.', sub: 'Four stages, six thousand people, and a curfew set by the tide table. Sleep in a field, swim at dawn, be home by Monday.',
    features: [
      { title: 'Tide-timed sets', body: 'The main stage closes when the sea comes in. It has never been late.' },
      { title: 'Local food only', body: 'Thirty traders within fifty miles. Nothing is sold that we have not eaten.' },
      { title: 'Rail and bus included', body: 'Your wristband is a ticket on the Whitby line all weekend.' },
      { title: 'Quiet field', body: 'A camping area with sound off at ten and breakfast at eight.' },
      { title: 'Swim at dawn', body: 'Lifeguards and hot tea at the water from six every morning.' },
      { title: 'Step-free site', body: 'Boardwalks to every stage, and a viewing platform on the dunes.' },
    ],
    stats: [{ value: '6,000', label: 'capacity, strictly' }, { value: '4', label: 'stages' }, { value: '30', label: 'local food traders' }, { value: '22:40', label: 'high water, Saturday' }],
    quotes: [
      { text: 'I watched a band finish as the tide touched the sound desk. Perfect.', who: 'Jo, 2023' },
      { text: 'The only festival where I slept properly.', who: 'Tamsin' },
      { text: 'Rail included meant we left the car at home for once.', who: 'Ade & Sam' },
    ],
    index: ['Friday|Doors 15:00 · Opening set 17:30', 'Saturday|First swim 06:00 · Headliner 21:15', 'Sunday|Brunch set 11:00 · Close 19:00', 'Main stage|Sand · capacity 3,500', 'The Boatshed|Covered · capacity 800', 'Dune stage|Open air · capacity 600', 'Quiet field|Camping · sound off 22:00', 'Harbour kitchen|Food · 30 traders'],
    tableCols: ['Day', 'Stage', 'Artist', 'Time'], tableRows: ['Fri|Main|Marram|17:30', 'Fri|Boatshed|The Salt Cellars|19:00', 'Sat|Main|Ines Okoro|21:15', 'Sun|Dune|Pale Harbour|16:00'],
    marquee: ['Low Tide 24', '12–14 September', 'Whitby sands', 'Rail included'], tags: ['Sold out Fri', 'Final release', 'Rail incl.', 'Step-free'],
    closing: 'Final release goes on sale Thursday.', closingSub: 'Weekend wristbands, camping and rail travel in one ticket.', footer: 'Low Tide Festival · Whitby Sands · info@lowtide.example',
    art: ['waves', 'sun', 'stripes', 'rings'],
  },
]

export const APPS: AppContent[] = [
  {
    id: 'tasks', name: 'Foreman', nav: ['Today', 'Jobs', 'Crew', 'Materials', 'Archive'], user: 'Dana W.', title: 'Jobs this week', sub: 'Eleven open, three waiting on materials.', primary: 'New job',
    kpis: [{ value: '11', label: 'open jobs' }, { value: '3', label: 'blocked' }, { value: '£18.4k', label: 'quoted this month' }, { value: '92%', label: 'on time' }],
    tableCols: ['Job', 'Site', 'Crew', 'Due'], tableRows: ['Replace fascia|14 Orchard Rd|Mo, Kit|Thu', 'Re-lay patio|Hill Farm|Sam|Fri', 'Bathroom strip-out|3 Quay St|Mo|Mon', 'Fence panels|22 Vale Rd|Kit|Tue', 'Loft boarding|9 Elm Ct|Sam, Kit|Wed'],
    side: ['Order treated 47×100 timber|Today', 'Call Mrs Pell about skip|Today', 'Invoice Hill Farm|Wed', 'Van service|Fri'],
    columns: [
      { title: 'Quoted', cards: [{ title: 'Garden room, Vale Rd', tag: '£9.2k', meta: 'Sent Tue' }, { title: 'Porch roof', tag: '£2.1k', meta: 'Sent Mon' }] },
      { title: 'Booked', cards: [{ title: 'Loft boarding', tag: 'Wed', meta: 'Sam, Kit' }, { title: 'Bathroom strip-out', tag: 'Mon', meta: 'Mo' }, { title: 'Fence panels', tag: 'Tue', meta: 'Kit' }] },
      { title: 'On site', cards: [{ title: 'Replace fascia', tag: 'Day 2', meta: 'Mo, Kit' }, { title: 'Re-lay patio', tag: 'Day 1', meta: 'Sam' }] },
      { title: 'Invoiced', cards: [{ title: 'Kitchen splashback', tag: '£640', meta: 'Paid' }, { title: 'Gate repair', tag: '£180', meta: 'Due Fri' }] },
    ],
    threads: [
      { from: 'Mrs Pell', subject: 'Skip arriving Monday?', preview: 'Just checking it will fit on the drive because the neighbour has…', time: '09:12' },
      { from: 'Hill Farm', subject: 'Patio levels', preview: 'Photos attached. The slope runs towards the barn, not away.', time: '08:40' },
      { from: 'Travis Timber', subject: 'Order 4471 ready', preview: 'Your 47×100 is on the yard. Close at 4.', time: 'Yesterday' },
      { from: 'Kit', subject: 'Sick note', preview: 'Back Thursday. Sorry for the short notice on the fence job.', time: 'Yesterday' },
      { from: 'Quay Street', subject: 'Access code', preview: 'The new code is on the side of the meter box, underneath.', time: 'Mon' },
    ],
    settings: [
      { group: 'Business', fields: [{ label: 'Trading name', kind: 'text', value: 'Weller & Sons Building' }, { label: 'Default VAT', kind: 'select', value: '20%' }, { label: 'Address', kind: 'textarea', value: '4 Mill Lane, Totnes' }] },
      { group: 'Notifications', fields: [{ label: 'Daily crew summary', kind: 'toggle', on: true }, { label: 'Warn when materials block a job', kind: 'toggle', on: true }, { label: 'Weekend alerts', kind: 'toggle', on: false }] },
    ],
  },
  {
    id: 'ledger', name: 'Tally', nav: ['Overview', 'Invoices', 'Expenses', 'Clients', 'Reports'], user: 'Ravi S.', title: 'Money in, money out', sub: 'October so far, all accounts.', primary: 'New invoice',
    kpis: [{ value: '£12,480', label: 'invoiced' }, { value: '£4,210', label: 'overdue' }, { value: '£3,905', label: 'spent' }, { value: '17 days', label: 'avg. to be paid' }],
    tableCols: ['Invoice', 'Client', 'Amount', 'Status'], tableRows: ['INV-0412|Marlowe Press|£2,400|Paid', 'INV-0413|Greenacre Co-op|£880|Due 4 Nov', 'INV-0414|Studio Anselm|£3,150|Overdue 9d', 'INV-0415|Hale & Daughter|£1,260|Draft', 'INV-0416|Mosaic Books|£640|Sent'],
    side: ['Chase INV-0414|Today', 'Reconcile Monzo|Wed', 'File VAT return|31 Oct', 'Renew insurance|14 Nov'],
    columns: [
      { title: 'Draft', cards: [{ title: 'Hale & Daughter', tag: '£1,260', meta: 'Created today' }] },
      { title: 'Sent', cards: [{ title: 'Mosaic Books', tag: '£640', meta: 'Due 12 Nov' }, { title: 'Greenacre Co-op', tag: '£880', meta: 'Due 4 Nov' }] },
      { title: 'Overdue', cards: [{ title: 'Studio Anselm', tag: '£3,150', meta: '9 days' }, { title: 'Penny Lane Cafe', tag: '£1,060', meta: '21 days' }] },
      { title: 'Paid', cards: [{ title: 'Marlowe Press', tag: '£2,400', meta: '18 Oct' }, { title: 'Oakfield School', tag: '£980', meta: '11 Oct' }] },
    ],
    threads: [
      { from: 'Studio Anselm', subject: 'Re: INV-0414', preview: 'Apologies, accounts has been off. Paying on Friday, I promise.', time: '10:02' },
      { from: 'Greenacre Co-op', subject: 'PO number needed', preview: 'Could you add PO 88213 and resend? Finance will not accept it without.', time: '09:30' },
      { from: 'HMRC', subject: 'VAT return reminder', preview: 'Your return for the period ending 30 Sep is due on 31 Oct.', time: 'Yesterday' },
      { from: 'Mosaic Books', subject: 'Thank you', preview: 'Invoice received. Lovely work on the covers again.', time: 'Mon' },
    ],
    settings: [
      { group: 'Invoicing', fields: [{ label: 'Payment terms', kind: 'select', value: '14 days' }, { label: 'Late fee', kind: 'text', value: '2% per month' }, { label: 'Footer note', kind: 'textarea', value: 'Bank: Starling · Sort 60-83-71' }] },
      { group: 'Reminders', fields: [{ label: 'Email clients 3 days before due', kind: 'toggle', on: true }, { label: 'Email on the day', kind: 'toggle', on: false }, { label: 'Chase weekly when overdue', kind: 'toggle', on: true }] },
    ],
  },
  {
    id: 'support', name: 'Larkspur', nav: ['Inbox', 'Assigned', 'Snoozed', 'Sent', 'Spam'], user: 'Noor A.', title: 'Inbox', sub: '14 waiting, oldest 3 hours.', primary: 'Compose',
    kpis: [{ value: '14', label: 'waiting' }, { value: '2h 10m', label: 'median first reply' }, { value: '96%', label: 'happy replies' }, { value: '3', label: 'snoozed' }],
    tableCols: ['Customer', 'Topic', 'Owner', 'Age'], tableRows: ['Elena V.|Refund for set of 4|Noor|3h', 'Chris P.|Wrong colour arrived|Unassigned|2h', 'Okonkwo Ltd|Bulk pricing|Sam|1h', 'Ayesha K.|Where is my parcel|Noor|45m', 'Tom H.|Gift receipt|Unassigned|20m'],
    side: ['Macro: refund approved|Used 41×', 'Macro: parcel delayed|Used 38×', 'Macro: gift receipt|Used 12×', 'Macro: bulk quote|Used 6×'],
    columns: [
      { title: 'New', cards: [{ title: 'Wrong colour arrived', tag: 'Chris P.', meta: '2h' }, { title: 'Gift receipt', tag: 'Tom H.', meta: '20m' }] },
      { title: 'Waiting on us', cards: [{ title: 'Refund for set of 4', tag: 'Elena V.', meta: '3h' }, { title: 'Bulk pricing', tag: 'Okonkwo Ltd', meta: '1h' }] },
      { title: 'Waiting on them', cards: [{ title: 'Parcel photo', tag: 'Ayesha K.', meta: '1d' }] },
      { title: 'Solved', cards: [{ title: 'Address change', tag: 'M. Ruiz', meta: 'Today' }, { title: 'Care instructions', tag: 'L. Dunn', meta: 'Today' }] },
    ],
    threads: [
      { from: 'Elena Vasquez', subject: 'Refund for set of 4', preview: 'Two arrived cracked. I have photos. I would rather not wait another week.', time: '11:04' },
      { from: 'Chris Parry', subject: 'Wrong colour arrived', preview: 'I ordered the moss glaze and got the oatmeal. It\'s lovely but not the plan.', time: '10:51' },
      { from: 'Okonkwo Ltd', subject: 'Bulk pricing', preview: 'We run six holiday lets and need 48 mugs by January. Is there a rate?', time: '10:12' },
      { from: 'Ayesha Khan', subject: 'Where is my parcel', preview: 'Tracking has said "out for delivery" since Tuesday. Could you chase?', time: '09:58' },
      { from: 'Tom Hughes', subject: 'Gift receipt', preview: 'Could you send a copy without prices? It is for my sister.', time: '09:30' },
      { from: 'Maya Ruiz', subject: 'Address change', preview: 'Moved last week. New address below. Sorry!', time: '09:02' },
    ],
    settings: [
      { group: 'Profile', fields: [{ label: 'Display name', kind: 'text', value: 'Noor Ahmed' }, { label: 'Signature', kind: 'textarea', value: 'Noor, customer care\nKiln & Kettle' }, { label: 'Working hours', kind: 'select', value: 'Mon–Fri, 9–5' }] },
      { group: 'Behaviour', fields: [{ label: 'Auto-assign new threads', kind: 'toggle', on: false }, { label: 'Show customer order history', kind: 'toggle', on: true }, { label: 'Send satisfaction survey', kind: 'toggle', on: true }] },
    ],
  },
  {
    id: 'bookings', name: 'Padlock', nav: ['Calendar', 'Bookings', 'Clients', 'Rooms', 'Payouts'], user: 'Jo M.', title: 'This week at the studio', sub: '23 bookings, two rooms free on Thursday.', primary: 'New booking',
    kpis: [{ value: '23', label: 'bookings' }, { value: '74%', label: 'room utilisation' }, { value: '£2,860', label: 'taken' }, { value: '2', label: 'waitlist' }],
    tableCols: ['Time', 'Class', 'Room', 'Booked'], tableRows: ['Mon 07:00|Early reformer|Light|8/8', 'Mon 12:30|Lunch mobility|Dark|5/10', 'Tue 18:00|Strength basics|Light|9/10', 'Wed 19:15|Slow flow|Dark|10/10', 'Thu 07:00|Early reformer|Light|4/8'],
    side: ['Cover Thursday 07:00|Needs teacher', 'Reorder mat spray|Low', 'Mop the Dark room|Today', 'Payout to Lena|Fri'],
    columns: [
      { title: 'Mon', cards: [{ title: 'Early reformer', tag: '8/8', meta: '07:00 · Light' }, { title: 'Lunch mobility', tag: '5/10', meta: '12:30 · Dark' }] },
      { title: 'Tue', cards: [{ title: 'Strength basics', tag: '9/10', meta: '18:00 · Light' }] },
      { title: 'Wed', cards: [{ title: 'Slow flow', tag: 'Full', meta: '19:15 · Dark' }, { title: 'Open practice', tag: '3/12', meta: '10:00 · Light' }] },
      { title: 'Thu', cards: [{ title: 'Early reformer', tag: '4/8', meta: '07:00 · Light' }] },
    ],
    threads: [
      { from: 'Lena', subject: 'Can I swap Thursday?', preview: 'Dentist at 6. Could Fatima take the early reformer?', time: '08:14' },
      { from: 'New client: Ben', subject: 'First class advice', preview: 'I have a bad lower back. Which class would you recommend?', time: '07:50' },
      { from: 'Fatima', subject: 'Re: Thursday', preview: 'Yes, happy to. I will need the key code.', time: 'Yesterday' },
    ],
    settings: [
      { group: 'Booking rules', fields: [{ label: 'Cancel window', kind: 'select', value: '12 hours' }, { label: 'Late-cancel fee', kind: 'text', value: '£5' }, { label: 'Waitlist auto-promote', kind: 'toggle', on: true }] },
      { group: 'Rooms', fields: [{ label: 'Light room capacity', kind: 'text', value: '8' }, { label: 'Dark room capacity', kind: 'text', value: '10' }, { label: 'Open on bank holidays', kind: 'toggle', on: false }] },
    ],
  },
]

export const MARKETING_KINDS = MARKETING.map((m) => m.id)
export const APP_KINDS = APPS.map((a) => a.id)

export const BANNED_PHRASES = [/unlock the power/i, /supercharge/i, /seamless(ly)?/i, /revolutioni[sz]e/i, /game[- ]changer/i, /elevate your/i, /all-in-one/i, /next[- ]level/i, /cutting[- ]edge/i, /lorem ipsum/i, /take your .* to the next/i]
export const EMOJI_RE = /\p{Extended_Pictographic}/u
