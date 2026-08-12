/**
 * The inert-prop gate — a prop that is typed, accepted, and never delivered.
 *
 * This grades SOURCE, not HTML, which is why it lives beside `rules.ts` rather
 * than inside it: every other rule in this package parses prerendered bytes, and
 * the defect this one catches usually produces no bytes at all. A dropped prop
 * renders nothing, throws nothing, and type-checks — the exact signature of every
 * defect in this repository's ledger.
 *
 * ── WHY IT EXISTS ──────────────────────────────────────────────────────────
 *
 * The repository has been bitten four times by one shape and written an
 * excellent postmortem each time: `isPending` and `preventFocusOnPress`
 * (`packages/core/src/props.ts`, now type carriers), `isKeyboardDismissDisabled`
 * (relocated to the part that owns the state), and `Button`'s inert pair. Four
 * postmortems, zero mechanical checks. AUDIT.md §3.2 called it: "accepted-and-
 * unreachable props are a class, not three incidents", and a thirty-line sweep
 * returned 35 candidates in seconds. This file is that sweep, made to fail a
 * build. Its own first run over `packages/ui` and `packages/blocks` was **45
 * violations across 16 files**, every one of them closed in the same change.
 *
 * ── WHAT IT LOOKS AT ───────────────────────────────────────────────────────
 *
 * Only props a component file DECLARES ITSELF: the own property signatures of
 * every locally-declared interface reachable from an exported `*Props` type
 * (through `extends`, intersections and unions, following LOCAL names only). Props
 * inherited from `@lumo-ui/core`'s shared shapes — `DOMProps`, `StyleProps`,
 * `AriaLabelingProps` — are out of scope here and belong to whichever file
 * declares them; `props.ts` is a pure vocabulary module with no components in
 * it, so "unreferenced" is its normal condition and grading it would produce
 * hundreds of meaningless violations.
 *
 * The declaring interface does NOT have to be exported. `NumberFieldPropsBase`,
 * `PopoverPropsBase`, `TreePropsBase`, `DisclosurePanelPropsBase` and
 * `TooltipTriggerPropsBase` are all module-private and hold, between them, most
 * of the defects the audit found. Grading only the exported interface — the
 * literal wording of AUDIT.md §5 item 1.1 — was measured against this tree and
 * finds **16 of the 45** real candidates; the private bases hide the rest.
 *
 * ── THE THREE REASONS A PROP CAN BE UNREFERENCED ───────────────────────────
 *
 * Two are fine and one is the defect, and telling them apart is the whole job:
 *
 *   carrier    `?: undefined` (or a type containing `never`). Deliberately
 *              unrepresentable — the field exists so a consumer's annotation
 *              keeps compiling while passing a value is a compile error. This
 *              is the shape `props.ts` gives `isPending`, and it must never
 *              fire. Spelled `?: undefined` and NOT `?: never`: under this
 *              repo's `exactOptionalPropertyTypes` a `never` field rejects an
 *              explicit `undefined`, which breaks a spread that was correct.
 *              The gate accepts both spellings because seven `& never` sites
 *              still exist (AUDIT §4.2) and this rule is not their owner. A
 *              SINGLE LITERAL (`?: true`) counts too — see `isCarrier`, which
 *              states the `segmented-control.tsx` case that earned it.
 *
 *   forwarded  Captured by a `...rest` that the component actually uses. This
 *              is REAL delivery — `num.tsx` binds `...options` and hands it to
 *              `Intl.NumberFormat`, and with `style="currency" currency="IRR"`
 *              the same number renders «‎ریال ۱٬۲۳۴٫۵» instead of «۱٬۲۳۴٫۵» —
 *              but the destination is outside what a syntactic pass can check,
 *              so it must be CLAIMED: an `@forwarded <destination>` tag in the
 *              prop's own docblock. The claim is not taken on faith. It is
 *              admissible only where the gate can independently see a path —
 *              a rest that carries the prop and is used, or the name being
 *              named elsewhere in the file (`menu.tsx` lifts `<Menu aria-label>`
 *              onto the popup from a sibling component). A prop whose name
 *              appears nowhere else and rides no rest cannot be annotated at
 *              all, which is what stops the tag being a mute button.
 *
 *   dropped    Everything else. The defect.
 *
 * Anything the gate cannot place lands in `dropped`/`orphan`/`unverified` and
 * FAILS. That direction is deliberate: a prop nobody can classify is exactly the
 * prop that turns out to be inert.
 *
 * ── THE ONE DESTINATION THAT CAN BE CHECKED ────────────────────────────────
 *
 * When the rest binding is spread onto an INTRINSIC element — `<span {...rest}>`
 * — the destination is not a mystery: it is the DOM, and the DOM's prop set is
 * finite. `form.tsx` shipped `elementType?: string` on `LabelProps` and
 * `DescriptionProps`, documented it as "the element type to render", never
 * destructured it, and rode it through `...props` onto a real `<label>`. React
 * 19's answer, reproduced with `renderToStaticMarkup` before the fix:
 *
 *     Warning: React does not recognize the `elementType` prop on a DOM element.
 *     <label elementType="div" …>
 *
 * So an unreferenced prop that reaches an intrinsic element under a name the DOM
 * does not know is `dom-leak`, and `@forwarded` cannot rescue it either: the
 * claim would be false. `DOM_PROPS` below is the check, and it fails CLOSED —
 * a name not in the list is a violation, not a pass, so the list growing is a
 * reviewed event rather than a silent widening.
 *
 * ── NO NEW DEPENDENCY ──────────────────────────────────────────────────────
 *
 * `typescript` is already a devDependency of every package in the workspace and
 * of this one. The analysis is purely SYNTACTIC — `createSourceFile`, no
 * `Program`, no checker, no `tsconfig` resolution — which is what makes it grade
 * all 124 component files in 0.4 s of wall clock, and what makes it work on a
 * file that does not currently compile. It is deliberately not a lint rule:
 * `eslint` is not installed here (AUDIT §2.5), and a gate that needs an
 * uninstalled tool is a gate that does not run.
 */

