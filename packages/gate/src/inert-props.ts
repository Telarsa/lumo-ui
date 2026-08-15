/**
 * The inert-prop gate — a prop that is typed, accepted, and never delivered.
 *
 * Grades SOURCE, not HTML: a dropped prop renders nothing, throws nothing and
 * type-checks. Four postmortems (`isPending`, `preventFocusOnPress`,
 * `isKeyboardDismissDisabled`, `Button`'s inert pair) and zero mechanical checks
 * until this; its first run found 45 violations in 16 files.
 *
 * `gradeSource` follows every locally-declared interface reachable from an
 * exported `*Props` type — the declaring interface need not be exported, since
 * private `*PropsBase` shapes hold most of the defects. The CLI adds a
 * checker-resolved layer for behavioural contracts inherited from
 * `@lumo-ui/core`. Anything the gate cannot place FAILS: a prop nobody can
 * classify is exactly the prop that turns out to be inert.
 *
 * Verdicts: `carrier` (`?: undefined` or a type reduced to `never` —
 * unrepresentable on purpose; NOT `?: never`, which rejects an explicit
 * `undefined` under `exactOptionalPropertyTypes`); `forwarded` (rides a used
 * `...rest` and CLAIMS its destination via `@forwarded <where>`, admissible
 * only where the gate can see a path); `dropped` (everything else). A prop
 * reaching an intrinsic element under a name the DOM does not know is
 * `dom-leak`; `DOM_PROPS` fails CLOSED. Decision record: `docs/decisions/log.md`.
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

/** The verdicts that fail a build. `unverified` and `orphan` fail because this gate fails closed. */
const FAILING: ReadonlySet<Verdict> = new Set<Verdict>([
  "dropped",
  "dom-leak",
  "unverified",
  "orphan",
]);

/**
 * Props an intrinsic element understands, for the `dom-leak` check only. Not
 * React's full DOM prop list: the names Lumo's interfaces declare and legitimately
 * spread. Fails closed — a missing name is a violation, and adding one is a
 * reviewed line. `aria-*`, `data-*` and `on*` are matched by pattern.
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

/** Attributes only an `<a>`/`<area>` understands. Legitimate on a link
 *  component; a leak on anything else, even via an engine's spread. */
const LINK_ONLY_PROPS: ReadonlySet<string> = new Set([
  "hrefLang", "ping", "referrerPolicy", "download",
]);

/** The JSDoc tag that claims a destination for a rest-forwarded prop. */
const FORWARDED_TAG = "forwarded";

interface DeclaredProp {
  name: string;
  iface: string;
  typeText: string;
  line: number;
  forwardedClaim: string | undefined;
  resolvedInherited?: boolean;
  node?: ts.PropertySignature;
}

export interface ResolvedInheritedProp {
  /** Exported local props shape through which the external property is public. */
  iface: string;
  name: string;
  typeText: string;
  /** Line of the local exported shape, used for diagnostics. */
  line: number;
}

