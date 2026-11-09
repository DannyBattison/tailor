// 1024 plain words, 10 bits each: the design code is written in these so it can be read aloud, remembered and typed.
// The list is part of the code format: never reorder, add or remove words.
export const WORDS = `
able acorn acre actor adobe agate agile alarm album alder alley almond alpine amber ample anchor angle ankle anvil
apple apricot apron aqua arbor arch arctic ardent arena arrow artful ash aspen aster atlas attic autumn avid award axle
azure badge badger bagel baker ballad balm balmy bamboo banjo barley barn baron barrel basalt basil basin basket bay
beach beacon beam bean bear beetle bell bench beret berry birch bishop bison blade blanket blaze blithe blizzard bloom
blossom bluff boat bobbin bold bone bonnet bonus book boot border bottle bough bowl bramble branch brass brave bread
breeze breezy brick bridge bright brine brisk broad bronze brook broom brush bubble bucket buckle buffalo bugle bundle
burlap burrow butter button cabbage cabin cable cactus cairn cake calico calm camel camp canal candid candle candy
cannon canoe canopy canyon cape caper card cardinal careful cargo carousel carpet carrot cart cashew castle cat cattle
cave cedar cellar chalk chapel chariot charm cheery cheese cherry chess chest chestnut chicory chief chime chimney chip
choir cider cinder cinnamon circle citadel citrus civil clam clarinet clay clean clear cleat clever cliff clock close
cloud clover coast cobalt cobbler cobweb cocoa coil comet compass compote condor copper coral coriander cork cormorant
corn cosy cottage cotton courtyard cove coyote crab cradle craft crane crater creek crest cricket crimson crisp crocus
crossbow crow crown crumb crystal cube cuckoo cup curious curl currant current curtain cutter cypress daffodil dahlia
dainty daisy dale dance dandelion dapper dapple daring dart dawn dear deck deep deer delta den dense desert devout dew
dial diary dice dingo direct dish divine dizzy dock doll dolmen dolphin dome donkey door dormouse dove draft dragon
dragonfly drift drizzle drum duck dumpling dune dusk dust dusty eager eagle early earnest earth easel easy echo eclipse
eddy elbow elder elegant elk elm ember emerald engine envoy epic epoch ermine estuary even evening exact fable fabric
faint fair falcon falconer fall fan fancy farm fast fawn feast feather fennel fern ferret ferry fiddle fiddler field
fiery fig finch fine fir fire firm fish fit fjord flag flame flamingo flannel flat flax fleece fleet flint flock flood
flotilla flour fluent flute foam fog fond forest forge fork fort fossil fountain fox foxglove frame frank freckle free
fresco fresh frigate frost frosty fruit fudge fuzzy gable galaxy gale gallery gander garden garlic garnet gate gazebo
gazelle gear gecko gem gentle geyser giant ginger gingham glacier glad glade glass gleeful glen glider globe glossy
glove goat goblet gold golden gondola goose gorge gosling grain granary grand granite grape grass gravel great green
griffin grove gruel guitar gull gypsum haddock halibut hall hamlet hammer hammock harbor hardy hare harness harp
harvest hasty hat hawk hawthorn hazel heart hearth hearty heath heather heavy hedge heirloom heliotrope hemlock heron
herring hickory hidden high hill hillock hinge hive hollow hollyhock homestead honest honey hood hoof hook horizon horn
horse hound hull humble hushed hut hyacinth ice iceberg icy ideal igloo indigo ink inkwell inlet iris iron island ivory
ivy jackdaw jacket jade jaguar jam jar jasmine jaunty jay jelly jewel jigsaw jolly journal joyful juniper kayak keen
kelp kernel kestrel kettle key kiln kind kingdom kingfisher kite kitten kiwi knot koala kohl lace ladder lagoon lake
lamb lamp lamplight lance lanky lantern larch large lark lasting latch laurel lava lavender lawn lazy leaf ledge lemon
lemur lens lentil leopard level lever library lichen light lighthouse lilac lily limestone limpet linen linnet lion
lithe lively lizard loaf locket lodge loft lofty log lone long lotus loyal lucid lucky lupin lush lute lynx magic
magnet magpie mahogany main major mallard mallet mandolin mango mantle maple marble marigold market marmot marsh mask
meadow meerkat mellow melon merlin merry mesa meteor mighty mild mill minnow minor mint mirror mist mistral misty
mitten moat mockingbird modest mole monsoon moon mooring moose moss mossy moth mountain mouse mug mulberry mulch mural
mushroom muslin narwhal native neat nectar needle nest net nettle new night nightingale nimble noble noodle normal
north novel nugget nutcracker nutmeg oak oar oasis oatmeal ocean ocelot odd olive onion opal open orbit orchard orchid
osprey ostrich otter oven owl oyster paddle paddock pagoda pale palm pan panda pantry paper parade parchment parrot
partridge pasture path patient peacock pear pearl pebble pelican pencil penguin pepper peppy petal pewter pheasant
piano pickle pier pigeon pillow pine pinnacle pitcher plain planet plank plate plaza plover plucky plum plume pocket
polite pond pony poplar poppy porch porcupine porpoise port potato pottery prairie primrose prism proud prow puddle
puffin pumice pumpkin puppet pure puzzle quail quaint quarry quartz quick quiet quill quilt quince quiver rabbit
raccoon radish raft rain rampart rapid rare raspberry raven ready reed reef regal reindeer rhubarb ribbon rich ridge
ring ripe river riverbank robin robust rocket roof rooster root rope rose rosemary rosy round rowan royal ruby rudder
rug rush rustic rye saddle saffron sage sail salmon salt sand sandal sandpiper sandy sapphire sardine satchel satin
scallop scarf school scroll seagull seal seed sequoia sextant shade shamrock sharp shed shelf shell shepherd shield
shiny ship shore shovel shrub shy sickle silent silk silver simple sketch skiff sky slate sled sleek sleet slim slope
slow small smart smooth snail snow snowy snug soap soft solid sound spare sparrow speedy spice spider spindle spire
spoon spring spruce spry squirrel stable stag stair star steady steam stem still stone stork storm stout stream studio
sturdy subtle sugar summit sun sunny super swallow swan sweater sweet swift swing sword table tailor tall tame tangle
tapestry teacup temple tender tent thick thicket thimble thin thistle thorn thread thunder tide tidy tiger timber tiny
toast tomato tool torch tough tower trail train trapeze treasure trellis tricycle trout true trumpet trusty tulip
tundra tunnel turnip turtle twig umber umbrella upbeat urban valley vanilla vase vast velvet vessel vine violet violin
vivid volcano vole wagon walnut wand warm warren wasp watch water wave wavy wax weasel weave wee well whale wheat wheel
whistle whole wide wild willow wind window windy wing winter wise witty wolf wood wool woolly workshop worthy wren
yacht yam yard yarn yew yoke young zany zebra zenith zephyr zesty zinc
`.trim().split(/\s+/)
export const WORD_BITS = 10
const INDEX = new Map(WORDS.map((w, i) => [w, i]))
export const wordIndex = (w: string) => INDEX.get(w)
