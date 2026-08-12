# `fixtures/inert-props/` — poison for the source gate

The `.bad.html` files two directories up are the HTML rules' poison, one per
rule, and the self-test asserts that set matches `RULES` exactly. These are a
different medium — component SOURCE — so they live here, where they cannot look
like an orphaned HTML rule.

**One file per failing verdict, and the poison is the repository's own history.**
`dropped.bad.tsx` is the four props this project has already written postmortems
about, restored to the shape they shipped in:

| prop | where it really happened |
| --- | --- |
| `isPending` | `Button` — rendered no busy affordance, announced nothing, errored never |
| `preventFocusOnPress` | `Button` — React Aria's press layer, gone with the engine |
| `isKeyboardDismissDisabled` | the overlay SURFACES, when the state lives on the trigger |
| `elementType` | `form.tsx` — and this one leaked `<label elementType="div">` into served HTML |

Each is now fixed in the library, so none of them can fail a build any more —
which is exactly why they are copied here. A gate whose evidence is only the
defects it currently finds stops having evidence the moment it is green.

`good.tsx` holds the three legitimate reasons a prop is unreferenced — a
`?: undefined` carrier, a `(T & never)` carrier, a single-literal no-op, and a
`@forwarded`-annotated rest ride — and must stay clean. It is the half that
catches the opposite failure: a gate tightened until it accuses correct code gets
switched off, not fixed.

`mute-attempt.bad.tsx` is the adversarial one. It puts an `@forwarded` tag on a
prop that is simply dropped, with the name appearing nowhere else in the file,
and asserts the tag does NOT rescue it. Without that test the annotation is a
mute button and the gate is decoration with extra steps.
