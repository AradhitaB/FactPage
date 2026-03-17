// ─────────────────────────────────────────────────────────────────────────────
// EDIT THIS FILE to change the list content.
//
// Add, remove, or reorder items freely — both list variants (scrollable and
// click-through) adapt automatically to however many items are here.
//
// Each item needs:
//   title  — short heading shown in bold
//   body   — the paragraph text beneath it
// ─────────────────────────────────────────────────────────────────────────────

export interface ListItem {
  id: number
  title: string
  body: string
}

export const LIST_ITEMS: ListItem[] = [
  {
    id: 1,
    title: 'Mantis shrimp see with 16 colour channels',
    body: 'Humans have 3 types of colour receptor; mantis shrimp have 16. Surprisingly, this doesn\'t make them better at distinguishing similar colours — behavioural tests show they are actually worse than humans at fine discrimination. Current research suggests they use a rapid-recognition system, matching colour patterns like a barcode reader rather than blending signals the way human vision does.',
  },
  {
    id: 2,
    title: 'Saturn has a hexagonal storm the size of two Earths',
    body: 'A persistent hexagonal jet stream sits at Saturn\'s north pole, each side about 14,500 km long — wider than Earth\'s diameter. It has been observed continuously since the Voyager flyby in 1981. Similar shapes can be reproduced in rotating fluid experiments in the lab, which suggests the geometry comes from wave instabilities in the atmosphere rather than anything more exotic.',
  },
  {
    id: 3,
    title: 'Oxford University is older than the Aztec Empire',
    body: 'Teaching at Oxford is documented from at least 1096 AD. The Aztec Empire was founded in 1428, some 330 years later. When the first Oxford students were sitting exams, the civilisation that would eventually build Tenochtitlan did not yet exist.',
  },
  {
    id: 4,
    title: 'On Venus, a day is longer than a year',
    body: 'Venus rotates so slowly that its sidereal day (243 Earth days) exceeds its orbital year (224.7 Earth days). It also rotates in reverse relative to most planets, so the Sun rises in the west and sets in the east. It is the only planet where you complete a full orbit before the planet has turned once.',
  },
  {
    id: 5,
    title: '"Muscle" and "mussel" share a root meaning little mouse',
    body: 'Both words derive from Latin musculus, a diminutive of mus (mouse). Romans noticed that a flexing bicep looked like a small mouse moving beneath skin, and applied the same image to a shellfish shifting inside its shell. The same root gives us the Greek mys, which meant both mouse and muscle.',
  },
  {
    id: 6,
    title: 'The Moon is drifting away at the speed of a growing fingernail',
    body: 'Laser ranging via retroreflectors left by Apollo missions shows the Moon is receding from Earth at about 3.8 cm per year, roughly the rate a fingernail grows. The Moon is gradually appearing smaller in our sky as a result, which means total solar eclipses, which depend on the Moon appearing nearly the same size as the Sun, will eventually stop happening.',
  },
  {
    id: 7,
    title: 'Sunsets on Mars are blue',
    body: 'Mars has an inverted sky compared to Earth: its daytime sky runs pinkish-red, but its sunsets are blue. Fine iron-oxide dust scatters red wavelengths throughout the atmosphere all day. Near the horizon at dusk, blue light passes more efficiently through the dust, producing a pale blue glow around the setting Sun. Mars rover imagery has confirmed this.',
  },
  {
    id: 8,
    title: '"Trivia" comes from the Latin word for crossroads',
    body: 'Trivium in Latin means the place where three roads meet. The adjective trivialis meant "of the crossroads": public, commonplace, the sort of thing you\'d gossip about in the street. That sense of "too ordinary to matter" passed into English as trivial, and the plural trivium eventually became trivia.',
  },
  {
    id: 9,
    title: 'A Greek device from 100 BC could predict eclipses',
    body: 'The Antikythera mechanism, recovered from a shipwreck in 1901 and dated to roughly 100 BC, could track the Metonic calendar, predict solar and lunar eclipses, and follow the schedule of Panhellenic games. It contained at least 30 interlocking bronze gears. Nothing of comparable mechanical complexity survives from the next thousand years of history.',
  },
  {
    id: 10,
    title: 'Maps used to put east at the top',
    body: 'The word orientation comes from Latin orientem, meaning the rising sun, meaning east. Medieval European mappa mundi, including the Hereford Map (c. 1300), placed east at the top and Jerusalem at the centre. When you orient yourself today, you are etymologically facing east, a leftover from when that was the direction maps pointed.',
  },
  {
    id: 11,
    title: 'Knocker-uppers were paid to tap on your window every morning',
    body: 'Before alarm clocks were common in Britain and Ireland, people hired knocker-uppers to wake them for early shifts. They used long bamboo poles to tap on upper-storey windows, or blowpipes to shoot dried peas at the glass. Photographic records from 1931 document the practice in East London, and it persisted in some areas into the 1970s.',
  },
  {
    id: 12,
    title: 'The Eiffel Tower grows taller every summer',
    body: 'Thermal expansion causes the iron structure to grow roughly 12 to 15 cm taller in summer than in winter, consistently enough that the official Eiffel Tower website mentions it. On particularly hot days, the top also traces a small circular arc as sunlight heats one face more than the others.',
  },
  {
    id: 13,
    title: 'A 600-year-old manuscript has never been decoded',
    body: 'The Voynich manuscript, carbon-dated to 1404–1438 and held at Yale\'s Beinecke Library, is written in a consistent but completely unknown script, with detailed illustrations of plants, astronomical charts, and human figures. Serious cryptographic analysis has failed to decode it, including a classified NSA study that has since been declassified and published on the NSA\'s own website.',
  },
  {
    id: 14,
    title: '"Quarantine" is the Italian word for forty days',
    body: 'During the Black Death, Venice required ships to anchor offshore for quarantina giorni, forty days, before passengers could disembark. The number 40 had no medical basis; it was chosen for its biblical resonance, echoing forty days of flood and forty years in the desert. The practice, and the word, spread across Europe and into English.',
  },
  {
    id: 15,
    title: 'The Great Pyramid was originally blinding white',
    body: 'The Great Pyramid was clad in polished white Tura limestone that reflected sunlight visibly from miles away. The outer casing was largely stripped in 1356 AD after a major earthquake loosened the stones, and the material was reused to build Cairo mosques and fortresses. A few original casing stones survive at the base.',
  },
  {
    id: 16,
    title: 'The Canary Islands are named after dogs, not birds',
    body: 'The name comes from Latin Canariae Insulae, Island of Dogs. Pliny the Elder recorded that the island Canaria was named for the large dogs found there. The Canary bird is native to the islands and was named after them, not the other way around. The islands\' coat of arms still features two dogs.',
  },
  {
    id: 17,
    title: 'The Colosseum had a retractable roof run by sailors',
    body: 'The velarium was a massive linen awning rigged above the Colosseum on roughly 240 wooden masts. It was operated by a dedicated detachment of sailors from the imperial fleet at Misenum, garrisoned in Rome specifically for the task. Their expertise with sails and rigging made them the obvious choice for the job, and the system is attested by both Martial and Pliny.',
  },
  {
    id: 18,
    title: 'Reindeer eyes change colour with the seasons',
    body: 'Reindeer are the only known mammals whose eyes change colour seasonally. The tapetum lucidum, the reflective layer behind the retina, shifts from golden in summer to deep blue in winter through changes in collagen fibre spacing. Blue winter eyes are roughly 1,000 times more sensitive to light, an adaptation to the near-total darkness of the Arctic winter. (Jeffery et al., Proceedings of the Royal Society B, 2022)',
  },
  {
    id: 19,
    title: '"Clue" originally meant a ball of yarn',
    body: 'Old English cliewen meant a ball of thread or yarn. In the myth of Theseus, Ariadne gave him a ball of thread to unwind through the labyrinth so he could find his way back after killing the Minotaur. The clew, the thing that guided you out of a maze, gradually shifted in meaning to any piece of evidence that helps you navigate a mystery.',
  },
  {
    id: 20,
    title: 'Roman harbour concrete has been getting stronger for 2,000 years',
    body: 'Modern Portland cement breaks down in seawater within decades. Roman marine concrete, made from volcanic ash, seawater, and lime, does the opposite. Seawater percolating through the mixture causes aluminous tobermorite crystals to grow inside it, reinforcing the structure over time. Synchrotron X-ray diffraction confirmed the process is still ongoing in structures built two thousand years ago. (Jackson et al., American Mineralogist, 2017)',
  },
]
