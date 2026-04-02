// Tile key:
// 0  = empty
// 1  = solid cave tile (ceiling, floor, side walls)
// 2  = spike pointing UP
// 3  = spike pointing DOWN
// 5  = player start
// 6  = level exit
// 7  = floating platform tile (sprite)
//
// Fruit tiles:
// 41 = purple fruit — adds 1 echolocation charge
// 42 = red fruit    — restores 1 HP
// 43 = green fruit  — refills stamina
// 44 = blue fruit   — no special effect (still counts toward exit)

const LEVELS = [
  {
    name: "Descent",
    fruitsNeeded: 2,
    maxEcho: 4,
    cols: 30,
    rows: 16,
    map: [
      // Row 0: solid ceiling
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      // Row 1: hanging down-spikes, open upper space
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,3,3,3,0,0,0,0,0,0,0,0,0,0,1],
      // Row 2: open — exit on right wall
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,1],
      // Row 3: cave blocks upper right, fruit mid, solid wall right
      [1,0,0,0,0,0,7,7,7,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,7,7,7,7,7,1],
      // Row 4: open mid
      [1,0,0,0,0,0,0,41,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      // Row 5: floating platform mid-right
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,7,7,7,0,0,0,0,0,0,0,1],
      // Row 6: player start left, cave block mid, spike mid-right and right
      [1,5,0,0,0,0,0,0,0,0,0,0,0,0,7,7,7,2,0,0,0,0,0,2,2,0,0,0,0,1],
      // Row 7: open
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      // Row 8: cave block left, fruit center
      [1,0,0,1,1,1,0,0,0,0,0,43,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      // Row 9: cave block center
      [1,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      // Row 10: floating platform right-center
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,7,7,7,7,7,0,0,0,0,0,0,1],
      // Row 11: open
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      // Row 12: solid blocks lower left
      [1,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      // Row 13: spike hazard row with solid right wall
      [1,0,0,0,0,0,1,2,2,0,0,0,0,2,2,0,0,0,0,2,2,2,0,0,7,7,7,7,7,1],
      // Row 14: open pre-floor
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      // Row 15: solid floor
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    ]
  },
  {
    name: "The Caverns",
    fruitsNeeded: 3,
    maxEcho: 5,
    cols: 30,
    rows: 16,
    map: [
      // Row 0: solid ceiling
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      // Row 1: hanging down-spikes upper right area
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,3,3,3,0,0,0,0,0,0,0,0,1],
      // Row 2: open, fruit right
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,41,0,0,0,0,0,1],
      // Row 3: cave platforms mid
      [1,0,0,0,0,0,0,0,0,0,0,7,7,7,7,7,0,0,0,0,0,7,7,7,0,0,0,0,0,1],
      // Row 4: down-spikes below platforms
      [1,0,0,0,0,0,0,0,0,0,0,3,3,3,3,3,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      // Row 5: open, exit on right wall
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,1],
      // Row 6: solid wall cluster right
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,7,7,0,0,0,0,0,0,0,7,7,7,1],
      // Row 7: cave block center-left, down-spikes right
      [1,0,0,0,0,7,7,7,0,0,0,0,0,0,0,0,0,3,3,0,0,0,0,0,0,0,3,3,3,1],
      // Row 8: cave block, fruit
      [1,0,0,0,0,0,0,0,0,0,7,0,44,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      // Row 9: cave platforms center and right
      [1,0,0,0,0,0,0,0,0,0,7,7,7,0,0,0,0,0,0,0,7,7,7,0,0,0,0,0,0,1],
      // Row 10: open, fruit right
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,43,0,0,0,1],
      // Row 11: player start left, solid wall right
      [1,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,7,7,0,0,1],
      // Row 12: solid wall left
      [1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      // Row 13: spikes lower left
      [1,0,0,0,0,0,0,2,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      // Row 14: spikes lower center and right
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,2,2,0,0,0,0,0,2,2,0,0,0,0,1],
      // Row 15: solid floor
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    ]
  },
  {
    name: "Depths Below",
    fruitsNeeded: 5,
    maxEcho: 5,
    cols: 30,
    rows: 16,
    map: [
      // Row 0: solid ceiling
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      // Row 1: down-spikes upper left, fruit upper right
      [1,0,0,0,0,0,3,3,3,0,0,0,3,3,0,0,0,0,0,0,41,0,0,0,0,0,0,0,0,1],
      // Row 2: fruit left, solid wall and open right
      [1,0,0,0,41,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,1],
      // Row 3: cave blocks, down-spikes mid-right
      [1,0,0,1,1,0,0,0,0,0,0,1,0,0,0,0,0,0,0,3,3,0,0,1,0,0,0,0,0,1],
      // Row 4: cave blocks mid
      [1,0,0,0,0,0,0,0,0,0,0,7,7,7,7,0,0,0,0,0,0,0,0,1,0,43,0,0,0,1],
      // Row 5: down-spikes mid, spike up center, solid wall cluster right
      [1,0,0,0,0,0,0,0,0,0,0,3,3,3,3,0,0,0,0,0,0,2,0,7,7,7,7,0,0,1],
      // Row 6: open, down-spike right
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0,0,0,0,1],
      // Row 7: open
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      // Row 8: scattered blocks, solid wall right
      [1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,7,7,7,0,0,0,0,0,0,0,1,1,1,1,1],
      // Row 9: down-spikes center, fruit right
      [1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,3,3,3,0,0,0,0,43,0,0,0,0,0,0,1],
      // Row 10: cave blocks, solid wall right-center
      [1,0,0,0,0,0,7,7,7,7,0,0,0,0,0,0,0,0,0,0,7,7,7,0,0,0,0,0,0,1],
      // Row 11: player start left, exit right, down-spike center
      [1,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0,0,0,0,0,6,1],
      // Row 12: solid wall left, fruit center, solid wall right
      [1,1,1,1,0,0,0,0,0,0,0,0,0,0,42,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1],
      // Row 13: cave platforms center
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,7,7,7,0,0,0,0,0,0,0,0,0,0,0,0,1],
      // Row 14: upward spikes spread across
      [1,0,0,0,2,2,2,0,0,0,2,2,2,2,0,0,0,0,2,2,2,0,0,0,2,2,0,0,0,1],
      // Row 15: solid floor
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    ]
  }
];