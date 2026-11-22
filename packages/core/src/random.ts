export interface RandomSource {
  readonly uniform: (step: number, stream: RandomStream, index: number) => number
}

export const RandomStream = {
  ProgenitorOrder: 1,
  LateralChoice: 2,
  Division: 3,
} as const

export type RandomStream = (typeof RandomStream)[keyof typeof RandomStream]

const TWO_POW_32 = 4294967296

const avalanche = (value: number): number => {
  let h = value >>> 0
  h ^= h >>> 16
  h = Math.imul(h, 0x7feb352d)
  h ^= h >>> 15
  h = Math.imul(h, 0x846ca68b)
  h ^= h >>> 16
  return h >>> 0
}

export const counterRandom = (seed: number): RandomSource => {
  const seeded = avalanche(seed ^ 0x9e3779b9)
  return {
    uniform: (step, stream, index) =>
      avalanche(avalanche(avalanche(seeded ^ step) ^ Math.imul(stream, 0x85ebca6b)) ^ index) /
      TWO_POW_32,
  }
}
