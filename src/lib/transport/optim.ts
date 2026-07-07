// Optimization: Stepping-Stone.

import {
  Allocation,
  OptimMethod,
  OptimResult,
  OptimStep,
  TransportProblem,
  cloneAllocs,
  computeCost,
  findAlloc,
  fixDegeneracy,
} from "./core";
import { cycleSigns, findCycle, pivot } from "./cycle";

const MAX_ITER = 50;

function emptyCells(allocs: Allocation[], m: number, n: number): [number, number][] {
  const occ = new Set(allocs.map((a) => `${a.row},${a.col}`));
  const out: [number, number][] = [];
  for (let i = 0; i < m; i++)
    for (let j = 0; j < n; j++) if (!occ.has(`${i},${j}`)) out.push([i, j]);
  return out;
}

export function solveOptim(
  method: OptimMethod,
  initial: Allocation[],
  p: TransportProblem,
): OptimResult {
  const m = p.supply.length,
    n = p.demand.length;
  let allocs = fixDegeneracy(cloneAllocs(initial), m, n, p.costs).allocations;
  const steps: OptimStep[] = [];
  let iter = 0;
  let multipleOptima = false;

  while (iter < MAX_ITER) {
    iter++;
    const totalCost = computeCost(allocs, p.costs);
    const deltas: { row: number; col: number; delta: number }[] = [];

    // Stepping-Stone
    for (const [i, j] of emptyCells(allocs, m, n)) {
      const cyc = findCycle(allocs, i, j);
      if (!cyc) continue;
      const signs = cycleSigns(cyc);
      let d = 0;
      cyc.forEach(([r, c], k) => {
        d += (signs[k] === "+" ? 1 : -1) * p.costs[r][c];
      });
      deltas.push({ row: i, col: j, delta: d });
    }

    // pick most negative
    let best: { row: number; col: number; delta: number } | null = null;
    for (const d of deltas) {
      if (best === null || d.delta < best.delta) best = d;
    }

    if (!best || best.delta >= 0) {
      // optimal
      if (deltas.some((d) => d.delta === 0)) multipleOptima = true;
      steps.push({
        iteration: iter,
        allocations: cloneAllocs(allocs),
        totalCost,
        deltas,
        optimal: true,
        multipleOptima,
        message: `Tous les Δᵢⱼ ≥ 0 → solution optimale. Z = ${totalCost}.${multipleOptima ? " (Solutions multiples possibles.)" : ""}`,
      });
      break;
    }

    const cyc = findCycle(allocs, best.row, best.col);
    if (!cyc) {
      steps.push({
        iteration: iter,
        allocations: cloneAllocs(allocs),
        totalCost,
        deltas,
        optimal: true,
        multipleOptima,
        message: `Impossible de construire un cycle pour (${best.row + 1},${best.col + 1}). Arrêt.`,
      });
      break;
    }
    const signs = cycleSigns(cyc);
    const { allocations: newAllocs, theta } = pivot(allocs, cyc);

    steps.push({
      iteration: iter,
      allocations: cloneAllocs(allocs),
      totalCost,
      deltas,
      enteringCell: [best.row, best.col],
      cycle: { cells: cyc, signs },
      theta,
      optimal: false,
      message: `Itération ${iter} : entrée (${best.row + 1},${best.col + 1}), Δ = ${best.delta}, θ = ${theta}. Nouveau Z = ${totalCost + theta * best.delta}.`,
    });

    // re-fix degeneracy
    allocs = fixDegeneracy(newAllocs, m, n, p.costs).allocations;
  }

  return {
    method,
    steps,
    finalAllocations: allocs,
    finalCost: computeCost(allocs, p.costs),
    iterations: iter,
    multipleOptima,
  };
}