import ts from "typescript";

/** Where a violation was found and what it is. Mirrors `rules.ts`'s `Violation`
 *  in shape so the CLI can print both with one formatter. */
export interface PropViolation {
  /** Always `inert-prop`; kept as a field for symmetry with the HTML rules. */
  rule: "inert-prop";
  /** `<file>:<line>` of the property signature. */
  path: string;
  /** The interface and prop, e.g. `LabelProps.elementType`. */
  prop: string;
  /** Which verdict fired. */
  verdict: Verdict;
  detail: string;
}

export type Verdict =
  /** Named by a component that takes it, or at module scope. Passes. */
  | "used"
  /** `?: undefined` or a `never` type — unrepresentable on purpose. Passes. */
  | "carrier"
  /** Rides a used `...rest`, and says where it lands. Passes. */
  | "forwarded"
  /** Bound by no rest, or by a rest nobody uses. The defect. */
  | "dropped"
  /** Reaches an intrinsic element under a name the DOM does not know. */
  | "dom-leak"
  /** Rides a used `...rest` but does not say where. Fails until annotated. */
  | "unverified"
  /** No function in the file takes this props type at all. */
  | "orphan";

/** The verdicts that fail a build. `unverified` and `orphan` are here because
 *  this gate fails closed: an unclassifiable prop is the one most likely to be
 *  inert, and the annotation that clears it costs one line. */
const FAILING: ReadonlySet<Verdict> = new Set<Verdict>([
  "dropped",
  "dom-leak",
  "unverified",
  "orphan",
]);

/**
 * Props an intrinsic element understands, for the `dom-leak` check only.
 *
 * NOT a complete list of React's DOM props, and not trying to be — it is the set
 * of names that appear as OWN declarations on Lumo's component interfaces and
 * are legitimately spread onto an element. `aria-*`, `data-*` and `on*` are
 * matched by pattern below rather than enumerated.
 *
 * It fails closed on purpose. A name that is missing here produces a violation
 * naming the file and prop, and the fix is either "deliver it" or "add it with
 * the evidence that React accepts it" — a reviewed line either way. The opposite
 * default, passing unknown names, is what let `elementType` reach a `<label>`.
 */
