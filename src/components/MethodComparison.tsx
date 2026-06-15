import { useStore } from "@/lib/store";
import { balanceProblem } from "@/lib/transport/core";
import { solveInit } from "@/lib/transport/init";
import { solveOptim } from "@/lib/transport/optim";
import { InitMethod } from "@/lib/transport/core";
import { useMemo } from "react";

const METHODS: InitMethod[] = ["NorthWest", "MINILI", "MINICO", "MINITAB", "BHammer"];
const LABELS: Record<InitMethod, string> = {
  NorthWest: "Coin Nord-Ouest",
  MINILI: "MINILI (ligne)",
  MINICO: "MINICO (colonne)",
  MINITAB: "MINITAB (global)",
  BHammer: "Balas-Hammer",
};

export function MethodComparison() {
  const { problem, optimMethod } = useStore();

  const rows = useMemo(() => {
    const balanced = balanceProblem(problem);
    return METHODS.map((m) => {
      try {
        const init = solveInit(m, balanced);
        const optim = solveOptim(optimMethod, init.allocations, balanced);
        return {
          method: m,
          initCost: init.totalCost,
          finalCost: optim.finalCost,
          iterations: optim.iterations,
          gap: init.totalCost - optim.finalCost,
        };
      } catch (e) {
        return { method: m, initCost: NaN, finalCost: NaN, iterations: 0, gap: 0 };
      }
    });
  }, [problem, optimMethod]);

  const best = Math.min(...rows.map((r) => r.finalCost).filter((x) => !isNaN(x)));

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted">
          <tr>
            <th className="p-3 text-left font-display">Méthode</th>
            <th className="p-3 text-right font-display">Z initial</th>
            <th className="p-3 text-right font-display">Z optimisé</th>
            <th className="p-3 text-right font-display">
              Itérations {optimMethod === "MODI" ? "(MODI)" : "(SS)"}
            </th>
            <th className="p-3 text-right font-display">Écart init→opt</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.method} className="border-t border-border">
              <td className="p-3 font-medium">{LABELS[r.method]}</td>
              <td className="p-3 text-right font-mono">{r.initCost}</td>
              <td
                className={`p-3 text-right font-mono font-bold ${r.finalCost === best ? "text-positive" : ""}`}
              >
                {r.finalCost}
                {r.finalCost === best && " ★"}
              </td>
              <td className="p-3 text-right font-mono text-muted-foreground">{r.iterations}</td>
              <td className="p-3 text-right font-mono text-muted-foreground">−{r.gap}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
