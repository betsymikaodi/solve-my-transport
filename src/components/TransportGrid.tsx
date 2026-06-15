import { Allocation, BalancedProblem } from "@/lib/transport/core";
import { CycleInfo } from "@/lib/transport/core";

interface Props {
  problem: BalancedProblem;
  allocations: Allocation[];
  highlightCell?: [number, number] | null;
  cycle?: CycleInfo | null;
  rowPenalties?: (number | null)[] | null;
  colPenalties?: (number | null)[] | null;
  selectedAxis?: { kind: "row" | "col"; index: number } | null;
  potentials?: { u: (number | null)[]; v: (number | null)[] } | null;
  deltas?: { row: number; col: number; delta: number }[] | null;
  enteringCell?: [number, number] | null;
  remainingSupply?: number[] | null;
  remainingDemand?: number[] | null;
}

export function TransportGrid(p: Props) {
  const { problem, allocations } = p;
  const m = problem.supply.length,
    n = problem.demand.length;
  const rowL = problem.rowLabels ?? problem.supply.map((_, i) => String.fromCharCode(65 + i));
  const colL = problem.colLabels ?? problem.demand.map((_, j) => `D${j + 1}`);

  const allocMap = new Map<string, Allocation>();
  for (const a of allocations) allocMap.set(`${a.row},${a.col}`, a);

  const cycleMap = new Map<string, "+" | "-">();
  if (p.cycle) p.cycle.cells.forEach(([i, j], k) => cycleMap.set(`${i},${j}`, p.cycle!.signs[k]));

  const deltaMap = new Map<string, number>();
  if (p.deltas) for (const d of p.deltas) deltaMap.set(`${d.row},${d.col}`, d.delta);

  const isFictiveCol = problem.fictiveAdded === "col";
  const isFictiveRow = problem.fictiveAdded === "row";

  return (
    <div className="overflow-auto rounded-lg border border-border bg-card">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-muted">
            <th className="p-2 border border-border font-display text-xs uppercase tracking-wider text-muted-foreground">
              cᵢⱼ
            </th>
            {colL.map((c, j) => (
              <th
                key={j}
                className={`p-2 border border-border font-display ${isFictiveCol && j === n - 1 ? "text-accent italic" : ""}`}
              >
                {c}
              </th>
            ))}
            <th className="p-2 border border-border font-display text-xs uppercase tracking-wider text-muted-foreground">
              aᵢ
            </th>
            {p.rowPenalties && (
              <th className="p-2 border border-border bg-secondary/10 font-display text-xs">
                Pén.
              </th>
            )}
            {p.potentials && (
              <th className="p-2 border border-border bg-accent/10 font-display text-xs">uᵢ</th>
            )}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: m }).map((_, i) => (
            <tr key={i}>
              <th
                className={`p-2 border border-border bg-muted font-display ${isFictiveRow && i === m - 1 ? "text-accent italic" : ""}`}
              >
                {rowL[i]}
              </th>
              {Array.from({ length: n }).map((_, j) => {
                const key = `${i},${j}`;
                const a = allocMap.get(key);
                const sign = cycleMap.get(key);
                const delta = deltaMap.get(key);
                const isHighlight =
                  p.highlightCell && p.highlightCell[0] === i && p.highlightCell[1] === j;
                const isEntering =
                  p.enteringCell && p.enteringCell[0] === i && p.enteringCell[1] === j;

                let cellCls =
                  "relative p-2 border border-border h-16 min-w-[64px] text-center align-middle";
                if (isHighlight) cellCls += " bg-positive/20 ring-2 ring-positive";
                if (isEntering) cellCls += " bg-accent/30 ring-2 ring-accent";
                if (sign === "+") cellCls += " bg-positive/15";
                if (sign === "-") cellCls += " bg-negative/15";

                return (
                  <td key={j} className={cellCls}>
                    <div className="text-[10px] text-muted-foreground absolute top-0.5 left-1 font-mono">
                      {problem.costs[i][j]}
                    </div>
                    {a ? (
                      <div
                        className={`font-display font-semibold ${a.isEpsilon ? "text-accent italic" : "text-foreground"}`}
                      >
                        {a.isEpsilon ? "ε" : a.quantity}
                      </div>
                    ) : delta !== undefined ? (
                      <div
                        className={`text-xs font-mono ${delta < 0 ? "text-negative font-bold" : "text-muted-foreground"}`}
                      >
                        Δ={delta}
                      </div>
                    ) : null}
                    {sign && (
                      <div
                        className={`absolute bottom-0.5 right-1 text-xs font-bold ${sign === "+" ? "text-positive" : "text-negative"}`}
                      >
                        {sign}
                      </div>
                    )}
                  </td>
                );
              })}
              <th className="p-2 border border-border bg-muted font-mono">
                {problem.supply[i]}
                {p.remainingSupply && p.remainingSupply[i] !== problem.supply[i] && (
                  <div className="text-[10px] text-muted-foreground">→ {p.remainingSupply[i]}</div>
                )}
              </th>
              {p.rowPenalties && (
                <th
                  className={`p-2 border border-border font-mono ${p.selectedAxis?.kind === "row" && p.selectedAxis.index === i ? "bg-destructive/20 text-destructive font-bold" : "bg-secondary/5"}`}
                >
                  {p.rowPenalties[i] ?? "—"}
                </th>
              )}
              {p.potentials && (
                <th className="p-2 border border-border bg-accent/10 font-mono">
                  {p.potentials.u[i] ?? "—"}
                </th>
              )}
            </tr>
          ))}
          <tr>
            <th className="p-2 border border-border bg-muted font-display text-xs uppercase tracking-wider text-muted-foreground">
              bⱼ
            </th>
            {problem.demand.map((d, j) => (
              <th key={j} className="p-2 border border-border bg-muted font-mono">
                {d}
                {p.remainingDemand && p.remainingDemand[j] !== d && (
                  <div className="text-[10px] text-muted-foreground">→ {p.remainingDemand[j]}</div>
                )}
              </th>
            ))}
            <th className="p-2 border border-border bg-primary text-primary-foreground font-mono">
              Σ={problem.supply.reduce((a, b) => a + b, 0)}
            </th>
            {p.rowPenalties && <th className="border border-border bg-muted" />}
            {p.potentials && <th className="border border-border bg-muted" />}
          </tr>
          {p.colPenalties && (
            <tr>
              <th className="p-2 border border-border bg-secondary/5 font-display text-xs">Pén.</th>
              {p.colPenalties.map((cp, j) => (
                <th
                  key={j}
                  className={`p-2 border border-border font-mono ${p.selectedAxis?.kind === "col" && p.selectedAxis.index === j ? "bg-destructive/20 text-destructive font-bold" : "bg-secondary/5"}`}
                >
                  {cp ?? "—"}
                </th>
              ))}
              <th className="border border-border bg-muted" />
            </tr>
          )}
          {p.potentials && (
            <tr>
              <th className="p-2 border border-border bg-accent/10 font-display text-xs">vⱼ</th>
              {p.potentials.v.map((vj, j) => (
                <th key={j} className="p-2 border border-border bg-accent/10 font-mono">
                  {vj ?? "—"}
                </th>
              ))}
              <th className="border border-border bg-muted" />
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
