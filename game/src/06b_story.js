// The story of Dog Quest: who lives where, what they say, and every quest.
// Dialogue lines are [speaker, text]. {name} is the hero's name.
const NPCS = {
  // Waggington
  barkley: { name: 'Elder Barkley', breed: 'sheepdog', town: 'waggington', at: [-30, -150], talk: ['In my day, we fetched uphill both ways. In the snow.', 'Keep your nose to the ground and your tail in the air, pup.'] },
  pepper: { name: 'Coach Pepper', breed: 'terrier', town: 'waggington', at: [175, -50], hat: 'bandana', role: 'trainer', talk: ['Stretch those paws! A hero never skips warm-ups.'] },
  clover: { name: 'Farmer Clover', breed: 'collie', town: 'waggington', at: [-150, 175], hat: 'flower', talk: ['My carrots! The squirrels dig up everything but the acorns.'] },
  pip: { name: 'Pip', breed: 'puppy', town: 'waggington', at: [70, 70], talk: ['Are you a REAL hero? Can I touch the mark? Can I? Can I?'] },
  honey: { name: 'Honey', breed: 'golden', town: 'waggington', at: [250, 20], hat: 'flower', talk: ['The bees used to be so sweet. Now they sting first and buzz later.'] },
  mabel: { name: 'Mama Mabel', breed: 'saint', town: 'waggington', at: [-175, -30], role: 'inn', talk: ['A warm bed and a full bowl. That is what an inn is for.'] },
  // Barkingham
  corgina: { name: 'Queen Corgina', breed: 'corgi', town: 'barkingham', at: [0, -150], hat: 'crown', role: 'queen', still: 1, talk: ['Barkadia believes in you, {name}.', 'A queen must always look regal. Even with very short legs.'] },
  rex: { name: 'Captain Rex', breed: 'shepherd', town: 'barkingham', at: [80, -130], hat: 'helm', still: 1, talk: ['The palace guard never sleeps. Well. Naps, sometimes.'] },
  bernard: { name: 'Bernard', breed: 'bernese', town: 'barkingham', at: [-130, 70], hat: 'beanie', talk: ['Neither rain nor snow nor squirrels will stop the mail!'] },
  gravy: { name: 'Grandpa Gravy', breed: 'basset', town: 'barkingham', at: [170, 160], talk: ['I buried a bone in 1987. Still looking for it.'] },
  bruno: { name: 'Smithy Bruno', breed: 'newfie', town: 'barkingham', at: [275, 15], role: 'smith', talk: ['Gear that fits a pup just right. That is my craft.'] },
  poodlini: { name: 'Madame Poodlini', breed: 'poodle', town: 'barkingham', at: [-250, 255], hat: 'wizard', role: 'trainer', talk: ['A trick is just magic you can do with your tail.'] },
  biscotti: { name: 'Biscotti', breed: 'golden', town: 'barkingham', at: [-275, 15], role: 'inn', talk: ['Stay as long as you like. We have the fluffiest pillows in the kingdom.'] },
  // Fetchwick
  salty: { name: 'Harbor Master Salty', breed: 'newfie', town: 'fetchwick', at: [120, 60], hat: 'pirate', talk: ['The sea gives, and the sea takes. Mostly it gives seaweed.'] },
  finn: { name: 'Fishmonger Finn', breed: 'lab', town: 'fetchwick', at: [-60, 175], hat: 'chef', talk: ['Fresh fish! Well. Fresh-ish fish.'] },
  lulu: { name: 'Little Lulu', breed: 'chihuahua', town: 'fetchwick', at: [60, -60], talk: ['I am small but I am VERY loud!'] },
  zippy: { name: 'Zippy', breed: 'greyhound', town: 'fetchwick', at: [-215, 165], role: 'trainer', talk: ['Fast is good. Faster is better. Fastest is ZOOMIES.'] },
  marlin: { name: 'Smithy Marlin', breed: 'shepherd', town: 'fetchwick', at: [140, -100], role: 'smith', talk: ['Salt air is hard on gear. Good thing I make it tough.'] },
  coral: { name: 'Coral', breed: 'dalmatian', town: 'fetchwick', at: [-170, -70], role: 'inn', talk: ['Our beds face the sea. Fall asleep to the waves!'] },
  paddle: { name: 'Captain Paddle', breed: 'lab', town: 'fetchwick', dock: 1, hat: 'pirate', still: 1, talk: ['The Royal Ferry only sails with the Queen\'s pass.'] },
  // Frostpaw
  granny: { name: 'Granny Mush', breed: 'husky', town: 'frostpaw', at: [-40, 60], hat: 'beanie', talk: ['Wear a sweater, dear. Your ears look cold.'] },
  blizz: { name: 'Sled Captain Blizz', breed: 'husky', town: 'frostpaw', at: [90, 150], hat: 'viking', talk: ['Mush! Mush! Oh. Sorry. Habit.'] },
  howler: { name: 'Old Howler', breed: 'husky', town: 'frostpaw', at: [140, -40], role: 'trainer', talk: ['The moon listens to those who howl from the heart.'] },
  flurry: { name: 'Smithy Flurry', breed: 'saint', town: 'frostpaw', at: [10, -140], role: 'smith', talk: ['Ice-forged gear. Keeps its edge, keeps you warm.'] },
  cocoa: { name: 'Cocoa', breed: 'lab', town: 'frostpaw', at: [-140, -20], role: 'inn', talk: ['Hot cocoa by the fire? Free with every stay.'] },
  // Dunehound Oasis
  digby: { name: 'Professor Digby', breed: 'basset', town: 'dunehound', at: [60, 110], hat: 'sombrero', talk: ['History is just very old dirt with stories in it.'] },
  frank: { name: 'Frank', breed: 'dachshund', town: 'dunehound', at: [-60, 0], hat: 'sombrero', talk: ['They call me Hot Dog. I did not choose this name.'] },
  sandy: { name: 'Sandy', breed: 'shiba', town: 'dunehound', at: [-135, 180], role: 'trainer', talk: ['Dig deep, and the earth will answer.'] },
  dune: { name: 'Smithy Dune', breed: 'greyhound', town: 'dunehound', at: [150, -40], role: 'smith', talk: ['Treasures of the old desert, polished up nice.'] },
  sahara: { name: 'Sahara', breed: 'poodle', town: 'dunehound', at: [-150, -40], role: 'inn', talk: ['Rest in the shade. The sand will still be hot tomorrow.'] },
  // Howlow Hollow
  madame: { name: 'Madame Howl', breed: 'borzoi', town: 'howlow', at: [0, -10], hat: 'wizard', talk: ['I see... a great destiny. And also some mud on your paws.'] },
  boo: { name: 'Boo', breed: 'greyhound', town: 'howlow', at: [-120, 0], role: 'inn', talk: ['Welcome to the Boo and Breakfast. The ghosts are mostly friendly.'] },
  // Ranger Camp
  rosie: { name: 'Ranger Rosie', breed: 'collie', town: 'camp', at: [10, -20], hat: 'bandana', talk: ['A good ranger leaves nothing behind but paw prints.'] },
  // Mittens Landing
  ferry2: { name: 'Captain Paddle', breed: 'lab', town: 'landing', dock2: 1, hat: 'pirate', still: 1, talk: ['I will wait right here. Take as long as you need.'] },
};

