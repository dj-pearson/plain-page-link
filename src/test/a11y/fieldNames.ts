/**
 * US-261: a static check that every form field in a source file has an
 * accessible name. It parses TSX with the TypeScript compiler (no rendering),
 * so it can walk whole directories of pages cheaply. It is deliberately
 * conservative in what it accepts as a name:
 *
 *   - aria-label / aria-labelledby on the field itself
 *   - an id that some htmlFor in the same file points at (compared as source
 *     text, so `id={`x-${i}`}` matches `htmlFor={`x-${i}`}`)
 *   - a <label>/<Label> ancestor (implicit labelling)
 *   - a shadcn <FormControl> ancestor, which injects the id its <FormLabel>
 *     points at
 *   - type="hidden" (not in the accessibility tree), or a `hidden` class
 *     (display:none — e.g. a file input opened by a visible button)
 *
 * A placeholder is not a name: it disappears on input and voice-control users
 * cannot target it reliably.
 */
import ts from 'typescript';

/** Elements that need a name. SelectTrigger is the Radix combobox button. */
const FIELD_TAGS = new Set(['input', 'textarea', 'select', 'Input', 'Textarea', 'SelectTrigger']);
const LABEL_TAGS = new Set(['label', 'Label']);
/** Inputs that are buttons; their visible value is their name. */
const BUTTON_TYPES = new Set(['hidden', 'submit', 'button', 'reset', 'image']);

export interface UnnamedField {
  tag: string;
  line: number;
  text: string;
}

function attrMap(
  attrs: ts.JsxAttributes,
  sf: ts.SourceFile
): Map<string, { text: string; literal?: string }> {
  const map = new Map<string, { text: string; literal?: string }>();
  for (const prop of attrs.properties) {
    if (!ts.isJsxAttribute(prop)) continue;
    const name = prop.name.getText(sf);
    const init = prop.initializer;
    if (!init) {
      map.set(name, { text: 'true' });
    } else if (ts.isStringLiteral(init)) {
      map.set(name, { text: JSON.stringify(init.text), literal: init.text });
    } else if (ts.isJsxExpression(init) && init.expression) {
      const expr = init.expression;
      const literal =
        ts.isStringLiteral(expr) || ts.isNoSubstitutionTemplateLiteral(expr)
          ? expr.text
          : undefined;
      map.set(name, {
        text: literal !== undefined ? JSON.stringify(literal) : expr.getText(sf),
        literal,
      });
    }
  }
  return map;
}

function tagName(node: ts.JsxOpeningLikeElement, sf: ts.SourceFile): string {
  return node.tagName.getText(sf);
}

export function findUnnamedFields(source: string, fileName = 'file.tsx'): UnnamedField[] {
  const sf = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

  // Every htmlFor in the file, as normalised source text.
  const htmlFors = new Set<string>();
  const collect = (node: ts.Node) => {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const attrs = attrMap(node.attributes, sf);
      const htmlFor = attrs.get('htmlFor');
      if (htmlFor) htmlFors.add(htmlFor.text);
    }
    ts.forEachChild(node, collect);
  };
  collect(sf);

  const problems: UnnamedField[] = [];
  const visit = (node: ts.Node, ancestors: string[]) => {
    let next = ancestors;
    if (ts.isJsxElement(node)) {
      const tag = tagName(node.openingElement, sf);
      check(node.openingElement, tag, ancestors);
      next = [...ancestors, tag];
    } else if (ts.isJsxSelfClosingElement(node)) {
      check(node, tagName(node, sf), ancestors);
    }
    ts.forEachChild(node, (child) => visit(child, next));
  };

  const check = (node: ts.JsxOpeningLikeElement, tag: string, ancestors: string[]) => {
    if (!FIELD_TAGS.has(tag)) return;
    const attrs = attrMap(node.attributes, sf);
    const type = attrs.get('type')?.literal;
    if (type && BUTTON_TYPES.has(type)) return;
    if (attrs.has('aria-label') || attrs.has('aria-labelledby')) return;
    const id = attrs.get('id');
    if (id && htmlFors.has(id.text)) return;
    if (ancestors.some((a) => LABEL_TAGS.has(a) || a === 'FormControl')) return;
    const className = attrs.get('className')?.literal;
    if (className && /(^|\s)hidden(\s|$)/.test(className)) return;

    const { line } = sf.getLineAndCharacterOfPosition(node.getStart(sf));
    problems.push({
      tag,
      line: line + 1,
      text: node.getText(sf).replace(/\s+/g, ' ').slice(0, 120),
    });
  };

  visit(sf, []);
  return problems;
}
