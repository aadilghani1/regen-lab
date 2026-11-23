# Regeneration Lab

An in-silico research lab that models salamander-style limb regeneration to work out what a regeneration program would need in order to run in human tissue. It doubles as a learning environment for people coming to the biology from software.

## Tissue and cells

**Stump**:
The tissue left behind after an amputation, up to the cut.
_Avoid_: remnant, base

**Wound epidermis**:
The thin layer of skin cells that covers the cut surface within hours of amputation.
_Avoid_: wound skin, scab

**AEC (apical epithelial cap)**:
The signalling centre the wound epidermis becomes once it thickens at the tip; it drives outgrowth of the blastema.
_Avoid_: using "wound epidermis" and "AEC" interchangeably

**Blastema**:
The mass of progenitors that forms beneath the AEC and grows into the missing structure. A blastema is a structure, not a cell.
_Avoid_: regeneration bud, "blastema cell" (say progenitor)

**Progenitor**:
A cell in the blastema that has left its specialized state and can divide and re-specialize.
_Avoid_: stem cell (different meaning), blastema cell

**Differentiated cell**:
A cell specialized into a tissue type (muscle, cartilage, skin, connective tissue).
_Avoid_: mature cell

**Regenerate**:
The structure regrown distal to the cut (noun).
_Avoid_: new limb, regrowth (as a noun)

## Signals

Signals are named by the role they play, not by molecule; the evidence registry maps each role to its candidate molecules.

**Nerve signal**:
Growth-promoting signalling supplied by nerves in the stump, required for a blastema to form and grow.
_Avoid_: nerve factor, naming a specific molecule

**Distal growth signal**:
Signalling from the AEC that drives outgrowth of the blastema.
_Avoid_: AEC signal, FGF

**Proximal signal**:
Signalling that marks positions near the shoulder; excess of it causes proximalization.
_Avoid_: RA, retinoic acid (one candidate molecule, not the role)

## Patterning

**Positional identity**:
A cell's encoded location along the limb axis, from 0 (shoulder) to 1 (tip).
_Avoid_: identity (alone), position, address

**Proximalization**:
A shift of progenitors' positional identity toward the shoulder, so the regenerate rebuilds structures that were never removed.

**Termination**:
The end of outgrowth once the regenerate reaches the distal positional identity.
_Avoid_: stopping, growth arrest

## Outcomes

Every run ends in exactly one outcome.

**Faithful regeneration**:
The regenerate reaches the target length within 5%, has nondecreasing nerve-row positional identity, exhausts its progenitors and shows no recent length increase.

**Incomplete regeneration**:
A blastema formed, but the regenerate fell short of the target length or failed the completion criteria within the target range.

**No regeneration**:
No blastema formed.

**Duplication**:
Outgrowth terminated but rebuilt proximal structure that was never removed, typically after proximalization.
_Avoid_: overgrowth

**Uncontrolled growth**:
Outgrowth never terminated; the central safety failure.
_Avoid_: overgrowth, tumour (the model does not represent cancer)

## Research process

**Module**:
One of four parts of the regeneration control system: trigger, progenitor pool, pattern, termination.

**Benchmark**:
A known experimental observation that the model must reproduce, such as denervation blocking regeneration.
_Avoid_: test case (a benchmark is a claim about biology, not just a test)

**Assumption**:
A single model rule, paired with its evidence status (`supported` or `hypothesis`) and its citations.

**Tracked run**:
A simulation run recorded with its exact configuration, code version and seed, so anyone can reproduce it. Only tracked runs count as results.

**Exploration**:
An untracked run, such as one driven live in the browser, used to build intuition; never cited as a result.
_Avoid_: experiment (reserve for tracked, hypothesis-driven work)

**Calibration**:
A cited mapping from model units (steps, cells) to real units (days, micrometres).

**In silico / in vitro / in vivo**:
In a computer / in a dish / in a living organism. This lab works only in silico.
