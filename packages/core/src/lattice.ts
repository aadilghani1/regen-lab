import type { LatticeParameters } from "./parameters.ts"

export interface Lattice {
  readonly width: number
  readonly height: number
  readonly size: number
  readonly bandStart: number
  readonly bandEnd: number
  readonly nerveRow: number
  readonly bodyWallEnd: number
  readonly limbLength: number
}

export const createLattice = (parameters: LatticeParameters): Lattice => {
  const bandStart = Math.floor(parameters.height / 2) - Math.floor(parameters.limbWidth / 2)
  return {
    width: parameters.width,
    height: parameters.height,
    size: parameters.width * parameters.height,
    bandStart,
    bandEnd: bandStart + parameters.limbWidth,
    nerveRow: Math.floor(parameters.height / 2),
    bodyWallEnd: parameters.bodyWallEnd,
    limbLength: parameters.limbLength,
  }
}

export const indexOf = (lattice: Lattice, x: number, y: number): number => y * lattice.width + x

export const columnOf = (lattice: Lattice, index: number): number => index % lattice.width

export const rowOf = (lattice: Lattice, index: number): number => Math.floor(index / lattice.width)

export const isInLimbBand = (lattice: Lattice, y: number): boolean =>
  y >= lattice.bandStart && y < lattice.bandEnd
