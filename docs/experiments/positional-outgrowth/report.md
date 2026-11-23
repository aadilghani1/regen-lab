# Positional diversity separates initiation from sustained outgrowth in the model

Research model. Not medical advice.

In this model, both tissue compositions recruited 23 progenitors on every seed. With both identities present, the regenerate replaced all 40 missing columns and terminated. Anterior-only tissue added 0–3 columns at the default threshold and retained progenitors at step 400. All five paired runs met the [prediction](hypothesis.md).

Model commit `2fb26c4c5326e18ac724e11143e66568cd00959f`. The [20 tracked runs](tracked-runs.tar.gz) contain the five-seed comparisons under `paired/` and sensitivity runs under `threshold-0.1/` and `threshold-0.4/`. Each group uses seeds 0–4. The table gives the range across seeds.

| Positional tissue | Distal threshold | Regrown columns | Progenitors at step 400 | Faithful endpoints |
|---|---:|---:|---:|---:|
| Both | 0.2 | 40 | 0 | 5/5 |
| Anterior only | 0.2 | 0–3 | 8–10 | 0/5 |
| Anterior only | 0.1 | 0–3 | 8–12 | 0/5 |
| Anterior only | 0.4 | 0–2 | 7–8 | 0/5 |

No run increased in length in the final 50 steps. Only the paired-tissue runs met the ordered-identity and progenitor-exhaustion criteria together. The remaining progenitors in the anterior-only arm expose a limitation: the model can stall but has no mechanism for the blastema regression described in the primary study.

## Interpretation

A1 has verified primary evidence for nerve dependence. A2 (distal signal), A3 (local recruitment), A5 (scalar termination) and A8 (continued signalling from both positional identities) are hypotheses. A8 represents tissue composition with a scenario setting. It cannot resolve spatial interactions within the blastema. The timing of signal withdrawal is an assumption, and the threshold values and step count have no biological calibration. [Literature note](../../../literature/notes/nacu-2016-positional-interactions.md)

The source observation informed the rule, so this contrast is excluded from the north-star numerator and denominator. The next experiment should register a distinct tissue contrast and its expected direction before inspecting the withheld endpoint. A lateral wound will also need its own geometry and length measure before it can serve as an accessory-limb benchmark.
