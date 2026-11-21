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
