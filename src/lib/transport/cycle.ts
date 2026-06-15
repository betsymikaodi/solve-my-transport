// Cycle detection for Stepping-Stone / MODI pivoting.

import { Allocation, findAlloc } from "./core";

/**
 * Find the unique closed cycle through an entering empty cell (er,ec)
 * using only occupied (basic) cells, with alternating row/column moves.
 * Returns the ordered list of cells [(er,ec)+, c1-, c2+, c3-, ...].
 */
export function findCycle(
  allocations: Allocation[],
  er: number,
  ec: number,
): [number, number][] | null {
  const basis = allocations.map((a) => [a.row, a.col] as [number, number]);
  // Working set includes the entering cell.
  const cells: [number, number][] = [
    [er, ec],
    ...basis.filter(([i, j]) => !(i === er && j === ec)),
  ];

  // Iteratively prune cells that are alone in their row/col (cannot be part of cycle).
  let changed = true;
  let pool = cells.slice();
  while (changed) {
    changed = false;
    const rowCount = new Map<number, number>();
    const colCount = new Map<number, number>();
    for (const [i, j] of pool) {
      rowCount.set(i, (rowCount.get(i) ?? 0) + 1);
      colCount.set(j, (colCount.get(j) ?? 0) + 1);
    }
    const next = pool.filter(
      ([i, j]) => (i === er && j === ec) || (rowCount.get(i)! >= 2 && colCount.get(j)! >= 2),
    );
    if (next.length !== pool.length) {
      changed = true;
      pool = next;
    }
  }

  // DFS to construct the cycle, alternating axes.
  // Start from entering cell; first move must be along ROW (find another cell in same row).
  const start: [number, number] = [er, ec];
  const path: [number, number][] = [start];

  function dfs(axis: "row" | "col"): boolean {
    const last = path[path.length - 1];
    const candidates = pool.filter(([i, j]) => {
      if (i === last[0] && j === last[1]) return false;
      if (axis === "row") return i === last[0];
      return j === last[1];
    });
    for (const c of candidates) {
      // Check we can close the cycle once length >= 4 and even
      if (path.length >= 3 && path.length % 2 === 1) {
        // try to close: this c must share the perpendicular index with start
        if ((axis === "row" && c[0] === start[0]) || (axis === "col" && c[1] === start[1])) {
          // continue searching deeper too, but try closing first when last hop returns to start's row/col
        }
      }
      // skip if already in path
      if (path.some((p) => p[0] === c[0] && p[1] === c[1])) continue;
      path.push(c);
      // Check closure: from c we need to come back to start via the next axis.
      const nextAxis = axis === "row" ? "col" : "row";
      if (path.length >= 4) {
        // we can close if the line from c to start uses nextAxis
        if (
          (nextAxis === "col" && c[1] === start[1]) ||
          (nextAxis === "row" && c[0] === start[0])
        ) {
          return true;
        }
      }
      if (dfs(nextAxis)) return true;
      path.pop();
    }
    return false;
  }

  if (dfs("row")) return path;
  // Try starting with col
  path.length = 1;
  if (dfs("col")) return path;
  return null;
}

export function cycleSigns(cycle: [number, number][]): ("+" | "-")[] {
  return cycle.map((_, k) => (k % 2 === 0 ? "+" : "-"));
}

/** Perform pivot along cycle and return new allocations (epsilon-aware). */
export function pivot(
  allocations: Allocation[],
  cycle: [number, number][],
): { allocations: Allocation[]; theta: number; leaving: [number, number] } {
  const minus = cycle.filter((_, k) => k % 2 === 1);
  let theta = Infinity;
  let leavingIdx = -1;
  minus.forEach(([i, j], k) => {
    const a = findAlloc(allocations, i, j);
    const q = a ? a.quantity : 0;
    if (q < theta) {
      theta = q;
      leavingIdx = k;
    }
  });
  if (!isFinite(theta)) theta = 0;

  const newAllocs = allocations.map((a) => ({ ...a }));
  cycle.forEach(([i, j], k) => {
    const sign = k % 2 === 0 ? 1 : -1;
    let a = newAllocs.find((x) => x.row === i && x.col === j);
    if (!a) {
      a = { row: i, col: j, quantity: 0 };
      newAllocs.push(a);
    }
    a.quantity += sign * theta;
  });

  // Determine leaving cell, remove zero-qty cells (one if multiple tied)
  const leaving = minus[leavingIdx];
  const out: Allocation[] = [];
  let droppedLeaving = false;
  for (const a of newAllocs) {
    if (a.quantity > 0 || a.isEpsilon) {
      out.push({ ...a, isEpsilon: a.quantity === 0 ? a.isEpsilon : false });
    } else if (!droppedLeaving && a.row === leaving[0] && a.col === leaving[1]) {
      droppedLeaving = true; // drop the leaving variable
    } else {
      // drop other zeroed cells too (degeneracy pivot)
    }
  }
  return { allocations: out, theta, leaving };
}