/** Grades one component file. Nothing is read from disk, so the self-test can grade a string. */
export function gradeSource(
  path: string,
  text: string,
  inherited: readonly ResolvedInheritedProp[] = [],
): PropViolation[] {
  const sf = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

  /* Every top-level interface / type alias in the file, by name. Only local
   * names are followed: `extends DOMProps` leaves this file's jurisdiction. */
  const local = new Map<string, ts.InterfaceDeclaration | ts.TypeAliasDeclaration>();
  sf.forEachChild((n) => {
    if (ts.isInterfaceDeclaration(n) || ts.isTypeAliasDeclaration(n)) local.set(n.name.text, n);
  });

  const isExported = (n: ts.Node) =>
    (ts.getCombinedModifierFlags(n as ts.Declaration) & ts.ModifierFlags.Export) !== 0;

  /* Roots: exported `*Props` — the export is what makes a prop something a consumer can pass. */
  const roots = [...local.values()].filter((n) => isExported(n) && n.name.text.endsWith("Props"));

  /* The shapes each local type PULLS IN — itself, bases, intersections AND
   * unions: `ItemProps = ItemLinkProps | ItemButtonProps` is delivered by the
   * one function that takes the union, and not following it scored every arm `orphan`. */
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

  /* Which shapes are in scope: everything an exported `*Props` pulls in. */
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
  const ownKeys = new Set(props.map((prop) => `${prop.iface}.${prop.name}`));
  for (const prop of inherited) {
    if (!inScope.has(prop.iface) || ownKeys.has(`${prop.iface}.${prop.name}`)) continue;
    props.push({ ...prop, forwardedClaim: undefined, resolvedInherited: true });
  }
  if (props.length === 0) return [];

  const consumers = findConsumers(sf, local, shapesOf);

  /*
   * Identifiers and string literals, keyed by WHICH component they sit in. A
   * mention counts only for the component it is in (`form.tsx` fixed
   * `elementType` in two components and a file-wide test cleared the third);
   * MODULE scope (`null` key) counts for all. Object-literal property names do
   * not. Matching is by NAME, not symbol — imprecision that can only make the
   * gate quieter, never make it accuse.
   */
  const inPropDecl = (node: ts.Node) => {
    for (let p: ts.Node | undefined = node; p; p = p.parent) if (propNodes.has(p)) return true;
    return false;
  };
  const consumerNodes = new Map<ts.Node, Consumer[]>();
  for (const c of consumers) consumerNodes.set(c.fn, [...(consumerNodes.get(c.fn) ?? []), c]);
  /*
   * Name-matching's honest scope: this catches a prop no identifier of that name
   * touches anywhere in its file. A prop colliding with an unrelated local
   * (`tree.tsx`'s `value`, cleared by a helper body) is OUTSIDE it, which is why
   * that prop is now a `never` carrier. JSX attribute names and parameter names
   * are not evidence and are skipped below.
   */
  const mentions = new Map<ts.Node | null, Set<string>>();
  const mention = (owner: ts.Node | null, name: string) => {
    const set = mentions.get(owner) ?? new Set<string>();
    set.add(name);
    mentions.set(owner, set);
  };
  /*
   * A property accessed on something else is not this component's prop:
   * `barIndexById.size` is `Map.prototype.size` and cleared a dead `size`.
   * `props.size` on a props/rest binding (casts unwrapped) still counts.
   */
  const propsBindings = new Set<string>();
  for (const c of consumers) if (c.restName !== undefined) propsBindings.add(c.restName);
  const isPropsBase = (expression: ts.Expression): boolean => {
    let current = expression;
    while (
      ts.isAsExpression(current) ||
      ts.isParenthesizedExpression(current) ||
      ts.isSatisfiesExpression(current) ||
      ts.isNonNullExpression(current) ||
      ts.isTypeAssertionExpression(current)
    ) current = current.expression;
    return ts.isIdentifier(current) && propsBindings.has(current.text);
  };
  const collect = (n: ts.Node, owner: ts.Node | null) => {
    const here = consumerNodes.has(n) ? n : owner;
    /*
     * A JSX attribute NAME is not a reference to this component's prop:
     * `<Ctx.Provider value={…}>` SETS `value` on another element and cleared a
     * dead `TreeItemProps.value`. The attribute's VALUE is still collected.
     */
    const isJsxAttrName =
      n.parent !== undefined && ts.isJsxAttribute(n.parent) && n.parent.name === n;
    const isObjectPropertyName =
      n.parent !== undefined &&
      (ts.isPropertyAssignment(n.parent) || ts.isMethodDeclaration(n.parent)) &&
      n.parent.name === n;
    /* `.size` on a Map is not delivery, `props.size` is; `props["size"]` likewise. */
    const isForeignPropertyAccessName =
      n.parent !== undefined &&
      ts.isPropertyAccessExpression(n.parent) &&
      n.parent.name === n &&
      !isPropsBase(n.parent.expression);
    const isForeignElementAccessKey =
      n.parent !== undefined &&
      ts.isElementAccessExpression(n.parent) &&
      n.parent.argumentExpression === n &&
      ts.isStringLiteral(n) &&
      !isPropsBase(n.parent.expression);
    /*
     * A declaration is not a reference either: a module-scope helper's PARAMETER
     * named `value` cleared every `value` prop in `tree.tsx`. Destructured props
     * are tracked separately through `bound`.
     */
    if (
      (ts.isIdentifier(n) || ts.isStringLiteral(n)) &&
      !inPropDecl(n) &&
      !isJsxAttrName &&
      !isObjectPropertyName &&
      !isForeignPropertyAccessName &&
      !isForeignElementAccessKey &&
      // PARAMETER names only, not binding elements: a helper's destructure-to-discard is consumption.
      !(ts.isIdentifier(n) && n.parent !== undefined && ts.isParameter(n.parent) && n.parent.name === n) &&
      // A binding name declares where a value goes; `consumer.bound` accounts for it.
      !(
        n.parent !== undefined &&
        ts.isBindingElement(n.parent) &&
        (n.parent.name === n || n.parent.propertyName === n)
      )
    ) {
      mention(here, n.text);
    }
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
 * The `@forwarded <destination>` claim on a prop, if it has one. Read from the
 * raw leading comment, not `ts.getJSDocTags`, because the tag is not one TypeScript knows.
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
  fn: ComponentFn;
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
  /** Any other use of the rest binding — a call argument, an object spread, a JSX attribute VALUE. */
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
 * The local type names a parameter annotation refers to. An INTERSECTION
 * contributes each arm (`props: DateFieldProps<T> & DateBounds<…>`), or every
 * own prop of the file scores the wrong verdict, `orphan` instead of `dropped`.
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
      else {
        const localName = el.name.getText(sf).replace(/^['"]|['"]$/g, "");
        // `prop: _prop` is the explicit spelling for "accepted and discarded", not delivery.
        if (!localName.startsWith("_")) bound.add(key);
      }
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
 * usually wearing here (`{...(rest as unknown as Base.Root.Props)}`), so the
 * violation names the destination instead of "a call this gate cannot follow".
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
  /* A genuine module-scope reference can serve every component in the file. */
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
   * NAMED BY A COMPONENT THAT TAKES IT. One taker is enough, deliberately:
   * `rating.tsx` branches and spreads the whole bag into one of two arms, and
   * demanding every taker name the prop scored ten delivered props as defects.
   */
  const namer = takers.find((c) => c.bound.has(p.name) || mentions.get(c.fn)?.has(p.name) === true);
  if (namer) {
    return { verdict: "used", detail: `named by ${namer.fnName}(${namer.paramType})` };
  }

  /*
   * A mention ANYWHERE else in the file is not delivery, but it makes an
   * `@forwarded` claim ADMISSIBLE (`menu.tsx` lifts `aria-label` onto the popup
   * from a sibling component). A prop named nowhere else cannot be annotated out
   * of `dropped` — that is what keeps the tag from becoming a mute button.
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
     * The ONE destination that clears a prop without a claim: an intrinsic
     * element with a name the DOM knows. A COMPONENT spread is not enough even
     * for a valid DOM name — `role="group"` reached `Accordion.Panel`'s `<div>`
     * and overwrote the `role="region"` the component exists for.
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
    if (
      p.resolvedInherited === true &&
      (c.intrinsicSpreads.length > 0 || c.componentSpreads.length > 0 || c.otherUses > 0)
    ) {
      // The checker proved this property is inherited from the public base and
      // syntax proves the bag crosses the boundary; transport is the strongest
      // claim this gate can make. EXCEPT anchor-only names: Base UI forwards
      // unknowns to the DOM, so `<Tab hrefLang>` served `<button hrefLang>`.
      if (LINK_ONLY_PROPS.has(p.name)) {
        return {
          verdict: "dom-leak",
          detail:
            `${c.fnName}(${c.paramType}) transports \`...${c.restName}\` (onto ` +
            `${c.componentSpreads[0] !== undefined ? `<${c.componentSpreads[0]}>` : "a call or object spread"}) and ` +
            `\`${p.name}\` is an anchor-only attribute inherited from a link base. Base UI forwards ` +
            `unknown props to the element it renders, so on a non-anchor this reaches the DOM as an ` +
            `invalid attribute. Make it a carrier (\`?: undefined\`) or render an anchor.`,
        };
      }
      continue;
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

/** One line per violation, grouped by verdict, in `format`'s shape. */
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
 * Is this type one the CALLER has no choice about? `?: undefined`, or an
 * intersection reduced wholly to `never`. `boolean | never` is boolean; a
 * single optional literal is graded, since it can still request behaviour.
 */
function isCarrier(typeText: string): boolean {
  const parsed = ts.createSourceFile(
    "carrier.ts",
    `type __Carrier = ${typeText};`,
    ts.ScriptTarget.Latest,
    false,
    ts.ScriptKind.TS,
  );
  const alias = parsed.statements.find(ts.isTypeAliasDeclaration);
  if (alias === undefined) return false;

  const unrepresentable = (node: ts.TypeNode): boolean => {
    if (
      node.kind === ts.SyntaxKind.NeverKeyword ||
      node.kind === ts.SyntaxKind.UndefinedKeyword
    ) return true;
    if (ts.isParenthesizedTypeNode(node)) return unrepresentable(node.type);
    // An intersection with `never` has no inhabitant; a union needs every arm to be.
    if (ts.isIntersectionTypeNode(node)) return node.types.some(unrepresentable);
    if (ts.isUnionTypeNode(node)) return node.types.every(unrepresentable);
    return false;
  };

  return unrepresentable(alias.type);
}

function isDomProp(name: string): boolean {
  return DOM_PATTERN.test(name) || DOM_PROPS.has(name);
}

/*
 * THE ROOT CONTRACT — second rule, same file, same parse. Enforces
 * `props.ts`'s "omit what you own, spread the rest" (12 Aug 2026); it shares
 * `gradeSource`'s shape/consumer/rest analysis. Verdicts:
 *   no-ref-story      base is `HTMLAttributes<T>`, which under React 19 carries no `ref`;
 *   undelivered-root  the DOM surface is accepted and no rest delivers it;
 *   unexplained-own   `ref`/`id` subtracted with no comment saying why (owned or widened);
 *   overridable-owned `role`/`aria-*` authored before the rest spread but left in the type.
 * It cannot infer what a component SHOULD also accept; that stays a review.
 */

export interface RootViolation {
  rule: "root-contract";
  /** `<file>:<line>` of the interface declaration. */
  path: string;
  /** The shape, e.g. `CardProps`. */
  shape: string;
  verdict: RootVerdict;
  detail: string;
}

export type RootVerdict =
  | "no-ref-story"
  | "undelivered-root"
  | "unexplained-own"
  | "overridable-owned";

/** `ref` and `id`: the two names a component may own or widen but never simply drop. */
const FLOOR: readonly string[] = ["ref", "id"];

/** `HTMLAttributes` and every element-specific sibling React ships. */
const HTML_ATTRIBUTES = /^(?:React\.)?[A-Za-z]*HTMLAttributes$/;
const COMPONENT_PROPS = /^(?:React\.)?ComponentProps(?:WithRef)?$/;

/** What a heritage clause turns out to be, once `Omit`/`Pick` are unwrapped. */
interface DomBase {
  kind: "component-props" | "html-attributes";
  /** The key literals subtracted by any enclosing `Omit`. */
  omitted: Set<string>;
}

/** Grades one component file against the root contract. Same purity as `gradeSource`. */
export function gradeRootContract(path: string, text: string): RootViolation[] {
  const sf = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

  const local = new Map<string, ts.InterfaceDeclaration | ts.TypeAliasDeclaration>();
  sf.forEachChild((n) => {
    if (ts.isInterfaceDeclaration(n) || ts.isTypeAliasDeclaration(n)) local.set(n.name.text, n);
  });
  const isExported = (n: ts.Node) =>
    (ts.getCombinedModifierFlags(n as ts.Declaration) & ts.ModifierFlags.Export) !== 0;

  /* Same reachability as `gradeSource`: an exported `*Props` and everything it
   * pulls in through `extends` / `&` / `|`, following LOCAL names only. A
   * module-private base is where most of this repository's defects live. */
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

  const inScope = new Set<string>();
  for (const root of [...local.values()].filter(
    (n) => isExported(n) && n.name.text.endsWith("Props"),
  )) {
    for (const s of shapesFor(root.name.text)) inScope.add(s);
  }

  const consumers = findConsumers(sf, local, shapesOf);
  const violations: RootViolation[] = [];

  for (const name of inScope) {
    const decl = local.get(name);
    if (decl === undefined || !ts.isInterfaceDeclaration(decl)) continue;
    const line = sf.getLineAndCharacterOfPosition(decl.getStart(sf)).line + 1;

    for (const clause of decl.heritageClauses ?? []) {
      for (const typeNode of clause.types) {
        const base = domBaseOf(typeNode, sf);
        if (base === undefined) continue;

        if (base.kind === "html-attributes") {
          violations.push({
            rule: "root-contract",
            path: `${path}:${String(line)}`,
            shape: name,
            verdict: "no-ref-story",
            detail:
              `${name} builds its DOM surface out of \`HTMLAttributes\`, which under React 19 ` +
              `does NOT include \`ref\` — so \`<${name.replace(/Props$/, "")} ref={r}>\` does not ` +
              `compile, and whether it does is an accident of which base type this file reached ` +
              `for. Use \`ComponentProps<"tag">\` for the element this component actually ` +
              `renders. See the root contract in \`@lumo-ui/core\`'s props.ts.`,
          });
          continue;
        }

        /* THE FLOOR: `ref`/`id` may be owned or widened, never silently cut. */
        const cut = FLOOR.filter((k) => base.omitted.has(k) && !isExplained(decl, sf, k));
        if (cut.length > 0) {
          violations.push({
            rule: "root-contract",
            path: `${path}:${String(line)}`,
            shape: name,
            verdict: "unexplained-own",
            detail:
              `${name} subtracts ${cut.map((k) => `\`${k}\``).join(" and ")} from its DOM ` +
              `surface with no comment saying why. Those two are the contract's floor: a ` +
              `component may OWN one (it reads or writes it, and a caller's value would ` +
              `replace the component's own — \`TableProps\` is the worked example) or WIDEN ` +
              `it (\`Stack\` renders more than one element), but a bare subtraction is the ` +
              `closed surface the contract exists to stop. Say which, on the line.`,
          });
        }

        /* DELIVERY: a DOM surface no component spreads is 300 accepted attributes going nowhere. */
        const takers = consumers.filter((c) => shapesOf.get(c.paramType)?.has(name) === true);
        if (takers.length === 0) continue; // `orphan` is gradeSource's verdict, not this one.
        const deliverer = takers.find(
          (c) =>
            c.restName !== undefined &&
            (c.intrinsicSpreads.length > 0 || c.componentSpreads.length > 0 || c.otherUses > 0),
        );
        if (deliverer === undefined) {
          const c = takers[0];
          violations.push({
            rule: "root-contract",
            path: `${path}:${String(line)}`,
            shape: name,
            verdict: "undelivered-root",
            detail:
              `${name} inherits the DOM surface of an element — \`id\`, \`ref\`, every ` +
              `\`aria-*\`, every \`data-*\` — and ${c?.fnName ?? "its component"}() ` +
              (c?.restName === undefined
                ? `destructures its props and binds no rest, so all of it is discarded.`
                : `binds \`...${c.restName}\` and never uses it.`) +
              ` A consumer's \`id\` or \`data-testid\` compiles and reaches nothing. Bind a rest ` +
              `and spread it at the root, or Omit what this component owns and say why.`,
          });
        }

        const ownedButInherited = [
          ...new Set(
            takers
              .flatMap((consumer) => semanticAttributesBeforeRest(consumer, sf))
              .filter((attribute) => !base.omitted.has(attribute)),
          ),
        ].sort();
        if (ownedButInherited.length > 0) {
          violations.push({
            rule: "root-contract",
            path: `${path}:${String(line)}`,
            shape: name,
            verdict: "overridable-owned",
            detail:
              `${name} writes ${ownedButInherited.map((key) => `\`${key}\``).join(", ")} ` +
              `before its consumer-prop spread, but does not Omit those attributes from the ` +
              `inherited DOM surface. A caller can overwrite semantics the component claims to ` +
              `own. Omit the attributes and keep the component's authored value authoritative.`,
          });
        }
      }
    }
  }
  return violations;
}