// people who just say things when you talk to them
const SPEAKERS = { squeaky: 'Squeaky', sign: 'Sign', hero: '{name}', nutsworth: 'Nutsworth', whiskers: 'Captain Whiskers', snowball: 'Snowball', cleocatra: 'Cleocatra', mittens: 'Lord Mittens', narrator: '' };

const PROLOGUE = [
  'Long ago, in the sunny kingdom of Barkadia, every tail wagged thanks to the Golden Ball.',
  'Each autumn Queen Corgina threw it at the Grand Fetch, and its glow filled the land with sunshine, belly rubs and snacks.',
  'But this year, as the Ball soared across the sky, a paw with very sharp claws reached out of a cloud and grabbed it.',
  'CRACK! The Golden Ball shattered, and four Golden Pieces rained down across Barkadia.',
  'And one small squeaky bit of it bonked a sleeping pup right on the head...',
];

// ---------- the main quest
const MAIN = [
  { id: 'wake', text: 'Chase off the squirrels!', type: 'kill', foes: ['squirrel'], n: 3, spawn: { town: 'waggington', dx: 260, dy: 260, foe: 'squirrel', n: 3, lv: 1 },
    start: [['squeaky', 'SQUEAK! Oh no, oh no. Are you okay? I bonked you pretty hard.'], ['squeaky', 'I\'m Squeaky! I used to be the squeaky bit inside the Golden Ball. Now I\'m just... a squeaky bit.'],
      ['squeaky', 'Hey, wait. Look at your paw! That glowing mark is the Wag Mark!'], ['squeaky', 'Only the Goodest Pup in all of Barkadia gets the Wag Mark. That means you, {name}!'],
      ['squeaky', 'Uh oh. Squirrels! Mittens must have sent them. Show them your stick!']], hint: 'move' },
  { id: 'barkley', text: 'Talk to Elder Barkley', type: 'talk', npc: 'barkley',
    start: [['squeaky', 'Nice swings! Let\'s find Elder Barkley. He knows everything. Well, almost everything.']],
    talk: [['barkley', 'Well, well. {name}, is it? I saw the Golden Ball break from my porch. Terrible business. Terrible!'], ['barkley', 'And who\'s this? A squeaky piece of the Ball? Bless my whiskers.'],
      ['barkley', 'That mark on your paw... the Wag Mark! The old stories say a pup carries it when the Ball is in trouble.'], ['barkley', 'Before you go running off, visit Coach Pepper by the Trick School. Every hero needs a trick or two.']] },
  { id: 'pepper', text: 'Learn a trick from Coach Pepper', type: 'learn', trick: 'bark', npc: 'pepper',
    talk: [['pepper', 'Elder Barkley sent you? Great! Today\'s lesson: the Bark Blast!'], ['pepper', 'Take a deep breath, puff up your chest, and... WOOF! Foes go flying.'],
      ['pepper', 'Tricks use Woof, the blue bar. Swing at baddies to fill it back up.'], ['pepper', 'Now hurry along the road east to Barkingham. The Queen will want to meet you!']] },
  { id: 'queen', text: 'Meet Queen Corgina in Barkingham', type: 'talk', npc: 'corgina',
    talk: [['corgina', 'A pup with the Wag Mark! And a squeaky piece of my Golden Ball! This is the best news all week.'], ['corgina', 'Listen closely, {name}. The thief was Lord Mittens, the grumpiest cat on Scratchpost Isle.'],
      ['corgina', 'When the Ball broke, four Golden Pieces flew off in four directions. And Mittens has sent his friends to guard them.'], ['corgina', 'Without the Ball, Barkadia\'s tails are drooping. The sun is lazy. Even the treats taste a little stale.'],
      ['corgina', 'One piece fell into Nutwood Forest, west of here. Ranger Rosie camps there. Find her!'], ['corgina', 'Take some gold for supplies. Smithy Bruno sells gear, and Madame Poodlini teaches tricks.'],
      ['squeaky', 'The Queen gave us gold! Can we buy treats? No? Okay. Gear, then.']], reward: { gold: 120, xp: 40 } },
  { id: 'rosie', text: 'Find Ranger Rosie in Nutwood Forest', type: 'talk', npc: 'rosie',
    talk: [['rosie', 'Shh! Keep your voice down. The squirrels have gone completely nuts.'], ['rosie', 'Their king, Nutsworth, has the Golden Piece inside the Great Oak. He thinks it\'s the biggest acorn ever.'],
      ['rosie', 'His scouts are everywhere. Chase off five of them and I\'ll know the coast is clear.']] },
  { id: 'scouts', text: 'Chase off squirrel scouts in Nutwood Forest', type: 'kill', foes: ['squirrel', 'bruiser'], n: 5, region: 'forest', spawn: { town: 'camp', dx: -360, dy: -260, foe: 'squirrel', n: 3, lv: 4 } },
  { id: 'rosie2', text: 'Report back to Ranger Rosie', type: 'talk', npc: 'rosie',
    talk: [['rosie', 'Great work! The scouts have scattered.'], ['rosie', 'The Great Oak is north-west of camp. Its door is locked tight, but I have a ranger key. There. It\'s open now.'],
      ['rosie', 'Good luck, {name}. And watch out for falling acorns!']], flag: 'oak_open', reward: { xp: 60 } },
  { id: 'oak', text: 'Defeat Nutsworth in the Great Oak', type: 'dungeon', dungeon: 'oak' },
  { id: 'piece1', text: 'Bring the Golden Piece to Queen Corgina', type: 'talk', npc: 'corgina',
    talk: [['corgina', 'You found one! Oh, it\'s still warm!'], ['corgina', 'Take this. The Royal Bone Scepter belonged to my grandpup, and now it\'s yours.'],
      ['corgina', 'There\'s news from Fetchwick. A pirate ship with a cat on its flag was seen near Gull Rock.'], ['corgina', 'Harbor Master Salty will know more. Fetchwick is east, by the sea.']], reward: { gold: 250, xp: 120, item: 'scepter' }, piece: 1 },
  { id: 'salty', text: 'Talk to Harbor Master Salty in Fetchwick', type: 'talk', npc: 'salty',
    talk: [['salty', 'Ahoy, young pup! A pirate cat, ye say? That\'d be Captain Whiskers.'], ['salty', 'He\'s holed up in the Soggy Grotto out on Gull Rock, east of here. Ye\'ll have to swim.'],
      ['salty', 'Can ye swim? No? Well, every pup can doggy paddle. Chin up, and kick!'], ['salty', 'There ye go. Now ye can swim in shallow water. The deep blue is too much, mind. Stay near land.']], flag: 'swim', flag2: 'grotto_open', learnSwim: 1 },
  { id: 'grotto', text: 'Swim to Gull Rock and beat Captain Whiskers', type: 'dungeon', dungeon: 'grotto' },
  { id: 'piece2', text: 'Bring the second piece to Queen Corgina', type: 'talk', npc: 'corgina',
    talk: [['corgina', 'Two pieces! Squeaky, you\'re glowing!'], ['squeaky', 'I feel squeakier than ever!'], ['corgina', 'The third piece flew north, up Mount Barkmore. Granny Mush in Frostpaw will help you.'],
      ['corgina', 'It\'s freezing up there. Here\'s some gold for something warm.']], reward: { gold: 400, xp: 220 }, piece: 2 },
  { id: 'granny', text: 'Visit Granny Mush in Frostpaw', type: 'talk', npc: 'granny',
    talk: [['granny', 'Oh my! A little traveler! Come in, come in, get warm.'], ['granny', 'Snowball the snow leopard has taken over Frostbite Den, high on the mountain. Brrr!'],
      ['granny', 'And Mittens\' horrid Vacuum Bots are blocking the mountain path. Noisy, dusty things!'], ['granny', 'Clear out three of them, dear, and the path will be safe for my sled dogs.']] },
  { id: 'bots', text: 'Clear the Vacuum Bots on the mountain path', type: 'kill', foes: ['vacbot'], n: 3, spawn: { town: 'frostpaw', dx: 230, dy: -600, foe: 'vacbot', n: 3, lv: 11 } },
  { id: 'granny2', text: 'Tell Granny Mush the path is safe', type: 'talk', npc: 'granny',
    talk: [['granny', 'You did it! And you\'re not even shivering.'], ['granny', 'I knitted you a beanie while you were gone. Now go on up to the Den, and give that leopard what for.']], flag: 'den_open', reward: { xp: 200, item: 'beanie' } },
  { id: 'den', text: 'Beat Snowball in Frostbite Den', type: 'dungeon', dungeon: 'den' },
  { id: 'piece3', text: 'Bring the third piece to Queen Corgina', type: 'talk', npc: 'corgina',
    talk: [['corgina', 'Three! Only one more to go!'], ['corgina', 'Professor Digby wrote from Dunehound Oasis. He found a pyramid shaped like a cat. A Purramid!'],
      ['corgina', 'Cleocatra, Mittens\' most dramatic friend, guards the last piece there. Go south across the desert.']], reward: { gold: 600, xp: 340 }, piece: 3 },
  { id: 'digby', text: 'Find Professor Digby at Dunehound Oasis', type: 'talk', npc: 'digby',
    talk: [['digby', 'Ah! You must be the Wag Mark pup. Splendid! Professor Digby, explorer and digger extraordinaire.'], ['digby', 'The Great Purramid is sealed by three Sun Keys, buried in the sand nearby.'],
      ['digby', 'A dog\'s nose is the finest tool for this. Sniff out the sparkly spots and dig them up!']] },
  { id: 'keys', text: 'Dig up the three Sun Keys', type: 'collect', item: 'sunkey', n: 3, how: 'dig', spots: [[5200, 5900], [5900, 5500], [6200, 6050]] },
  { id: 'digby2', text: 'Bring the Sun Keys to Professor Digby', type: 'talk', npc: 'digby',
    talk: [['digby', 'All three Sun Keys! Marvelous! The Purramid door will open for you now.'], ['digby', 'Do be careful in there. Cleocatra is very, very dramatic.']], flag: 'purr_open', reward: { xp: 300, gold: 300 } },
  { id: 'purramid', text: 'Beat Cleocatra in the Great Purramid', type: 'dungeon', dungeon: 'purramid' },
  { id: 'piece4', text: 'Bring the last piece to Queen Corgina', type: 'talk', npc: 'corgina',
    talk: [['corgina', 'All four pieces! Now we put them together and...'], ['narrator', 'The four Golden Pieces float up and click together. The Golden Ball is whole again! But it doesn\'t glow.'],
      ['corgina', 'Oh dear. The Ball is whole, but its glow is gone.'], ['squeaky', 'Mittens! He kept the Gleam, the shiny heart of the Ball!'],
      ['corgina', 'Then it\'s time to visit Scratchpost Isle. Here is my Royal Ferry pass. Captain Paddle sails from the Fetchwick docks.']], flag: 'ferry', reward: { gold: 800, xp: 500 }, piece: 4 },
  { id: 'ferry', text: 'Take the Royal Ferry from Fetchwick to Scratchpost Isle', type: 'goto', town: 'landing' },
  { id: 'keep', text: 'Storm Clawhold Keep and face Lord Mittens', type: 'dungeon', dungeon: 'keep', start: [['squeaky', 'This is it, {name}. Clawhold Keep. I can feel the Gleam in there!']] },
  { id: 'home', text: 'Return to Queen Corgina for the Grand Fetch', type: 'talk', npc: 'corgina', ending: 1,
    talk: [['squeaky', 'We did it! The Gleam is back in the Ball!'], ['corgina', '{name}, you\'ve saved Barkadia. Every tail in the kingdom is wagging for you.'],
      ['mittens', 'Hmph. I suppose you\'ll all go play fetch now. Without me. Again.'], ['hero', 'Woof!'], ['squeaky', '{name} says you should come too! Cats can play!'],
      ['corgina', 'That\'s right. From this day on, Barkadia has a new holiday: the Grand Nap. Sunbeams for everyone!'],
      ['mittens', '...A whole holiday of naps? In the sun? ...Fine. I\'ll come. But I am NOT fetching.'], ['corgina', 'Everyone ready? One... two... three... FETCH!']], reward: { gold: 1000, xp: 800, item: 'golden' } },
];
const MAIN_INDEX = {}; MAIN.forEach((s, i) => (MAIN_INDEX[s.id] = i));

