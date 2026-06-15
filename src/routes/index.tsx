import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { ProblemEditor } from "@/components/ProblemEditor";
import { InitViewer } from "@/components/InitViewer";
import { OptimViewer } from "@/components/OptimViewer";
import { FinalReport } from "@/components/FinalReport";
import { MethodComparison } from "@/components/MethodComparison";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { InitMethod, OptimMethod } from "@/lib/transport/core";
import { Play, RotateCcw } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TRANSP — Solveur de transport pédagogique" },
      {
        name: "description",
        content:
          "Résolvez et visualisez pas à pas les problèmes de transport linéaire : Balas-Hammer, MODI, Stepping-Stone.",
      },
      { property: "og:title", content: "TRANSP — Solveur de transport" },
      {
        property: "og:description",
        content:
          "Méthodes Nord-Ouest, MINILI, MINICO, MINITAB, Balas-Hammer + Stepping-Stone & MODI.",
      },
    ],
  }),
  component: Index,
});

const INIT_METHODS: { id: InitMethod; label: string; desc: string }[] = [
  { id: "NorthWest", label: "Coin Nord-Ouest", desc: "Pédagogique, jamais optimal" },
  { id: "MINILI", label: "MINILI", desc: "Min ligne par ligne" },
  { id: "MINICO", label: "MINICO", desc: "Min colonne par colonne" },
  { id: "MINITAB", label: "MINITAB", desc: "Min global du tableau" },
  { id: "BHammer", label: "Balas-Hammer", desc: "Différence maximale (VAM)" },
];

const OPTIM_METHODS: { id: OptimMethod; label: string; desc: string }[] = [
  { id: "SteppingStone", label: "Stepping-Stone", desc: "Transferts via cycles" },
  { id: "MODI", label: "MODI (Potentiels)", desc: "uᵢ + vⱼ = cᵢⱼ" },
];

function Index() {
  const {
    initMethod,
    setInitMethod,
    optimMethod,
    setOptimMethod,
    solve,
    reset,
    initResult,
    optimResult,
  } = useStore();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-display font-bold">
            T
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight">TRANSP</h1>
            <p className="text-xs text-muted-foreground">
              Automatisation de la résolution des problèmes de transport par les algorithmes MINITAB et Stepping Stone
            </p>
          </div>
          <div className="ml-auto text-xs font-mono text-accent">v2.0</div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <section className="space-y-4">
          <h2 className="font-display text-xl flex items-center gap-2">
            <span className="w-7 h-7 rounded bg-accent text-accent-foreground text-sm flex items-center justify-center font-bold">
              1
            </span>
            Saisie du problème
          </h2>
          <ProblemEditor />
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-xl flex items-center gap-2">
            <span className="w-7 h-7 rounded bg-accent text-accent-foreground text-sm flex items-center justify-center font-bold">
              2
            </span>
            Choix des méthodes
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="font-display text-sm uppercase tracking-wider text-muted-foreground mb-3">
                Initialisation
              </h3>
              <div className="space-y-2">
                {INIT_METHODS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setInitMethod(m.id)}
                    className={`w-full text-left p-3 rounded-md border transition ${initMethod === m.id ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-secondary"}`}
                  >
                    <div className="font-display font-medium">{m.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{m.desc}</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="font-display text-sm uppercase tracking-wider text-muted-foreground mb-3">
                Optimisation
              </h3>
              <div className="space-y-2">
                {OPTIM_METHODS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setOptimMethod(m.id)}
                    className={`w-full text-left p-3 rounded-md border transition ${optimMethod === m.id ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-secondary"}`}
                  >
                    <div className="font-display font-medium">{m.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{m.desc}</div>
                  </button>
                ))}
              </div>
              <div className="mt-6 flex gap-2">
                <Button onClick={solve} size="lg" className="flex-1 bg-primary hover:bg-primary/90">
                  <Play className="w-4 h-4 mr-2" />
                  Résoudre
                </Button>
                <Button onClick={reset} size="lg" variant="outline">
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {initResult && optimResult && (
          <section className="space-y-4">
            <h2 className="font-display text-xl flex items-center gap-2">
              <span className="w-7 h-7 rounded bg-accent text-accent-foreground text-sm flex items-center justify-center font-bold">
                3
              </span>
              Résolution pas à pas
            </h2>
            <Tabs defaultValue="optim" className="w-full">
              <TabsList>
                <TabsTrigger value="init">
                  Phase A · Initialisation ({initResult.steps.length})
                </TabsTrigger>
                <TabsTrigger value="optim">
                  Phase B · Optimisation ({optimResult.iterations} iter.)
                </TabsTrigger>
                <TabsTrigger value="compare">Comparaison des méthodes</TabsTrigger>
              </TabsList>
              <TabsContent value="init" className="mt-4">
                <InitViewer />
              </TabsContent>
              <TabsContent value="optim" className="mt-4">
                <OptimViewer />
              </TabsContent>
              <TabsContent value="compare" className="mt-4">
                <MethodComparison />
              </TabsContent>
            </Tabs>
          </section>
        )}

        {optimResult && (
          <section className="space-y-4">
            <h2 className="font-display text-xl flex items-center gap-2">
              <span className="w-7 h-7 rounded bg-accent text-accent-foreground text-sm flex items-center justify-center font-bold">
                4
              </span>
              Rapport final
            </h2>
            <FinalReport />
          </section>
        )}

        <footer className="text-center text-xs text-muted-foreground pt-8 pb-4">
          TRANSP - MINITAB - Stepping Stone par Cici et Emma  copyright M1 2026
        </footer>
      </main>
    </div>
  );
}
