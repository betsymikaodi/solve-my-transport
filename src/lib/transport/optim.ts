// Optimization: Stepping-Stone and MODI.

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

function computePotentials(allocs: Allocation[], costs: number[][], m: number, n: number) {
  const u: (number | null)[] = new Array(m).fill(null);
  const v: (number | null)[] = new Array(n).fill(null);
  u[0] = 0;
  let changed = true;
  let safety = m * n + 5;
  while (changed && safety-- > 0) {
    changed = false;
    for (const a of allocs) {
      if (u[a.row] !== null && v[a.col] === null) {
        v[a.col] = costs[a.row][a.col] - (u[a.row] as number);
        changed = true;
      } else if (v[a.col] !== null && u[a.row] === null) {
        u[a.row] = costs[a.row][a.col] - (v[a.col] as number);
        changed = true;
      }
    }
  }
  return { u, v };
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
    let potentials: { u: (number | null)[]; v: (number | null)[] } | undefined;
    const deltas: { row: number; col: number; delta: number }[] = [];

    if (method === "MODI") {
      potentials = computePotentials(allocs, p.costs, m, n);
      for (const [i, j] of emptyCells(allocs, m, n)) {
        const ui = potentials.u[i] ?? 0;
        const vj = potentials.v[j] ?? 0;
        deltas.push({ row: i, col: j, delta: p.costs[i][j] - ui - vj });
      }
    } else {
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
        potentials,
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
        potentials,
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
      potentials,
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

export { computePotentials };