// boss speeches
const BOSS_LINES = {
  nutsworth: { intro: [['nutsworth', 'Who dares enter my oak?! This shiny acorn is MINE! Lord Mittens said so!'], ['squeaky', 'That\'s not an acorn! It\'s a piece of the Golden Ball!'], ['nutsworth', 'LA LA LA, can\'t hear you! Get them, my nuts!']],
    win: [['nutsworth', 'Okay, okay! Take your shiny thing! Mittens only paid me in acorns anyway...'], ['squeaky', 'We got it! The first Golden Piece!']] },
  whiskers: { intro: [['whiskers', 'Arrr! A landlubber dog in MY grotto? Ye\'ll walk the plank for this!'], ['whiskers', 'This golden treasure is for Lord Mittens! Well. Most of it. A pirate needs a finder\'s fee.']],
    win: [['whiskers', 'Blast it! Fine, take the shiny! I\'m off to find treasure that doesn\'t bite back.'], ['squeaky', 'Piece number two! Squeak squeak!']] },
  snowball: { intro: [['snowball', 'Purrrr... a puppy? All the way up here? You\'ll catch a cold.'], ['snowball', 'This piece is the warmest thing on the mountain. I am NOT giving it up.']],
    win: [['snowball', 'Fine... it was making my paws too toasty anyway. Achoo!'], ['squeaky', 'Three pieces! We\'re so close!']] },
  cleocatra: { intro: [['cleocatra', 'Who disturbs the slumber of Cleocatra, Queen of the Sands, Empress of Naps?'], ['cleocatra', 'A DOG? In MY Purramid? How dreadfully undignified.']],
    win: [['cleocatra', 'Ugh. Take it. The glow was ruining my nap lighting anyway.'], ['squeaky', 'That\'s all four pieces! To the Queen!']] },
  mittens: { intro: [['mittens', 'So. The famous Goodest Pup. How... wholesome.'], ['mittens', 'Do you know what it\'s like to never be invited to the Grand Fetch? Every year. Dogs, dogs, dogs.'],
    ['mittens', 'The Gleam is the warmest sunbeam in the world, and now it is MINE. I shall nap in it forever!']],
    phase2: [['mittens', 'Enough! Behold my greatest invention... the DREAD VACUUM!'], ['squeaky', 'Not the vacuum! Anything but the vacuum!']],
    win: [['mittens', 'No... my beautiful vacuum...'], ['narrator', 'The Gleam floats out of the broken vacuum and settles into Squeaky like a little sun.'], ['squeaky', 'We have the Gleam! Let\'s take it home, {name}!']] },
};