const DOM_PROPS: ReadonlySet<string> = new Set([
  "children", "className", "id", "style", "role", "title", "tabIndex", "hidden",
  "lang", "dir", "slot", "key", "ref", "inert", "translate", "spellCheck",
  "autoFocus", "autoComplete", "autoCapitalize", "draggable", "contentEditable",
  "itemProp", "itemScope", "itemType", "itemID", "itemRef", "accessKey",
  "inputMode", "enterKeyHint", "suppressHydrationWarning",
  // form/inputs
  "name", "value", "defaultValue", "checked", "defaultChecked", "placeholder",
  "disabled", "readOnly", "required", "type", "min", "max", "step", "pattern",
  "maxLength", "minLength", "multiple", "size", "rows", "cols", "form",
  "formAction", "formMethod", "formTarget", "action", "method", "target",
  "htmlFor", "accept", "capture", "list", "wrap",
  // links, media, tables
  "href", "rel", "download", "src", "srcSet", "alt", "loading", "sizes",
  "width", "height", "poster", "controls", "preload", "colSpan", "rowSpan",
  "scope", "headers", "span", "start", "reversed", "open", "label", "selected",
]);

/** `aria-*`, `data-*` and React's event props. Anything else must be in
 *  `DOM_PROPS` or it is a leak. */
const DOM_PATTERN = /^(aria-|data-|on[A-Z])/;

/** The JSDoc tag that claims a destination for a rest-forwarded prop. */
const FORWARDED_TAG = "forwarded";

interface DeclaredProp {
  name: string;
  iface: string;
  typeText: string;
  line: number;
  forwardedClaim: string | undefined;
  node: ts.PropertySignature;
}

/**
 * Grades one component file.
 *
 * `path` is used only for messages; `text` is the source. Nothing is read from
 * disk here so the self-test can grade a string, which is how the four
 * historical props are kept as live fixtures rather than as prose.
 */
