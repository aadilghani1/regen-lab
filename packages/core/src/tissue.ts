import { indexOf, isInLimbBand, type Lattice } from "./lattice.ts"

export const CellKind = {
  Empty: 0,
  Differentiated: 1,
  Progenitor: 2,
} as const

export type CellKind = (typeof CellKind)[keyof typeof CellKind]

export interface Tissue {
  readonly kind: Uint8Array
  readonly positionalIdentity: Float64Array
  readonly innervated: Uint8Array
  readonly crowdedFor: Uint16Array
}

export const allocateTissue = (lattice: Lattice): Tissue => ({
  kind: new Uint8Array(lattice.size),
  positionalIdentity: new Float64Array(lattice.size),
  innervated: new Uint8Array(lattice.size),
  crowdedFor: new Uint16Array(lattice.size),
})

export const copyTissueInto = (source: Tissue, target: Tissue): Tissue => {
  target.kind.set(source.kind)
  target.positionalIdentity.set(source.positionalIdentity)
  target.innervated.set(source.innervated)
  target.crowdedFor.set(source.crowdedFor)
  return target
}

export const intactIdentityAt = (lattice: Lattice, x: number): number =>
  (x - lattice.bodyWallEnd + 1) / lattice.limbLength

export const createIntactTissue = (lattice: Lattice): Tissue => {
  const tissue = allocateTissue(lattice)
  const limbEnd = lattice.bodyWallEnd + lattice.limbLength
  for (let y = 0; y < lattice.height; y++) {
    for (let x = 0; x < limbEnd; x++) {
      const isBodyWall = x < lattice.bodyWallEnd
      if (!isBodyWall && !isInLimbBand(lattice, y)) continue
      const index = indexOf(lattice, x, y)
      tissue.kind[index] = CellKind.Differentiated
      tissue.positionalIdentity[index] = isBodyWall ? 0 : intactIdentityAt(lattice, x)
    }
  }
  for (let x = 0; x < limbEnd; x++) tissue.innervated[indexOf(lattice, x, lattice.nerveRow)] = 1
  return tissue
}

export const amputateInto = (
  lattice: Lattice,
  tissue: Tissue,
  cutX: number,
  denervate: boolean,
): Tissue => {
  for (let y = 0; y < lattice.height; y++) {
    for (let x = cutX; x < lattice.width; x++) {
      const index = indexOf(lattice, x, y)
      tissue.innervated[index] = 0
      if (!isInLimbBand(lattice, y)) continue
      tissue.kind[index] = CellKind.Empty
      tissue.positionalIdentity[index] = 0
    }
  }
  if (denervate) tissue.innervated.fill(0)
  return tissue
}

export const isOccupied = (tissue: Tissue, index: number): boolean =>
  tissue.kind[index] !== CellKind.Empty

export const limbLengthOf = (lattice: Lattice, tissue: Tissue): number => {
  let length = 0
  for (let x = lattice.bodyWallEnd; x < lattice.width; x++) {
    if (isOccupied(tissue, indexOf(lattice, x, lattice.nerveRow))) length++
  }
  return length
}

export const countProgenitors = (tissue: Tissue): number => {
  let count = 0
  const { kind } = tissue
  for (let index = 0; index < kind.length; index++) if (kind[index] === CellKind.Progenitor) count++
  return count
}

export const markGrowingFaceInto = (
  lattice: Lattice,
  tissue: Tissue,
  face: Uint8Array,
): Uint8Array => {
  face.fill(0)
  for (let y = lattice.bandStart; y < lattice.bandEnd; y++) {
    for (let x = 0; x < lattice.width - 1; x++) {
      const index = indexOf(lattice, x, y)
      if (isOccupied(tissue, index) && !isOccupied(tissue, index + 1)) face[index] = 1
    }
  }
  return face
}
