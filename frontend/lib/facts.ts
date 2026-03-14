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
    body: 'Humans have 3 types of colour receptor; mantis shrimp have 16. Surprisingly, this doesn\'t make them better at distinguishing similar colours — behavioural tests show they are worse than humans at fine discrimination. Current research suggests they use a rapid-recognition system, matching colour patterns like a barcode reader rather than mixing signals the way human vision does.',
  },
  {
    id: 2,
    title: 'Saturn has a hexagonal storm the size of two Earths',
    body: 'A persistent hexagonal jet stream sits at Saturn\'s north pole, each side roughly 14,500 km long — larger than Earth\'s diameter. It has been observed continuously since Voyager passed in 1981. Similar hexagonal patterns can be reproduced in rotating fluid experiments in the lab, suggesting it arises from atmospheric wave instabilities.',
  },
  {
    id: 3,
    title: 'Oxford University is older than the Aztec Empire',
    body: 'Teaching at Oxford is documented from at least 1096 AD. The Aztec Empire was founded in 1428 AD — roughly 330 years later. When the first Oxford students were sitting exams, the civilisation that would build Tenochtitlan did not yet exist.',
  },
  {
    id: 4,
    title: 'On Venus, a day is longer than a year',
    body: 'Venus rotates so slowly that its sidereal day (243 Earth days) exceeds its orbital year (224.7 Earth days). It also rotates in reverse relative to most planets, so the Sun rises in the west and sets in the east. Venus is the only planet where you would age one year before completing a single rotation.',
  },
  {
    id: 5,
    title: '"Muscle" and "mussel" share a root meaning little mouse',
    body: 'Both words derive from Latin musculus, a diminutive of mus (mouse). Romans observed that a flexing bicep — or a shellfish moving under its shell — resembled a small mouse rippling beneath skin. The same root gives us the Greek mys, which meant both mouse and muscle.',
  },
  {
    id: 6,
    title: 'The Moon is drifting away at the speed of a growing fingernail',
    body: 'Laser ranging via retroreflectors left by Apollo missions shows the Moon recedes from Earth at about 3.8 cm per year — roughly the rate of fingernail growth. As a consequence, the Moon is gradually appearing smaller in our sky. Total solar eclipses, which require near-perfect size matching, will eventually stop occurring.',
  },
  {
    id: 7,
    title: 'Sunsets on Mars are blue',
    body: 'Mars has the opposite sky to Earth: its daytime sky is a pinkish-red, and its sunsets are blue. Fine iron-oxide dust scatters red wavelengths throughout the day, tinting the sky warm. Near the horizon at dusk, blue light penetrates more efficiently through the dust path — producing a pale blue halo around the setting Sun. Confirmed by Mars rover imagery.',
  },
  {
    id: 8,
    title: '"Trivia" comes from the Latin word for crossroads',
    body: 'Trivium in Latin means the place where three roads meet. The adjective trivialis meant "of the crossroads" — public, commonplace, the kind of thing gossiped about in the street. This sense of "too ordinary to matter" passed into English as trivial, and the plural trivium became trivia.',
  },
  {
    id: 9,
    title: 'A Greek device from 100 BC could predict eclipses',
    body: 'The Antikythera mechanism, recovered from a shipwreck in 1901 and dated to roughly 100 BC, could track the Metonic calendar, predict solar and lunar eclipses, and follow the schedule of Panhellenic games. It used at least 30 interlocking bronze gears. No mechanism of comparable complexity is known for roughly a millennium after it was built.',
  },
  {
    id: 10,
    title: 'Maps used to put east at the top',
    body: 'The word orientation comes from Latin orientem — the rising sun, the east. Medieval European mappa mundi, such as the Hereford Map (c. 1300), placed east at the top and Jerusalem at the centre. When you orient yourself today, you are etymologically facing east — a relic of when that was the direction maps pointed.',
  },
  {
    id: 11,
    title: 'Knocker-uppers were paid to tap on your window every morning',
    body: 'Before alarm clocks were common in Britain and Ireland, people hired knocker-uppers to wake them for early shifts. They used long bamboo poles to tap upper-storey windows, or blowpipes to shoot dried peas against the glass. Photographic records from 1931 document the profession in East London. It persisted in some areas into the 1970s.',
  },
  {
    id: 12,
    title: 'The Eiffel Tower grows taller every summer',
    body: 'Thermal expansion causes the iron structure to grow approximately 12–15 cm taller in summer than in winter. The effect is so consistent it is noted on the official Eiffel Tower website. On particularly hot days, the top of the tower also sweeps a small circular arc as sunlight heats one face more than the others.',
  },
  {
    id: 13,
    title: 'A 600-year-old manuscript has never been decoded',
    body: 'The Voynich manuscript — carbon-dated to 1404–1438, held at Yale\'s Beinecke Library — is written in a consistent, unknown script with detailed illustrations of plants, astronomical charts, and human figures. No one has decoded it despite serious cryptographic analysis, including a classified study by the NSA (since declassified and available on the NSA\'s own website).',
  },
  {
    id: 14,
    title: '"Quarantine" is the Italian word for forty days',
    body: 'During the Black Death, Venice required ships to anchor offshore for quarantina giorni — forty days — before passengers could disembark. The number 40 had no medical basis; it was chosen for its biblical resonance (forty days of flood, forty years in the desert). The practice, and the word, spread across Europe and into English.',
  },
  {
    id: 15,
    title: 'The Great Pyramid was originally blinding white',
    body: 'The Great Pyramid was clad in polished white Tura limestone that would have reflected sunlight visibly from miles away. The outer casing was stripped primarily in 1356 AD — a major earthquake had loosened the stones — and the material was used to build Cairo mosques and fortresses. A few original casing stones remain at the base.',
  },
  {
    id: 16,
    title: 'The Canary Islands are named after dogs, not birds',
    body: 'The name comes from Latin Canariae Insulae — Island of Dogs. Pliny the Elder recorded that the island Canaria was named for the large dogs found there. The Canary bird is native to the islands and was named after them, not the other way around. The islands\' coat of arms features two dogs.',
  },
  {
    id: 17,
    title: 'The Colosseum had a retractable roof run by sailors',
    body: 'The velarium was a massive linen awning rigged above the Colosseum on roughly 240 wooden masts. It was operated by a dedicated detachment of sailors from the imperial fleet at Misenum, who were garrisoned in Rome specifically for this purpose — their sail and rigging expertise made them the obvious choice. The system is attested by Martial and Pliny.',
  },
  {
    id: 18,
    title: 'Reindeer eyes change colour with the seasons',
    body: 'Reindeer are the only known mammals whose eyes change colour seasonally. The tapetum lucidum — the reflective layer behind the retina — shifts from golden in summer to deep blue in winter, via changes in collagen fibre spacing. Blue winter eyes are roughly 1,000 times more light-sensitive, an adaptation to the near-total darkness of the Arctic winter. (Jeffery et al., Proceedings of the Royal Society B, 2022)',
  },
  {
    id: 19,
    title: '"Clue" originally meant a ball of yarn',
    body: 'Old English cliewen meant a ball of thread or yarn. In the myth of Theseus, Ariadne gave him a ball of thread to unwind through the labyrinth so he could retrace his path after killing the Minotaur. The clew — the thing that led you out of a maze — gradually shifted in meaning to any piece of evidence that guides you through a mystery.',
  },
  {
    id: 20,
    title: 'Roman harbour concrete has been getting stronger for 2,000 years',
    body: 'Modern Portland cement degrades in seawater within decades. Roman marine concrete — made from volcanic ash, seawater, and lime — does the opposite. Seawater percolating through the mixture causes aluminous tobermorite crystals to grow within it, reinforcing the structure over time. Analysis using synchrotron X-ray diffraction confirmed the process is still ongoing in structures built two millennia ago. (Jackson et al., American Mineralogist, 2017)',
  },
]
