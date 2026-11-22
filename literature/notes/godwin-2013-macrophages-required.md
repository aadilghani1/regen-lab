# Godwin 2013: Macrophages are required for adult salamander limb regeneration

- Citation (full): Godwin JW, Pinto AR, Rosenthal NA. (2013) Macrophages are required for adult salamander limb regeneration. Proc Natl Acad Sci U S A 110(23):9415-9420.
- DOI / PMID: 10.1073/pnas.1300290110 / PMID 23690624 (PMC3677454)
- Read by / date: AI agent (Claude), 2026-11-23, full text (PMC: abstract, Results, Discussion, Methods summary and figure legends; SI figures and SI Methods not read)
- Organism and system: adult axolotl (*Ambystoma mexicanum*), forelimb amputation, systemic macrophage depletion with clodronate liposomes

## Claim in one sentence

Macrophages enter the axolotl limb within a day of amputation, and depleting them before amputation lets the wound close but blocks blastema formation and leaves a fibrotic scar, a block that is lifted by reamputation once macrophages have returned.

## Evidence

- Pro- and anti-inflammatory cytokines are induced together within 1 day of amputation and return to baseline by 15 days (Results, first section; Fig. 1).
- Myeloid cells, including macrophages, are detectable in the stump from 1 day post-amputation and peak at 4-6 days (Results, "Myeloid Cell Recruitment Is a Major Feature of Limb Regeneration"; Fig. 2A-D).
- In the first week after amputation, depleted limbs show lower MMP9, MMP3, Msx2 and blastema markers Prrx1 and Sp9, failed TGF-beta1 activation, precocious Dlx3 and no activation of the wound epithelial marker WE3 (Results, "Mononuclear Phagocytes Regulate Regenerative Gene Expression Patterns"; Fig. 3B-D).
- Maximal depletion before amputation blocked regeneration in all treated animals (n = 10) while liposome-only controls regenerated (n = 10); stumps carried dense collagen scar still present at 90 days (Results, "Early Macrophage Engagement Is Critical for Limb Regeneration"; Fig. 4B-J).
- Depleted stumps had more collagen I and IV under the wound epithelium and more alpha-SMA-positive myofibroblasts at 20 days (Fig. 5).
- Partial depletion only delayed regeneration, and depletion after the mid-bud blastema had formed delayed but did not block it (n = 5) (Fig. 4A-B legend; Results text).
- Reamputating failed stumps more proximally after macrophages had repopulated gave complete regrowth (n = 6) (Fig. 6).

## Relevance to the model

- `A6-macrophages-required`: **supports** the statement "Macrophages are required for regeneration; depleting them leads to scarring", and **refines** it: the requirement is for early macrophages (around blastema formation), not for macrophages throughout outgrowth.
- Relevant to the trigger module placement of A6: the effect is on the wound-to-blastema transition (failed WE3 activation and failed mesenchymal progenitor activation).

## Caveats

- Timing matters: late depletion delays rather than blocks, and partial depletion only delays. A future macrophage rule should be a gate on blastema formation within a window, not a permanent requirement.
- The failure is not permanent at the tissue level: a new, more proximal amputation regenerates once macrophages return.
- Wound closure still happens without macrophages; the model should not tie wound epidermis formation to macrophages.
- Clodronate liposomes also act on circulating monocytes; the paper reports neutrophils were relatively unaffected, but the SI data behind that were not read.
