// Every time in the film (seconds). 84 bpm in 3/4: a beat is 0.714 s, a bar 2.143 s.
export const BEAT = 60 / 84;
export const T = {
  DUR: 26.0,
  // 1 · night sky, the hook cut into it
  hookA: [0.15, 0.95], hookB: [0.95, 1.8], sealX: 2.143,
  // 2 · dawn over the rooftops, the woman, the board
  tilt: 3.5, dawn: [3.6, 7.6], sunUp: 5.0, door: 4.85, walk: [5.0, 6.2], shade: 6.6,
  boardA: [5.3, 5.75], boardB: [5.75, 6.2],
  ray: [7.0, 7.6], whiteIn: 7.85, cut1: 8.1, whiteOut: 8.35,
  // 3 · the skin
  pulse1: 9.5, pulse2: 10.7, stone: [[11.0, 11.3], [11.25, 11.6], [11.6, 11.95]], musicStop: 13.6, arch: 13.75, timp: 14.0, cut2: 14.22,
  // 4 · the shelf
  settle: 15.0, tiles: [15.43, 16.14, 16.86, 17.57], tileCut: .42, strip: [18.29, 18.79],
  rise: 20.9, whiteIn2: 20.95, cut3: 21.15, whiteOut2: 21.4,
  // 5 · back over the city by day
  endA: [21.45, 21.9], endB: [21.95, 22.4], endC: [22.45, 22.75], sealD: 24.0, peel: [24.7, 25.1],
};
