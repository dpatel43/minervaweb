/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

/**
 * Helpers for sorting and filtering nested tree data before it is handed to a
 * MatTreeFlatDataSource. Both return new arrays and node copies; the source
 * tree is never mutated, so the original order can always be restored.
 */

export interface TreeNode<T> {
  children?: T[];
}

/**
 * Keeps nodes that match, plus:
 * - every ancestor of a match (so the match stays in context), and
 * - every descendant of a match (a matching parent shows its whole branch).
 */
export function filterTree<T extends TreeNode<T>>(nodes: T[], matches: (node: T) => boolean): T[] {
  const result: T[] = [];
  for (const node of nodes ?? []) {
    if (matches(node)) {
      result.push(node);
      continue;
    }
    const children = filterTree(node.children ?? [], matches);
    if (children.length > 0) {
      result.push({...node, children});
    }
  }
  return result;
}

/** Marks a node kept only because a descendant matched the filters. */
export interface FilterContext {
  filterContext?: boolean;
}

/**
 * Keeps nodes that match, plus their ancestors so matches stay in context.
 * Ancestors that don't match themselves are copied with `filterContext: true`
 * (shown muted). Unlike filterTree, a matching node does not bring along its
 * non-matching children: with several column filters, those would contradict
 * the other filters.
 */
export function filterTreeMatches<T extends TreeNode<T> & FilterContext>(nodes: T[], matches: (node: T) => boolean): T[] {
  const result: T[] = [];
  for (const node of nodes ?? []) {
    const children = filterTreeMatches(node.children ?? [], matches);
    if (matches(node)) {
      result.push({...node, children, filterContext: false});
    } else if (children.length > 0) {
      result.push({...node, children, filterContext: true});
    }
  }
  return result;
}

/** Tests one cell: the raw value (for comparisons) and the text shown in the cell. */
export type CellTest = (value: unknown, display: string) => boolean;

const NUMBER = String.raw`-?\d[\d,]*(?:\.\d+)?|-?\.\d+`;
const RANGE = new RegExp(String.raw`^(${NUMBER})\s*\.\.\s*(${NUMBER})$`);
const COMPARISON = new RegExp(String.raw`^(>=|<=|<>|!=|>|<|=)\s*(${NUMBER})$`);

/**
 * Parses a column filter box. Returns null for an empty box.
 * - `>0`, `>=1.5`, `<-0.01`, `<=0`, `=0`, `<>0` (or `!=0`): compare the raw number
 * - `0.01..0.05`: inclusive range
 * - anything else: case-insensitive "contains" on the text shown in the cell
 */
export function parseColumnFilter(text: string): CellTest | null {
  const input = (text ?? '').trim();
  if (!input) {
    return null;
  }
  const toNumber = (s: string) => parseFloat(s.replace(/,/g, ''));
  const numeric = (value: unknown): number | null =>
    typeof value === 'number' && !isNaN(value) ? value : null;

  const range = RANGE.exec(input);
  if (range) {
    const [lo, hi] = [toNumber(range[1]), toNumber(range[2])].sort((a, b) => a - b);
    return value => {
      const n = numeric(value);
      return n !== null && n >= lo && n <= hi;
    };
  }

  const comparison = COMPARISON.exec(input);
  if (comparison) {
    const op = comparison[1];
    const target = toNumber(comparison[2]);
    return value => {
      const n = numeric(value);
      if (n === null) {
        return false;
      }
      switch (op) {
        case '>': return n > target;
        case '>=': return n >= target;
        case '<': return n < target;
        case '<=': return n <= target;
        case '=': return n === target;
        default: return n !== target; // <> and !=
      }
    };
  }

  const needle = input.toLowerCase();
  return (_, display) => (display ?? '').toLowerCase().includes(needle);
}

/**
 * Combines the filter boxes of several columns into one row test (all must
 * match). Returns null when every box is empty.
 */
export function buildRowFilter<T>(filters: Record<string, string>,
                                  cell: (node: T, column: string) => { value: unknown; display: string }): ((node: T) => boolean) | null {
  const tests = Object.entries(filters ?? {})
    .map(([column, text]) => ({column, test: parseColumnFilter(text)}))
    .filter((t): t is { column: string; test: CellTest } => t.test !== null);
  if (tests.length === 0) {
    return null;
  }
  return node => tests.every(({column, test}) => {
    const {value, display} = cell(node, column);
    return test(value, display);
  });
}

/** Sorts siblings at every level; the hierarchy itself is kept. */
export function sortTree<T extends TreeNode<T>>(nodes: T[], compare: (a: T, b: T) => number): T[] {
  return [...(nodes ?? [])]
    .sort(compare)
    .map(node => node.children?.length ? {...node, children: sortTree(node.children, compare)} : node);
}

/** Counts every node in a tree. */
export function countTree<T extends TreeNode<T>>(nodes: T[]): number {
  return (nodes ?? []).reduce((sum, n) => sum + 1 + countTree(n.children ?? []), 0);
}

/**
 * Compares two sort values for a table column. Strings compare
 * case-insensitively and numbers numerically. Missing values (null, undefined,
 * NaN) always go last, whichever direction is chosen.
 */
export function compareValues(a: unknown, b: unknown, direction: 'asc' | 'desc'): number {
  const aMissing = a == null || (typeof a === 'number' && isNaN(a));
  const bMissing = b == null || (typeof b === 'number' && isNaN(b));
  if (aMissing || bMissing) {
    return aMissing === bMissing ? 0 : aMissing ? 1 : -1;
  }
  const result = typeof a === 'number' && typeof b === 'number'
    ? a - b
    : String(a).localeCompare(String(b), undefined, {sensitivity: 'base', numeric: true});
  return direction === 'asc' ? result : -result;
}