export function gradeSource(path: string, text: string): PropViolation[] {
  const sf = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

  /* Every top-level interface / type alias in the file, by name. Only local
   * names are followed: `extends DOMProps` leaves this file's jurisdiction. */
  const local = new Map<string, ts.InterfaceDeclaration | ts.TypeAliasDeclaration>();
  sf.forEachChild((n) => {
    if (ts.isInterfaceDeclaration(n) || ts.isTypeAliasDeclaration(n)) local.set(n.name.text, n);
  });

  const isExported = (n: ts.Node) =>
    (ts.getCombinedModifierFlags(n as ts.Declaration) & ts.ModifierFlags.Export) !== 0;

  /* Roots: exported `*Props`. The export is what makes a prop part of the public
   * surface a consumer can pass — an unexported shape nobody re-exports cannot
   * be the subject of "accepted and dropped", because nothing accepts it. */
  const roots = [...local.values()].filter((n) => isExported(n) && n.name.text.endsWith("Props"));

  /*
   * The shapes each locally-declared type PULLS IN — itself, what it extends,
   * what it intersects, and what it unions.
   *
   * Unions are followed for the same reason bases are: `item.tsx` declares
   * `ItemProps = ItemLinkProps | ItemButtonProps | ItemStaticProps` and one
   * function takes it, so `ItemLinkProps.href` is delivered — or dropped — by
   * that function and by nothing else. Not following unions scored all three
   * arms `orphan`, which is a false accusation, and the discriminated union is
   * this repository's favourite type (`alert.tsx`, `link.tsx`, `rating.tsx`).
   */
  const shapesOf = new Map<string, Set<string>>();
  const shapesFor = (name: string): Set<string> => {
    const cached = shapesOf.get(name);
    if (cached) return cached;
    const out = new Set<string>([name]);
    shapesOf.set(name, out);
    const decl = local.get(name);
    if (decl) {
      for (const nm of heritageNames(decl, sf)) {
        if (!local.has(nm) || out.has(nm)) continue;
        for (const s of shapesFor(nm)) out.add(s);
      }
    }
    return out;
  };
  for (const name of local.keys()) shapesFor(name);

  /* Which shapes are in scope: everything an exported `*Props` pulls in. The
   * export is what makes a prop part of the public surface a consumer can pass;
   * an unexported shape nobody re-exports cannot be "accepted and dropped",
   * because nothing accepts it. */
  const inScope = new Set<string>();
  for (const root of roots) for (const s of shapesFor(root.name.text)) inScope.add(s);

  /* The own property signatures of everything in scope. */
  const props: DeclaredProp[] = [];
  const propNodes = new Set<ts.Node>();
  for (const name of inScope) {
    const decl = local.get(name);
    if (!decl) continue;
    for (const m of membersOf(decl)) {
      if (!ts.isPropertySignature(m) || !m.name) continue;
      propNodes.add(m);
      props.push({
        name: m.name.getText(sf).replace(/^["']|["']$/g, ""),
        iface: name,
        typeText: m.type ? m.type.getText(sf).replace(/\s+/g, " ") : "",
        line: sf.getLineAndCharacterOfPosition(m.getStart(sf)).line + 1,
        forwardedClaim: forwardedClaim(m, text),
        node: m,
      });
    }
  }
  if (props.length === 0) return [];

  const consumers = findConsumers(sf, local, shapesOf);

  /*
   * Identifiers and string literals, keyed by WHICH component they sit in.
   *
   * Scope matters, and the coarse version of this check is a hole. `form.tsx`
   * declares `elementType` on three interfaces; the fix destructures it out of
   * `Label` and `Description`. A file-wide "is this name mentioned anywhere"
   * test would then read that discard as delivery for `FieldError` too — one
   * component's fix silencing another component's identical defect, in the same
   * file, which is the shape of every hand-maintained banner in this repository.
   * So a mention only counts for the component it is in.
   *
   * MODULE scope (`null` key) still counts for everything: a `cva` string, a
   * helper, an `Omit<…, "name">` at the top level really can be about any of
   * them, and guessing which would be a false accusation.
   *
   * Matching is by NAME, not by symbol. A checker would be more precise and
   * would also refuse to run on a file that does not compile, while this gate
   * runs before `gate:test` on trees mid-edit. The imprecision is
   * one-directional: it can only make the gate quieter, never make it accuse.
   */
  const inPropDecl = (node: ts.Node) => {
    for (let p: ts.Node | undefined = node; p; p = p.parent) if (propNodes.has(p)) return true;
    return false;
  };
  const consumerNodes = new Map<ts.Node, Consumer[]>();
  for (const c of consumers) consumerNodes.set(c.fn, [...(consumerNodes.get(c.fn) ?? []), c]);
  const mentions = new Map<ts.Node | null, Set<string>>();
  const mention = (owner: ts.Node | null, name: string) => {
    const set = mentions.get(owner) ?? new Set<string>();
    set.add(name);
    mentions.set(owner, set);
  };
  const collect = (n: ts.Node, owner: ts.Node | null) => {
    const here = consumerNodes.has(n) ? n : owner;
    if ((ts.isIdentifier(n) || ts.isStringLiteral(n)) && !inPropDecl(n)) mention(here, n.text);
    n.forEachChild((c) => { collect(c, here); });
  };
  collect(sf, null);

  const violations: PropViolation[] = [];

  for (const p of props) {
    const verdict = classify(p, mentions, consumers, shapesOf);
    if (!FAILING.has(verdict.verdict)) continue;
    violations.push({
      rule: "inert-prop",
      path: `${path}:${String(p.line)}`,
      prop: `${p.iface}.${p.name}`,
      verdict: verdict.verdict,
      detail: verdict.detail,
    });
  }
  return violations;
}

/** Names of the types a declaration extends / intersects. */
function heritageNames(
  decl: ts.InterfaceDeclaration | ts.TypeAliasDeclaration,
  sf: ts.SourceFile,
): string[] {
  const out: string[] = [];
  if (ts.isInterfaceDeclaration(decl)) {
    for (const h of decl.heritageClauses ?? []) {
      for (const t of h.types) out.push(t.expression.getText(sf));
    }
    return out;
  }
  const visit = (t: ts.TypeNode) => {
    if (ts.isIntersectionTypeNode(t) || ts.isUnionTypeNode(t)) t.types.forEach(visit);
    else if (ts.isParenthesizedTypeNode(t)) visit(t.type);
    else if (ts.isTypeReferenceNode(t)) out.push(t.typeName.getText(sf));
  };
  visit(decl.type);
  return out;
}

/** The property signatures a declaration owns. */
function membersOf(
  decl: ts.InterfaceDeclaration | ts.TypeAliasDeclaration,
): readonly ts.TypeElement[] {
  if (ts.isInterfaceDeclaration(decl)) return decl.members;
  if (ts.isTypeLiteralNode(decl.type)) return decl.type.members;
  if (ts.isIntersectionTypeNode(decl.type)) {
    return decl.type.types.flatMap((t) => (ts.isTypeLiteralNode(t) ? [...t.members] : []));
  }
  return [];
}

/**
 * The `@forwarded <destination>` claim on a prop, if it has one.
 *
 * Read from the raw leading comment text rather than from `ts.getJSDocTags`,
 * because the tag is not one TypeScript knows and an unknown tag inside a
 * `/** … *\/` block is still reachable this way whatever the parser makes of it.
 */
function forwardedClaim(node: ts.PropertySignature, text: string): string | undefined {
  const ranges = ts.getLeadingCommentRanges(text, node.getFullStart()) ?? [];
  for (const r of ranges) {
    const comment = text.slice(r.pos, r.end);
    const m = new RegExp(`@${FORWARDED_TAG}\\s+([^\\n*]+)`).exec(comment);
    if (m?.[1]) return m[1].trim();
  }
  return undefined;
}

/** A function that takes one of the props types, and what it does with the
 *  props it does not name. */
interface Consumer {
  /** The function itself, used to scope "does this component mention the prop". */
  fn: ts.Node;
  /** The props type its parameter is annotated with, verbatim. */
  paramType: string;
  fnName: string;
  /** Names explicitly destructured, including renamed discards. */
  bound: Set<string>;
  /** The rest binding's name, or `undefined` when the pattern has none. */
  restName: string | undefined;
  /** JSX spreads of the rest binding onto intrinsic elements: `<span {...rest}>`. */
  intrinsicSpreads: string[];
  /** JSX spreads onto components: `<BasePopover.Popup {...rest}>`. */
  componentSpreads: string[];
  /** Any other use of the rest binding — a call argument, an object spread, a
   *  JSX attribute VALUE (`explicit={rest}`). Delivery the file cannot vouch
   *  for on its own. */
  otherUses: number;
}

function findConsumers(
  sf: ts.SourceFile,
  local: Map<string, ts.InterfaceDeclaration | ts.TypeAliasDeclaration>,
  shapesOf: Map<string, Set<string>>,
): Consumer[] {
  const consumers: Consumer[] = [];
  const visit = (n: ts.Node) => {
    if (ts.isFunctionDeclaration(n) || ts.isFunctionExpression(n) || ts.isArrowFunction(n)) {
      const param = n.parameters[0];
      const names = param?.type ? paramTypeNames(param.type, sf) : [];
      for (const typeName of names) {
        if (!param || !local.has(typeName) || !shapesOf.has(typeName)) continue;
        consumers.push(consumerFor(n, param, typeName, sf));
      }
    }
    n.forEachChild(visit);
  };
  visit(sf);
  return consumers;
}

/**
 * The local type names a parameter annotation refers to.
 *
 * `TreeProps<T>` → `["TreeProps"]`, and an INTERSECTION contributes each arm:
 * `date-field.tsx` writes `props: DateFieldProps<T> & DateBounds<…>`, and
 * reading only a bare type reference scored all five of its own props `orphan`
 * — "no function takes this shape" — when the truth was the harsher `dropped`.
 * A wrong verdict on a real defect is still a wrong verdict: it sends the reader
 * looking for a missing component instead of a missing prop.
 */
function paramTypeNames(t: ts.TypeNode, sf: ts.SourceFile): string[] {
  if (ts.isTypeReferenceNode(t)) return [t.typeName.getText(sf)];
  if (ts.isIntersectionTypeNode(t)) return t.types.flatMap((x) => paramTypeNames(x, sf));
  if (ts.isParenthesizedTypeNode(t)) return paramTypeNames(t.type, sf);
  return [];
}

type ComponentFn = ts.FunctionDeclaration | ts.FunctionExpression | ts.ArrowFunction;

function consumerFor(
  fn: ComponentFn,
  param: ts.ParameterDeclaration,
  paramType: string,
  sf: ts.SourceFile,
): Consumer {
  const bound = new Set<string>();
  let restName: string | undefined;
  if (ts.isObjectBindingPattern(param.name)) {
    for (const el of param.name.elements) {
      const key = (el.propertyName ?? el.name).getText(sf).replace(/^["']|["']$/g, "");
      if (el.dotDotDotToken) restName = el.name.getText(sf);
      else bound.add(key);
    }
  } else if (ts.isIdentifier(param.name)) {
    /* `function X(props: XProps)` — the whole object is the rest binding. */
    restName = param.name.text;
  }

  const consumer: Consumer = {
    fn,
    paramType,
    fnName: ts.isFunctionDeclaration(fn) && fn.name ? fn.name.text : "<anonymous>",
    bound,
    restName,
    intrinsicSpreads: [],
    componentSpreads: [],
    otherUses: 0,
  };
  if (restName === undefined || !fn.body) return consumer;

  const walk = (n: ts.Node) => {
    if (ts.isIdentifier(n) && n.text === restName && !isDeclarationName(n)) {
      const parent = spreadParent(n);
      if (parent && ts.isJsxSpreadAttribute(parent)) {
        const tag = jsxTagName(parent, sf);
        if (tag === undefined) consumer.otherUses += 1;
        else if (isIntrinsic(tag)) consumer.intrinsicSpreads.push(tag);
        else consumer.componentSpreads.push(tag);
      } else {
        consumer.otherUses += 1;
      }
    }
    n.forEachChild(walk);
  };
  walk(fn.body);
  return consumer;
}

/**
 * The spread this expression belongs to, seeing through the casts a spread is
 * usually wearing in this repository.
 *
 * `{...(rest as unknown as BaseNumberField.Root.Props)}` is the house idiom —
 * `number-field.tsx` alone spreads through a double cast, and `tree.tsx` casts
 * to a hand-written engine subset. Reading only the immediate parent scores
 * every one of those as "a call this gate cannot follow" and would have asked
 * for an `@forwarded` annotation on props that are visibly, spread-onto-the-
 * engine delivered. With the unwrap, the violation for `NumberFieldPropsBase.step`
 * reads "rides `...rest` into <BaseNumberField.Root>" and names the destination
 * the reader has to judge; without it, "a call this gate cannot follow".
 */
function spreadParent(n: ts.Node): ts.Node | undefined {
  let cur: ts.Node | undefined = n.parent;
  while (
    cur &&
    (ts.isAsExpression(cur) ||
      ts.isParenthesizedExpression(cur) ||
      ts.isSatisfiesExpression(cur) ||
      ts.isNonNullExpression(cur) ||
      ts.isTypeAssertionExpression(cur))
  ) {
    cur = cur.parent;
  }
  return cur;
}

function isDeclarationName(n: ts.Identifier): boolean {
  const p = n.parent;
  return !!p && (ts.isBindingElement(p) || ts.isParameter(p)) && (p as { name?: ts.Node }).name === n;
}

function jsxTagName(spread: ts.JsxSpreadAttribute, sf: ts.SourceFile): string | undefined {
  const attrs = spread.parent;
  const el = attrs.parent;
  if (ts.isJsxSelfClosingElement(el) || ts.isJsxOpeningElement(el)) return el.tagName.getText(sf);
  return undefined;
}

/** JSX's own rule: a lowercase, undotted tag is an intrinsic element. */
function isIntrinsic(tag: string): boolean {
  return !tag.includes(".") && /^[a-z]/.test(tag);
}

function classify(
  p: DeclaredProp,
  mentions: Map<ts.Node | null, Set<string>>,
  consumers: Consumer[],
  shapesOf: Map<string, Set<string>>,
): { verdict: Verdict; detail: string } {
  if (isCarrier(p.typeText)) {
    return { verdict: "carrier", detail: "type carrier — unrepresentable on purpose" };
  }
  /* Module scope counts for every component in the file — see `mentions`. */
  if (mentions.get(null)?.has(p.name) === true) {
    return { verdict: "used", detail: "referenced at module scope" };
  }

  /* The functions that must deliver this prop: those whose parameter annotation
   * pulls in the interface that declares it. */
  const takers = consumers.filter((c) => shapesOf.get(c.paramType)?.has(p.iface) === true);
  if (takers.length === 0) {
    return {
      verdict: "orphan",
      detail:
        `no function in this file takes a props type that reaches ${p.iface}, so nothing ` +
        `can deliver this prop. Either wire the shape to its component or delete it.`,
    };
  }

  /*
   * NAMED BY A COMPONENT THAT TAKES IT — how it is then handled is past what a
   * syntactic pass can judge (`attr("min", minValue)`, a rename-discard, a
   * translation, a branch), and naming it is the visible act this gate exists to
   * require. One taker is enough, deliberately:
   *
   * `rating.tsx` is the reason. `Rating(props: RatingProps)` branches on
   * `props.isReadOnly` and spreads the whole bag into `<ReadOnlyRating>` or
   * `<InteractiveRating>`, each of which destructures the arm it owns. Demanding
   * that EVERY taker name the prop scored TEN of `rating.tsx`'s props as
   * defects — `starLabel`, `valueLabel`, `locale`, `onChange`, both arms'
   * `isReadOnly` — every one of them demonstrably delivered two lines away. A gate that cries wolf about a
   * discriminated union, which is this repository's favourite type, is a gate
   * that gets muted.
   *
   * The narrowing this gives up is a file where two components share ONE props
   * type and only one of them delivers. The scoping above still catches the
   * form.tsx shape — three interfaces, one per component — which is where the
   * real incidents have been.
   */
  const namer = takers.find((c) => c.bound.has(p.name) || mentions.get(c.fn)?.has(p.name) === true);
  if (namer) {
    return { verdict: "used", detail: `named by ${namer.fnName}(${namer.paramType})` };
  }

  /*
   * A mention ANYWHERE else in the file — another component, a helper — is not
   * delivery, but it is evidence a claim can rest on.
   *
   * `menu.tsx` is the case that forced this distinction. `MenuProps`'
   * `aria-label` is written on `<Menu>` and lifted onto the popup by a DIFFERENT
   * component in the same file: `MenuPopover` calls
   * `findChildProp(children, "aria-label")`, because `role="menu"` sits on
   * `Menu.Popup`, one level up from the part the caller writes. `Menu` itself
   * destructures three props and binds no rest, so from inside `Menu` this prop
   * is indistinguishable from a dropped one — and the difference is a string
   * literal seventy lines away.
   *
   * So this does NOT pass on its own. It only makes an `@forwarded` claim
   * ADMISSIBLE. A prop whose name appears nowhere else in its file cannot be
   * annotated out of a `dropped` verdict at all, which is the property that
   * keeps the tag from becoming a mute button.
   */
  const mentionedElsewhere = [...mentions.values()].some((set) => set.has(p.name));

  let needsClaim = false;
  for (const c of takers) {
    if (c.restName === undefined) {
      if (mentionedElsewhere && p.forwardedClaim !== undefined) {
        return { verdict: "forwarded", detail: `forwarded — ${p.forwardedClaim}` };
      }
      return {
        verdict: "dropped",
        detail:
          `${c.fnName}(${c.paramType}) destructures its props and binds no rest, so this prop ` +
          `is discarded. Deliver it, relocate it, or make it unrepresentable (\`?: undefined\`).` +
          (mentionedElsewhere
            ? ` Another component in this file does name it — if THAT is the delivery path, say ` +
              `so with \`@${FORWARDED_TAG} <where>\`.`
            : ` The name appears nowhere else in this file, so \`@${FORWARDED_TAG}\` cannot ` +
              `apply: there is no path to claim.`),
      };
    }
    if (
      c.intrinsicSpreads.length === 0 &&
      c.componentSpreads.length === 0 &&
      c.otherUses === 0
    ) {
      return {
        verdict: "dropped",
        detail:
          `${c.fnName}(${c.paramType}) binds \`...${c.restName}\` and never uses it — the prop is ` +
          `accepted and goes nowhere.`,
      };
    }
    /*
     * THE ONE DESTINATION THAT CAN CLEAR A PROP WITHOUT A CLAIM: an intrinsic
     * element, and only an intrinsic element. `<div {...rest}>` with a name the
     * DOM knows is delivery, full stop — `id`, `children`, `onClick`, `aria-*`.
     *
     * A COMPONENT spread is deliberately not enough, even for a name that is a
     * valid DOM attribute, and `disclosure.tsx` is the measured reason:
     * `role="group"` is a real DOM attribute, it arrived intact on
     * `Accordion.Panel`'s `<div>`, and what it did there was overwrite the
     * `role="region"` the component exists for. "The DOM accepts this name" and
     * "this component should accept this name" are different questions, and only
     * the first is answerable from syntax.
     */
    if (
      c.componentSpreads.length === 0 &&
      c.otherUses === 0 &&
      c.intrinsicSpreads.length > 0 &&
      isDomProp(p.name)
    ) {
      continue;
    }
    const leaking = c.intrinsicSpreads.filter(() => !isDomProp(p.name));
    if (leaking.length > 0) {
      return {
        verdict: "dom-leak",
        detail:
          `${c.fnName}(${c.paramType}) spreads \`...${c.restName}\` onto <${leaking[0] ?? "?"}>, and ` +
          `\`${p.name}\` is not a DOM prop — React 19 warns and emits it as a literal attribute. ` +
          `Destructure it out, translate it, or make it unrepresentable.`,
      };
    }
    needsClaim = true;
  }

  if (!needsClaim) return { verdict: "used", detail: "delivered by every component that takes it" };
  if (p.forwardedClaim !== undefined) {
    return { verdict: "forwarded", detail: `forwarded — ${p.forwardedClaim}` };
  }
  const c = takers.find((t) => t.restName !== undefined);
  const dest =
    c && c.componentSpreads.length > 0
      ? `<${c.componentSpreads[0] ?? "?"}>`
      : "a call this gate cannot follow";
  return {
    verdict: "unverified",
    detail:
      `rides \`...${c?.restName ?? "rest"}\` into ${dest}. That may be real delivery, but a ` +
      `spread does not prove the destination knows the name — Base UI forwards what it does not ` +
      `recognise straight to the DOM. Add \`@${FORWARDED_TAG} <destination>\` to its docblock ` +
      `with the evidence, or deliver it explicitly.`,
  };
}

/** One line per violation, grouped by verdict, in `format`'s shape so the two
 *  gates read alike in a build log. */
export function formatPropViolations(violations: PropViolation[]): string {
  if (violations.length === 0) return "  lumo-inert-props — clean";
  const byVerdict = new Map<Verdict, PropViolation[]>();
  for (const v of violations) byVerdict.set(v.verdict, [...(byVerdict.get(v.verdict) ?? []), v]);
  const lines: string[] = [""];
  for (const [verdict, vs] of byVerdict) {
    lines.push(`  inert-prop/${verdict} — ${String(vs.length)} violation${vs.length === 1 ? "" : "s"}`);
    for (const v of vs) {
      lines.push(`      ${v.path}  ${v.prop}`);
      lines.push(`        ${v.detail}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

/**
 * Is this type one the CALLER has no choice about?
 *
 * Three shapes, and all three mean "you cannot ask for behaviour that does not
 * exist", which is the property this gate is really enforcing:
 *
 *   `?: undefined`     the type carrier. `props.ts`'s `isPending`.
 *   `… never …`        the older spelling of the same idea; seven sites remain
 *                      (AUDIT §4.2) and this rule is not their owner.
 *   `?: true`          a single literal, optionally with `| undefined`. The
 *                      value it admits is the behaviour the component already
 *                      has, so passing it changes nothing and passing anything
 *                      ELSE is a compile error.
 *
 * The third exists because `segmented-control.tsx` got there first and got it
 * right: `disallowEmptySelection?: true | undefined`, with a docblock saying
 * Base UI's `RadioGroup` has no path to an empty selection, so `true` is what
 * the component does and `false` *"cannot be honoured: there is no un-check to
 * allow"*. Scoring that `dropped` would have pushed a correct API toward either
 * a lie or a needless break. A single literal is also how this repository writes
 * a discriminated-union tag (`isReadOnly: true` in `rating.tsx`), and a
 * discriminant is consumed by the branch, not by the arm.
 */
function isCarrier(typeText: string): boolean {
  if (typeText === "undefined" || /\bnever\b/.test(typeText)) return true;
  const arms = typeText.split("|").map((s) => s.trim()).filter((s) => s !== "undefined");
  return arms.length === 1 && /^(true|false|-?\d+(\.\d+)?|"[^"]*"|'[^']*')$/.test(arms[0] ?? "");
}

function isDomProp(name: string): boolean {
  return DOM_PATTERN.test(name) || DOM_PROPS.has(name);
}
