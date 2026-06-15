// Core types & utilities for the transportation problem solver

export type InitMethod = "NorthWest" | "MINILI" | "MINICO" | "MINITAB" | "BHammer";
export type OptimMethod = "SteppingStone" | "MODI";

export interface TransportProblem {
  supply: number[];
  demand: number[];
  costs: number[][]; // costs[i][j]
  rowLabels?: string[];
  colLabels?: string[];
}

export interface BalancedProblem extends TransportProblem {
  isBalanced: boolean;
  fictiveAdded: "row" | "col" | null;
  originalM: number;
  originalN: number;
}

export interface Allocation {
  row: number;
  col: number;
  quantity: number;
  isEpsilon?: boolean;
}

export interface InitStep {
  type: "allocate" | "penalty" | "note";
  message: string;
  // snapshot of allocations after this step
  allocations: Allocation[];
  remainingSupply: number[];
  remainingDemand: number[];
  // for highlight
  highlightCell?: [number, number];
  // for BHammer
  rowPenalties?: (number | null)[];
  colPenalties?: (number | null)[];
  selectedAxis?: { kind: "row" | "col"; index: number };
  blockedRows?: number[];
  blockedCols?: number[];
}

export interface InitResult {
  method: InitMethod;
  allocations: Allocation[];
  steps: InitStep[];
  totalCost: number;
  isDegenerate: boolean;
}

export interface CycleInfo {
  cells: [number, number][]; // alternating +,-,+,- starting with the entering cell (+)
  signs: ("+" | "-")[];
}

export interface OptimStep {
  iteration: number;
  allocations: Allocation[];
  totalCost: number;
  potentials?: { u: (number | null)[]; v: (number | null)[] };
  deltas: { row: number; col: number; delta: number }[];
  enteringCell?: [number, number];
  cycle?: CycleInfo;
  theta?: number;
  message: string;
  optimal: boolean;
  multipleOptima?: boolean;
}

export interface OptimResult {
  method: OptimMethod;
  steps: OptimStep[];
  finalAllocations: Allocation[];
  finalCost: number;
  iterations: number;
  multipleOptima: boolean;
}

export function sum(a: number[]) {
  return a.reduce((s, x) => s + x, 0);
}

export function cloneAllocs(a: Allocation[]): Allocation[] {
  return a.map((x) => ({ ...x }));
}

export function findAlloc(a: Allocation[], i: number, j: number): Allocation | undefined {
  return a.find((x) => x.row === i && x.col === j);
}

export function computeCost(allocations: Allocation[], costs: number[][]): number {
  let z = 0;
  for (const a of allocations) {
    if (a.isEpsilon) continue;
    z += a.quantity * costs[a.row][a.col];
  }
  return z;
}

/** Balance the problem by adding a fictive row or column. */
export function balanceProblem(p: TransportProblem): BalancedProblem {
  const totalSupply = sum(p.supply);
  const totalDemand = sum(p.demand);
  const m = p.supply.length;
  const n = p.demand.length;

  if (totalSupply === totalDemand) {
    return {
      ...p,
      isBalanced: true,
      fictiveAdded: null,
      originalM: m,
      originalN: n,
    };
  }

  if (totalSupply > totalDemand) {
    // add fictive destination
    const diff = totalSupply - totalDemand;
    return {
      supply: [...p.supply],
      demand: [...p.demand, diff],
      costs: p.costs.map((row) => [...row, 0]),
      rowLabels: p.rowLabels,
      colLabels: [...(p.colLabels ?? p.demand.map((_, j) => `D${j + 1}`)), "D*"],
      isBalanced: false,
      fictiveAdded: "col",
      originalM: m,
      originalN: n,
    };
  }

  const diff = totalDemand - totalSupply;
  return {
    supply: [...p.supply, diff],
    demand: [...p.demand],
    costs: [...p.costs, new Array(n).fill(0)],
    rowLabels: [...(p.rowLabels ?? p.supply.map((_, i) => String.fromCharCode(65 + i))), "O*"],
    colLabels: p.colLabels,
    isBalanced: false,
    fictiveAdded: "row",
    originalM: m,
    originalN: n,
  };
}

/** Ensure exactly m+n-1 basic cells: add epsilon cells if degenerate. */
export function fixDegeneracy(
  allocations: Allocation[],
  m: number,
  n: number,
  costs: number[][],
): { allocations: Allocation[]; addedEpsilons: [number, number][]; isDegenerate: boolean } {
  const required = m + n - 1;
  const added: [number, number][] = [];
  const allocs = cloneAllocs(allocations);
  const isDegen = allocs.length < required;

  while (allocs.length < required) {
    // Find an unoccupied cell whose addition keeps the basis cycle-free.
    let chosen: [number, number] | null = null;
    let bestCost = Infinity;
    for (let i = 0; i < m; i++) {
      for (let j = 0; j < n; j++) {
        if (findAlloc(allocs, i, j)) continue;
        // try adding
        const trial = [...allocs, { row: i, col: j, quantity: 0, isEpsilon: true }];
        if (!hasCycle(trial, m, n) && isConnectable(trial, m, n)) {
          if (costs[i][j] < bestCost) {
            bestCost = costs[i][j];
            chosen = [i, j];
          }
        }
      }
    }
    if (!chosen) {
      // fallback: any cell not creating cycle
      for (let i = 0; i < m && !chosen; i++) {
        for (let j = 0; j < n && !chosen; j++) {
          if (findAlloc(allocs, i, j)) continue;
          const trial = [...allocs, { row: i, col: j, quantity: 0, isEpsilon: true }];
          if (!hasCycle(trial, m, n)) chosen = [i, j];
        }
      }
    }
    if (!chosen) break;
    allocs.push({ row: chosen[0], col: chosen[1], quantity: 0, isEpsilon: true });
    added.push(chosen);
  }

  return { allocations: allocs, addedEpsilons: added, isDegenerate: isDegen };
}

/** Check if the set of cells contains a cycle (alternating rows/cols). */
export function hasCycle(allocs: Allocation[], m: number, n: number): boolean {
  // A bipartite graph with vertices = rows ∪ cols, edges = cells.
  // It has a cycle iff edges > vertices_in_components - components.
  // Simpler: use union-find; if any edge connects two already-connected nodes -> cycle.
  const parent = new Array(m + n).fill(0).map((_, i) => i);
  function find(x: number): number {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  }
  for (const a of allocs) {
    const ra = find(a.row);
    const rb = find(m + a.col);
    if (ra === rb) return true;
    parent[ra] = rb;
  }
  return false;
}

function isConnectable(_allocs: Allocation[], _m: number, _n: number): boolean {
  return true; // we just need acyclic; connectivity built up through epsilons
}
