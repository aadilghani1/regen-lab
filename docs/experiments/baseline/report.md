# Termination and pattern in the five baseline benchmarks

Research model. Not medical advice.

In this model, under the registered assumptions, all five catalog outcomes held across seeds 0–4. Both untreated cuts regrew to 80 lattice columns with ordered nerve-row identity, exhausted their progenitors, and showed no length increase in the final 50 steps. The distal cut completed earlier on every seed. [Prediction](hypothesis.md)

Model commit `3841bbccd1f28911365a56d69d0c80f4168ad469`. The [tracked runs](tracked-runs.tar.gz) contain the 25 catalog runs in `baseline-report/catalog/`, 15 additional baseline runs in the three `threshold-*` folders, and the sweep JSON in `sweeps/`. Each run includes the resolved configuration, seed, runtime, code commit, summary and observation history. The five default baseline runs also serve as the 0.2 threshold group.

## Results at step 400

Each row covers five seeds. Positional error is mean absolute error along the nerve row over the overlap with the intact limb, rounded to three decimals. It excludes the portion extending beyond the original tip.

| Scenario | Outcome in all five runs | Final length (columns) | Positional error | Length increased in final 50 steps | Progenitor exhaustion (step) |
|---|---|---:|---:|---:|---|
| Baseline | Faithful | 80 | 0.000 | 0/5 | 245–354 |
| Distal cut | Faithful | 80 | 0.000 | 0/5 | 128–216 |
| Denervated | No regeneration | 40 | 0.000 | 0/5 | No blastema |
| Proximal excess | Duplication | 100 | 0.131 | 0/5 | 310–385 in 3/5 |
| No termination | Uncontrolled growth | 118–136 | 0.000 | 5/5 | None |

Proximal excess exposes a distinction within the existing duplication benchmark. All five runs overshot and reached a length plateau. Seeds 3 and 4 still had progenitors at step 400. The duplication label alone therefore cannot establish that all progenitors exhausted.

## Sensitivity to the distal-growth threshold

At thresholds 0.1, 0.2 and 0.4, all 15 baseline outcomes were faithful, reached length 80, and had positional error below 0.001. Progenitor exhaustion ranged from steps 245–354 at 0.1 and 0.2, and 245–362 at 0.4. At threshold 2 all five outcomes were incomplete, with lengths 53–57, positional error below 0.001, continued length increase, and progenitors remaining. The twofold sensitivity prediction held on these seeds. The finite observation window leaves eventual completion at threshold 2 open.

## Evidence and limits

| Rule | Status in the model | Evidence qualification |
|---|---|---|
| A1, nerve dependence | Supported | Kumar verified in adult newt. A common gate for initiation and outgrowth simplifies timing. Singer unverified. |
| A2, distal signal threshold | Hypothesis | The Endo abstract describes positional disparity and sustained outgrowth. It does not establish this threshold. |
| A3, local recruitment depth | Hypothesis | The Kragl abstract supports lineage restriction. The fixed recruitment depth remains unverified. |
| A4, proximalization | Supported | Maden citation unverified. The published observation and the model's signal and timing assumptions are distinct. |
| A5, scalar termination | Hypothesis | The target tolerance, order check, progenitor exhaustion, and recent-growth window define model completion. |
| A7, shared positional shift | Hypothesis | The model applies one shared shift across the blastema. |

A6, macrophage dependence, is registered but absent from this simulation. The five seeds and four thresholds sample one sensitivity axis. Nerve-row order measures one spatial axis. Model steps and lengths have no tissue calibration.

## Next question

Can the pattern module distinguish blastema initiation from sustained patterned outgrowth when opposing positional identities are present? Record initiation, expansion and termination as separate endpoints for M1.
