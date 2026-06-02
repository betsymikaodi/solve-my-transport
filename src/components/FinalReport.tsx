import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function FinalReport() {
  const { balanced, initResult, optimResult, initMethod, optimMethod } = useStore();
  if (!balanced || !initResult || !optimResult) return null;
  const final = optimResult.finalAllocations
    .filter(a => !a.isEpsilon && a.quantity > 0)
    .sort((a, b) => a.row - b.row || a.col - b.col);

  const rowL = balanced.rowLabels ?? balanced.supply.map((_, i) => String.fromCharCode(65 + i));
  const colL = balanced.colLabels ?? balanced.demand.map((_, j) => `D${j + 1}`);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Rapport de résolution — Problème de transport', 14, 18);
    doc.setFontSize(10);
    doc.text(`Méthode initialisation : ${initMethod}`, 14, 28);
    doc.text(`Méthode optimisation : ${optimMethod}`, 14, 34);
    doc.text(`Itérations : ${optimResult.iterations}`, 14, 40);
    doc.text(`Coût total Z* = ${optimResult.finalCost}`, 14, 46);

    autoTable(doc, {
      startY: 54,
      head: [['Origine', 'Destination', 'xᵢⱼ', 'cᵢⱼ', 'xᵢⱼ × cᵢⱼ']],
      body: final.map(a => [
        rowL[a.row], colL[a.col], a.quantity, balanced.costs[a.row][a.col],
        a.quantity * balanced.costs[a.row][a.col],
      ]),
      foot: [['', '', '', 'Z TOTAL', optimResult.finalCost]],
      theme: 'grid',
      headStyles: { fillColor: [6, 78, 59] },
      footStyles: { fillColor: [201, 168, 76], textColor: [13, 13, 13], fontStyle: 'bold' },
    });

    doc.save(`transport-${optimMethod}-Z${optimResult.finalCost}.pdf`);
  };

  return (
    <div className="rounded-lg border-2 border-accent bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-xl">Solution optimale atteinte ✓</h3>
          <div className="text-sm text-muted-foreground mt-1">
            Init : <span className="font-mono">{initMethod}</span> · Optim : <span className="font-mono">{optimMethod}</span> · {optimResult.iterations} itération(s)
            {optimResult.multipleOptima && <span className="ml-2 text-accent">· Solutions multiples</span>}
            {balanced.fictiveAdded && <span className="ml-2 text-accent">· {balanced.fictiveAdded === 'col' ? 'Destination' : 'Origine'} fictive ajoutée</span>}
          </div>
        </div>
        <Button onClick={exportPDF} variant="default" className="bg-primary"><Download className="w-4 h-4 mr-2" />Exporter PDF</Button>
      </div>

      <div className="overflow-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-muted">
              <th className="p-2 border border-border text-left">Origine</th>
              <th className="p-2 border border-border text-left">Destination</th>
              <th className="p-2 border border-border text-right">xᵢⱼ</th>
              <th className="p-2 border border-border text-right">cᵢⱼ</th>
              <th className="p-2 border border-border text-right">xᵢⱼ × cᵢⱼ</th>
            </tr>
          </thead>
          <tbody>
            {final.map((a, k) => (
              <tr key={k} className="border-t border-border">
                <td className="p-2 border border-border font-mono">{rowL[a.row]}</td>
                <td className="p-2 border border-border font-mono">{colL[a.col]}</td>
                <td className="p-2 border border-border text-right font-mono">{a.quantity}</td>
                <td className="p-2 border border-border text-right font-mono text-muted-foreground">{balanced.costs[a.row][a.col]}</td>
                <td className="p-2 border border-border text-right font-mono">{a.quantity * balanced.costs[a.row][a.col]}</td>
              </tr>
            ))}
            <tr className="bg-primary text-primary-foreground">
              <td colSpan={4} className="p-3 text-right font-display text-base">Z TOTAL =</td>
              <td className="p-3 text-right font-mono font-bold text-lg">{optimResult.finalCost}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