/** Semantic JSX attributes written before the consumer rest spread. */
function semanticAttributesBeforeRest(consumer: Consumer, sf: ts.SourceFile): string[] {
  if (consumer.restName === undefined || !consumer.fn.body) return [];
  const found = new Set<string>();
  const semantic = (name: string) => name === "role" || name.startsWith("aria-");

  const unwrappedIdentifier = (expression: ts.Expression): string | undefined => {
    let current = expression;
    while (
      ts.isAsExpression(current) ||
      ts.isParenthesizedExpression(current) ||
      ts.isSatisfiesExpression(current) ||
      ts.isNonNullExpression(current) ||
      ts.isTypeAssertionExpression(current)
    ) current = current.expression;
    return ts.isIdentifier(current) ? current.text : undefined;
  };

  const objectKeys = (expression: ts.Expression): string[] => {
    if (
      ts.isAsExpression(expression) ||
      ts.isParenthesizedExpression(expression) ||
      ts.isSatisfiesExpression(expression) ||
      ts.isNonNullExpression(expression) ||
      ts.isTypeAssertionExpression(expression)
    ) return objectKeys(expression.expression);
    if (ts.isConditionalExpression(expression)) {
      return [...objectKeys(expression.whenTrue), ...objectKeys(expression.whenFalse)];
    }
    if (!ts.isObjectLiteralExpression(expression)) return [];
    return expression.properties.flatMap((property) => {
      if (
        (ts.isPropertyAssignment(property) ||
          ts.isShorthandPropertyAssignment(property) ||
          ts.isMethodDeclaration(property)) &&
        property.name !== undefined
      ) return [property.name.getText(sf).replace(/^["']|["']$/g, "")];
      return [];
    });
  };

  const visit = (node: ts.Node) => {
    if (ts.isJsxAttributes(node)) {
      const restIndex = node.properties.findIndex(
        (property) =>
          ts.isJsxSpreadAttribute(property) &&
          unwrappedIdentifier(property.expression) === consumer.restName,
      );
      if (restIndex >= 0) {
        for (const property of node.properties.slice(0, restIndex)) {
          if (ts.isJsxAttribute(property)) {
            const name = property.name.getText(sf);
            if (semantic(name)) found.add(name);
          } else {
            for (const name of objectKeys(property.expression)) {
              if (semantic(name)) found.add(name);
            }
          }
        }
      }
    }
    node.forEachChild(visit);
  };
  visit(consumer.fn.body);
  return [...found];
}

/**
 * The DOM base a heritage type resolves to, seeing through `Omit`. Keys are read
 * from a union of string literals; a computed key contributes nothing rather than throwing.
 */
function domBaseOf(node: ts.Node, sf: ts.SourceFile): DomBase | undefined {
  const expr = ts.isExpressionWithTypeArguments(node) ? node : undefined;
  const nameOf = (n: ts.Node): string =>
    expr === n && ts.isExpressionWithTypeArguments(n)
      ? n.expression.getText(sf)
      : ts.isTypeReferenceNode(n)
        ? n.typeName.getText(sf)
        : "";
  const args = ts.isExpressionWithTypeArguments(node)
    ? node.typeArguments
    : ts.isTypeReferenceNode(node)
      ? node.typeArguments
      : undefined;
  const name = nameOf(node);

  if (name === "Omit" && args && args.length === 2 && args[0] && args[1]) {
    const inner = domBaseOf(args[0], sf);
    if (inner === undefined) return undefined;
    for (const key of literalKeys(args[1])) inner.omitted.add(key);
    return inner;
  }
  if (COMPONENT_PROPS.test(name)) return { kind: "component-props", omitted: new Set() };
  if (HTML_ATTRIBUTES.test(name)) return { kind: "html-attributes", omitted: new Set() };
  return undefined;
}

/** The string literals in `"a" | "b"`, flattened. */
function literalKeys(node: ts.TypeNode): string[] {
  if (ts.isUnionTypeNode(node)) return node.types.flatMap(literalKeys);
  if (ts.isParenthesizedTypeNode(node)) return literalKeys(node.type);
  if (ts.isLiteralTypeNode(node) && ts.isStringLiteral(node.literal)) return [node.literal.text];
  return [];
}

/**
 * Was the subtraction of `key` explained where the next reader will meet it?
 * OWNED: a comment anywhere in the heritage span. WIDENED: a comment on the
 * redeclaration. It grades that reasoning was written down, not the reasoning.
 */
function isExplained(decl: ts.InterfaceDeclaration, sf: ts.SourceFile, key: string): boolean {
  const clauses = decl.heritageClauses;
  if (clauses !== undefined && clauses.length > 0) {
    const from = (decl.typeParameters ?? decl.name).end;
    const to = clauses[clauses.length - 1]?.end ?? from;
    const span = sf.text.slice(from, to);
    if (span.includes("/*") || span.includes("//")) return true;
  }
  for (const m of decl.members) {
    if (!ts.isPropertySignature(m) || !m.name) continue;
    if (m.name.getText(sf).replace(/^["']|["']$/g, "") !== key) continue;
    if ((ts.getLeadingCommentRanges(sf.text, m.getFullStart()) ?? []).length > 0) return true;
  }
  return false;
}

/** One line per violation, grouped by verdict — `formatPropViolations`' shape. */
export function formatRootViolations(violations: RootViolation[]): string {
  if (violations.length === 0) return "  lumo-root-contract — clean";
  const byVerdict = new Map<RootVerdict, RootViolation[]>();
  for (const v of violations) byVerdict.set(v.verdict, [...(byVerdict.get(v.verdict) ?? []), v]);
  const lines: string[] = [""];
  for (const [verdict, vs] of byVerdict) {
    lines.push(
      `  root-contract/${verdict} — ${String(vs.length)} violation${vs.length === 1 ? "" : "s"}`,
    );
    for (const v of vs) {
      lines.push(`      ${v.path}  ${v.shape}`);
      lines.push(`        ${v.detail}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}
