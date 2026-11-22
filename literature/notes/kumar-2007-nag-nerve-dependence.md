# Kumar 2007: Molecular basis for the nerve dependence of limb regeneration

- Citation (full): Kumar A, Godwin JW, Gates PB, Garza-Garcia AA, Brockes JP. (2007) Molecular basis for the nerve dependence of limb regeneration in an adult vertebrate. Science 318(5851):772-777.
- DOI / PMID: 10.1126/science.1147710 / PMID 17975060 (author manuscript PMC2696928)
- Read by / date: AI agent (Claude), 2026-11-23, full text (PMC author manuscript: abstract, Results, Discussion and figure legends; supplementary material not read)
- Organism and system: adult newt, forelimb amputation with unilateral denervation at the brachial plexus; cultured newt blastemal cells

## Claim in one sentence

The secreted protein nAG, a ligand for the proximodistal-identity protein Prod 1, is made by the nerve sheath and then the wound epidermis in a nerve-dependent way, and expressing it locally is enough to rescue regeneration of a denervated limb.

## Evidence

- nAG binds Prod 1 in a yeast two-hybrid screen, a pull-down assay and a cell-surface binding assay (Results, "Identification of nAG protein as a ligand of Prod 1"; Fig. 1A-E).
- After amputation nAG appears first in Schwann cells of the distal nerve sheath (day 5) and later in glands of the wound epidermis (after day 10) (Results, "Nerve-dependent expression in regeneration"; Fig. 2A-C).
- Denervation abolishes nAG in both the nerve sheath (day 8) and the wound epidermis (day 13) compared with the innervated contralateral limb, which is the internal control (Fig. 3A-D).
- Denervated limbs electroporated with empty vector failed to regenerate in all animals; with an nAG plasmid, about half of the animals across batches regenerated to the digit stage by day 30-40 (Results, "Activities of nAG on the denervated blastema"; Fig. 4D-E).
- Rescued limbs had few nerve profiles and less muscle than innervated controls, so nAG did not act by speeding nerve regrowth and did not replace the nerve's support of muscle (Fig. 5A-D).
- nAG-conditioned medium raised S-phase entry of cultured blastemal cells about 8-fold over control medium (Results, "nAG acts as a growth factor for cultured blastemal cells"; Fig. 6B-C).

## Relevance to the model

- `A1-nerve-dependence`: **supports** the statement that denervated limbs do not regenerate (vector controls in Fig. 4E) and **refines** it by naming a nerve-dependent factor that can stand in for the nerve signal, which is what `model.signals.nerve.production` abstracts.
- Also touches `A2-distal-growth-signal`: the wound epidermis expresses nAG only when the limb is innervated, so in this paper the epidermal signal is downstream of the nerve rather than independent of it.

## Caveats

- The introduction (citing earlier work) says the first cohort of blastemal cells can form in a denervated limb, and that denervation after the mid-bud stage still allows a regenerate. The model's single nerve threshold gating both blastema formation and outgrowth is coarser: the real dependence is on proliferation, and only during an early window.
- Rescue was partial (about half of animals, some slower, some none) and rescued limbs were small with little muscle.
- Organism is the adult newt, not the axolotl.
- nAG is proposed to act through Prod 1, a proximodistal identity determinant, linking growth and patterning; the model keeps these as separate signals.