// ---------- side quests. A side quest ends by talking to its giver again.
const SIDE = {
  patrol: { giver: 'clover', title: 'Squirrel Patrol', text: 'Chase off squirrels in Waggle Meadows', type: 'kill', foes: ['squirrel'], n: 6, region: 'meadow',
    offer: [['clover', 'Oh, {name}! The squirrels keep digging up my carrot patch. They don\'t even LIKE carrots!'], ['clover', 'Could you chase off six of them around the meadows?']],
    turnin: [['clover', 'My carrots are safe! Here, take this, with my thanks.']], reward: { gold: 60, xp: 50 } },
  ball: { giver: 'pip', title: 'Lost and Hound', text: 'Find Pip\'s red ball in the meadow', type: 'collect', item: 'redball', n: 1, how: 'pickup', spots: [[1250, 4950]],
    offer: [['pip', 'I lost my red ball! I threw it SO far. Like, really far. South-west, I think.'], ['pip', 'Can you find it? Please please please?']],
    turnin: [['pip', 'MY BALL! You found it! You\'re the best hero EVER! Here, you can have my party hat!']], reward: { xp: 40, item: 'party' } },
  bees: { giver: 'honey', title: 'Bee Careful', text: 'Calm down the angry bees', type: 'kill', foes: ['bee'], n: 5,
    offer: [['honey', 'The bees have gone grumpy ever since the Ball broke. Poor things are all stingy.'], ['honey', 'Could you shoo away five of them? Gently, please.']],
    turnin: [['honey', 'Thank you! It\'s so quiet now. Here, I made you a daisy crown.']], reward: { gold: 40, xp: 50, item: 'flower' } },
  mail: { giver: 'bernard', title: 'The Royal Mail', text: 'Deliver letters to Barkley, Rosie and Salty', type: 'deliver', npcs: ['barkley', 'rosie', 'salty'], needStep: 'queen',
    offer: [['bernard', 'Oof. My back. Too many letters, not enough legs.'], ['bernard', 'Could you deliver three letters for me? Elder Barkley in Waggington, Ranger Rosie at the camp, and Harbor Master Salty in Fetchwick.']],
    lines: { barkley: [['barkley', 'A letter for me? From my sister! She says hello. And to eat my vegetables. Hmph.']], rosie: [['rosie', 'Mail, out here? Bernard is amazing. Thanks, {name}!']], salty: [['salty', 'A letter! Arr, it\'s a bill. Thanks anyway, pup.']] },
    turnin: [['bernard', 'All delivered? You\'re a natural mail dog! Take this raincoat. Every mail dog needs one.']], reward: { gold: 200, xp: 160, item: 'raincoat' } },
  trash: { giver: 'rex', title: 'Trash Talk', text: 'Stop the raccoon bandits on the Royal Plains', type: 'kill', foes: ['raccoon'], n: 6, needStep: 'queen',
    offer: [['rex', 'Raccoon bandits are raiding the royal trash bins. Every night. The smell, {name}. The SMELL.'], ['rex', 'Stop six of them out on the Royal Plains and you\'ll have the thanks of the guard.']],
    turnin: [['rex', 'The bins are safe! Take this spiked collar. Guard issue.']], reward: { gold: 120, xp: 140, item: 'spiked' } },
  dig: { giver: 'gravy', title: 'Dig It', text: 'Dig up three treasure spots anywhere', type: 'digany', n: 3, needStep: 'queen',
    offer: [['gravy', 'Back in my day, every pup knew how to dig. Sniff for a sparkly spot and dig it up!'], ['gravy', 'Find three treasure spots and come tell me. It\'ll do an old dog\'s heart good.']],
    turnin: [['gravy', 'Three! That\'s my pup! Here\'s a bone I dug up myself. Well. Last week.']], reward: { gold: 150, xp: 120, item: 'bone' } },
  crabs: { giver: 'finn', title: 'Crabby Neighbors', text: 'Chase off crabs on Fetchwick Coast', type: 'kill', foes: ['crab'], n: 8, needStep: 'piece1',
    offer: [['finn', 'The crabs keep pinching my fish! Pinch, pinch, pinch, all day long.'], ['finn', 'Chase off eight of them along the coast, would you?']],
    turnin: [['finn', 'No more pinching! Here\'s some gold. And a fish. Just kidding. Just the gold.']], reward: { gold: 250, xp: 220 } },
  gulls: { giver: 'lulu', title: 'Gull-ty as Charged', text: 'Chase off thieving seagulls', type: 'kill', foes: ['gull'], n: 5, needStep: 'piece1',
    offer: [['lulu', 'The seagulls stole my SNACK. Right out of my MOUTH. I am FURIOUS!'], ['lulu', 'Chase off five of them. Teach them a lesson!']],
    turnin: [['lulu', 'HA! That showed them! Here, take my pirate hat. I am too small for it anyway.']], reward: { gold: 80, xp: 200, item: 'pirate' } },
  sled: { giver: 'blizz', title: 'Snow Problem', text: 'Find three lost sled booties on the mountain', type: 'collect', item: 'bootie', n: 3, how: 'pickup', spots: [[3700, 1600], [5000, 1900], [3500, 2200]], needStep: 'piece2',
    offer: [['blizz', 'My sled team lost their booties in the snow! Cold paws make slow sleds.'], ['blizz', 'Three booties, scattered around the mountain foothills. Can you sniff them out?']],
    turnin: [['blizz', 'Warm paws for everyone! Take this helmet. It\'s very good for headbutting snowdrifts.']], reward: { gold: 200, xp: 300, item: 'viking' } },
  ghosts: { giver: 'madame', title: 'Ghost of a Chance', text: 'Calm the ghost cats of Howlow Woods', type: 'kill', foes: ['ghost'], n: 6,
    offer: [['madame', 'The spirits are restless, little one. Ghost cats! They hiss at my crystal ball.'], ['madame', 'Calm six of them, and I shall share my magic with you.']],
    turnin: [['madame', 'The woods are peaceful again. I foresaw you would succeed. Take my spare hat.']], reward: { gold: 300, xp: 450, item: 'wizard' } },
  water: { giver: 'frank', title: 'Hot Dog', text: 'Bring Frank three jugs of oasis water', type: 'collect', item: 'jug', n: 3, how: 'pickup', spots: [[4250, 5630], [4480, 5420], [4150, 5380]], needStep: 'piece3',
    offer: [['frank', 'It is SO hot. I am a hot dog. Literally.'], ['frank', 'There are water jugs by the oasis. Could you bring me three? My legs are too short to carry them.']],
    turnin: [['frank', 'Ahhh. Cool, cool water. Take my sombrero, friend. You will need the shade.']], reward: { gold: 200, xp: 400, item: 'sombrero' } },
  burrows: { giver: 'rosie', title: 'Burrow Busters', text: 'Clear out three burrows or caves', type: 'clear', n: 3, needStep: 'rosie2',
    offer: [['rosie', 'There are little caves and burrows all over Barkadia. Mittens\' gang hides in them.'], ['rosie', 'Clear out any three of them and I\'ll give you something special.']],
    turnin: [['rosie', 'Three burrows busted! Here, the Cape of Zoom. It\'ll make you even faster.']], reward: { gold: 300, xp: 500, item: 'cape' } },
};
// bounties on the town boards: big tough critters with a price on their head
const BOUNTIES = {
  chonky: { board: 'waggington', title: 'Bounty: Chonky Squirrel', foe: 'bruiser', lv: 4, at: [1150, 4050], name: 'Chonky Squirrel', gold: 120, xp: 120, desc: 'A VERY large squirrel was seen west of Waggington. He ate a whole fence.' },
  boris: { board: 'barkingham', title: 'Bounty: Boris the Bandit', foe: 'raccoon', lv: 8, at: [5500, 3950], name: 'Boris the Bandit', gold: 300, xp: 260, desc: 'The boss of the raccoon bandits hides south-east of Barkingham.' },
  kingcrab: { board: 'fetchwick', title: 'Bounty: King Crab', foe: 'crab', lv: 11, at: [7400, 4450], name: 'King Crab', gold: 450, xp: 420, desc: 'A crab as big as a boat lurks on the south shore.' },
  frostfang: { board: 'frostpaw', title: 'Bounty: Frostfang', foe: 'fox', lv: 15, at: [3450, 1950], name: 'Frostfang', gold: 650, xp: 650, desc: 'A huge snow fox prowls west of Frostpaw. Mind your tail.' },
  sirboo: { board: 'howlow', title: 'Bounty: Sir Boo', foe: 'ghost', lv: 17, at: [7900, 1250], name: 'Sir Boo', gold: 800, xp: 800, desc: 'The oldest ghost cat in the woods. Very spooky. Very rude.' },
  scorpio: { board: 'dunehound', title: 'Bounty: Scorpio Rex', foe: 'scorpion', lv: 19, at: [5050, 6300], name: 'Scorpio Rex', gold: 1000, xp: 1000, desc: 'The biggest scorpion in the Bone Dry Desert. Pinchy.' },
};

