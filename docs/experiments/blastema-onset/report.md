# First blastema appearance at two cut levels

Research model. Not medical advice.

**Outcome: unresolved.** In this model the first progenitors appeared at step 11 after both mid-limb and distal cuts in all 15 matched pairs. None of the primary studies we screened established the first blastema observation independently for both cut levels. This contrast earns zero prediction credit and stays in the denominator. [Literature screening](../../../literature/notes/cut-level-blastema-onset.md)

The [prediction and scoring rule](hypothesis.md) were committed at `70dba02` before the literature search. All [60 tracked runs](tracked-runs.tar.gz) record clean model commit `2fb26c4c5326e18ac724e11143e66568cd00959f`. Each of the three threshold directories contains four scenarios at seeds 0–4. Onset is the first step in observations.json with progenitors greater than zero.

| Scenario | First observed progenitors | Outcome at step 400 | Runs |
|---|---:|---|---:|
| Mid-limb cut | 11 | Faithful regeneration | 15/15 |
| Distal cut | 11 | Faithful regeneration | 15/15 |
| Denervated | Never observed | No regeneration | 15/15 |
| Termination disabled | 11 | Uncontrolled growth | 15/15 |

The same result held at distal-growth thresholds 0.1, 0.2 and 0.4. A fixed closure step causes identical onset by construction. These runs check the model prediction and its controls. Validation requires a separately observed biological endpoint. First simulated recruitment only approximates first detectable blastema, and model steps have no conversion to days. A1 has primary support for nerve dependence. A2, A3 and A5 are hypotheses.

**Next measurement.** Seek per-limb onset records or dated image series for both cut levels. For a subsequent prediction, first confirm through study metadata or a blinded data inventory that the endpoint and per-group sampling schedule are available, then freeze its direction before opening outcomes.
