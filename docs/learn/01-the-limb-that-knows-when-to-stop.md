---

title: "Lesson 1: The limb that knows when to stop"
module: trigger, termination
scenario: baseline
---

# The limb that knows when to stop

An axolotl can lose a leg and grow back exactly the leg it lost, no more and no less. This lesson walks through the model behind that, one module at a time, and uses the live simulation on this page.

> Research model. Not medical advice. The simulation is a simplification for building intuition.

## 1. Read the picture

Press **Play** and watch the panels.

| Panel                   | Biology                                                                                                   | Dev analogy                                                                  |
| ----------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| **Tissue**              | Grey cells are _differentiated_ (specialized). Pink cells are _progenitors_, the cells of the _blastema_. | Grey are running production services; pink are a temporary autoscaling pool. |
| **Positional identity** | Each cell's encoded location, 0 at the shoulder to 1 at the tip.                                          | An address every cell carries.                                               |
| **Nerve signal**        | Growth-promoting signal released by nerves.                                                               | A health check the autoscaler needs before it scales.                        |

The limb starts intact, is cut halfway, and the stump cells nearest the cut **dedifferentiate** into progenitors: they roll back from a specialized image to a generic one so they can divide.

## 2. The trigger needs nerves

Tick **Remove nerves** and press Play again.

Nothing grows. Without the nerve signal, no blastema forms. This mirrors a classic observation: denervated salamander limbs don't regenerate. In the code, a stump cell only becomes a progenitor if the nerve signal at its position is above a threshold (`formBlastemaInto` in `packages/core/src/cell-rules.ts`).

_Question to sit with:_ mammals have nerves too. So the nerve signal is **necessary** but not **sufficient** for regeneration. What else might be missing?

## 3. Termination is an address check

Untick **Remove nerves**. Now move **Amputation level** to 80% and play.

The limb regrows less, and still ends at exactly the original length. No cell measures the limb. Each new cell placed distally gets its parent's positional identity plus one step, and progenitors stop dividing once they reach identity 1, the tip. Growth fills the gap in addresses between the cut and the tip, then stops. Biologists call this idea _intercalation_.

## 4. Break the stop rule

Untick **Termination** and play.

The limb never stops. That's the outcome class **uncontrolled growth**, and it's why this lab treats termination as a safety requirement (Constitution, Article VI). Any real attempt to switch on regeneration in human tissue must also switch on the stop.

## 5. Confuse the address

Turn termination back on and drag **Extra proximal signal** to about 0.2.

The regenerate ends up too long. Extra proximal signal tells the new progenitors they sit closer to the shoulder than they really do, so they rebuild segments that were never removed. That's a **duplication**, and it mirrors what happens when real salamanders are given excess retinoic acid during regeneration.

## What you just learned

- Regeneration in this model is four modules: **trigger** (wound + nerve → blastema), **progenitor pool** (gated division), **pattern** (positional identity), and **termination** (stop at the tip).
- Each benchmark scenario pins one known observation. Open them from the home page.
- Each rule cites its evidence in `evidence/assumptions.toml`. Rules marked _hypothesis_ are our own modelling choices, waiting to be tested.

**Next step:** run the same experiments from the terminal with `bun run regen run baseline --set model.treatment.denervate=true`. That records a _tracked run_, which is what counts as a result.