// things you can pick up or dig for quests
const QITEMS = { redball: { name: 'Red Ball', art: 'ball' }, sunkey: { name: 'Sun Key', art: 'key' }, bootie: { name: 'Sled Bootie', art: 'bootie' }, jug: { name: 'Water Jug', art: 'jug' }, letter: { name: 'Letter', art: 'letter' } };

// what people say about the ferry and locked doors
const LOCKED = {
  oak: [['squeaky', 'The door is shut tight with roots. Ranger Rosie might know how to open it.']],
  grotto: [['squeaky', 'A pirate cave! We should ask around Fetchwick first.']],
  den: [['squeaky', 'Brrr. The Den is frozen shut. Let\'s talk to the folks in Frostpaw.']],
  purramid: [['squeaky', 'Three keyholes shaped like little suns. Somebody must know where the keys are.']],
  keep: [['squeaky', 'Clawhold Keep. Let\'s not go in until we\'re ready.']],
};
const SIGNS = {
  waggington: 'Welcome to Waggington. Please wipe your paws.',
  barkingham: 'Barkingham, royal city of Barkadia. No digging in the palace gardens.',
  fetchwick: 'Fetchwick Harbor. Beware of seagulls. They WILL take your snack.',
  frostpaw: 'Frostpaw. Population: fluffy.',
  dunehound: 'Dunehound Oasis. Stay hydrated!',
  howlow: 'Howlow Hollow. Boo.',
  camp: 'Ranger Camp. Leave only paw prints.',
  landing: 'Scratchpost Isle. NO DOGS ALLOWED. (This means you.)',
};
