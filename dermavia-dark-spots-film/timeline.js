// Every time in the film (seconds). 96 bpm in 3/4: a beat is 0.625 s, a bar 1.875 s.
export const BEAT = 60 / 96;
export const T = {
  DUR: 26.0,
  // 1 · her face at dawn; the hook cut into the sky above her
  hookA: [0.1, 0.8], hookB: [0.8, 1.6], sealX: 1.875, hookOut: [3.75, 4.05],
  sunUp: [1.9, 3.6], rays: [3.0, 4.2],
  boardA: [4.0, 4.4], boardB: [4.4, 4.8], boardOut: [7.0, 7.3],
  // 2 · into her cheek: the spots spread with each pulse of sun; the cause is cut into the spot's ink
  push: [6.6, 7.9], pulse1: 7.9, pulse2: 9.0, cheek: [[8.35, 8.65], [8.65, 9.05], [9.25, 9.55]],
  dive: [11.3, 11.7], silence: [11.55, 11.9], cutP: 11.7, timp: 11.9, carve: [11.9, 12.5],
  // 3 · the pack, as the answer; its ingredients cut into the wall behind it
  tags: [13.125, 13.75, 14.375, 15.0], tagCut: .4, strip: [15.625, 16.1],
  tilt: [18.35, 19.15],
  // 4 · the sky: who and how to order; the seal; the sheet peels to the photo
  endA: [19.15, 19.6], endB: [19.65, 20.05], endC: [20.15, 20.45], sealD: 21.56, peel: [22.4, 22.85],
};
