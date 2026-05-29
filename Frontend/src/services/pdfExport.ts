import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ResultadoTransporteResponse } from '../types/api';

interface PDFParams {
  transportResult?: ResultadoTransporteResponse;
  assignmentResult?: ResultadoTransporteResponse;
  aiAnalysis?: string;
  transportInputCosts?: number[][];
  transportInputSupply?: number[];
  transportInputDemand?: number[];
  assignmentInputCosts?: number[][];
  assignmentInputSupply?: number[];
  assignmentInputDemand?: number[];
  transportRowLabels?: string[];
  transportColLabels?: string[];
  assignmentRowLabels?: string[];
  assignmentColLabels?: string[];
  transportMethod?: string;
  assignmentMethod?: string;
}

const MARGIN = 20;
const LINE_HEIGHT = 7;
const FONT = 'times';
const BLACK: [number, number, number] = [0, 0, 0];
const GRAY: [number, number, number] = [80, 80, 80];
const LIGHT_GRAY: [number, number, number] = [200, 200, 200];

function drawLogo(doc: jsPDF, x: number, y: number): void {
  // Diamond icon (mimics the CSS clip-path diamond in the header)
  const boxSize = 8;
  const r = 2.8; // half-width of diamond
  const cx = x + boxSize / 2;
  const cy = y + boxSize / 2;

  // Outer square border
  doc.setDrawColor(...BLACK);
  doc.setLineWidth(0.4);
  doc.rect(x, y, boxSize, boxSize);

  // Filled diamond inside
  doc.setFillColor(...BLACK);
  doc.triangle(cx, cy - r, cx + r, cy, cx, cy + r, 'F');
  doc.triangle(cx - r, cy, cx, cy - r, cx, cy + r, 'F');

  // "NEXUSCORE" title next to icon
  const textX = x + boxSize + 3;
  doc.setFont(FONT, 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...BLACK);
  doc.text('NEXUSCORE', textX, y + 5.5);

  // Subtitle below title
  doc.setFont(FONT, 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.text('Logística y Optimización de Talento', textX, y + 9.5);
}

function addMatrixTable(
  doc: jsPDF,
  data: number[][],
  rowLabels: string[],
  colLabels: string[],
  startY: number,
  supply?: number[],
  demand?: number[],
): number {
  const headers = ['', ...colLabels];
  if (supply) headers.push('Oferta');

  const body: (string | number)[][] = data.map((row, i) => {
    const r: (string | number)[] = [rowLabels[i] ?? `Fila ${i + 1}`, ...row];
    if (supply) r.push(supply[i] ?? 0);
    return r;
  });

  if (demand) {
    const demandRow: (string | number)[] = ['Demanda', ...demand];
    if (supply) demandRow.push('');
    body.push(demandRow);
  }

  autoTable(doc, {
    startY,
    head: [headers],
    body,
    theme: 'grid',
    styles: {
      font: FONT,
      fontSize: 10,
      cellPadding: 2.5,
      halign: 'center',
      textColor: BLACK,
      fillColor: [255, 255, 255],
    },
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: BLACK,
      fontStyle: 'bold',
      fontSize: 10,
    },
    bodyStyles: {
      textColor: BLACK,
      fillColor: [255, 255, 255],
    },
    alternateRowStyles: { fillColor: [248, 248, 248] },
    columnStyles: { 0: { halign: 'right', fontStyle: 'bold' } },
    tableLineColor: LIGHT_GRAY,
    tableLineWidth: 0.2,
  });

  return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
}

function sectionTitle(doc: jsPDF, text: string, y: number): number {
  doc.setFont(FONT, 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...BLACK);
  doc.text(text, MARGIN, y);
  y += 1;
  doc.setDrawColor(...BLACK);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y + 2, doc.internal.pageSize.getWidth() - MARGIN, y + 2);
  return y + LINE_HEIGHT;
}

function label(doc: jsPDF, text: string, y: number): number {
  doc.setFont(FONT, 'italic');
  doc.setFontSize(10);
  doc.setTextColor(...GRAY);
  doc.text(text, MARGIN, y);
  return y + 5;
}

export function generatePDF(params: PDFParams) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = MARGIN;

  // --- Logo header ---
  drawLogo(doc, MARGIN, y);
  y += 14;

  // Date aligned right
  const date = new Date().toLocaleDateString('es-ES', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  doc.setFont(FONT, 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.text(`Reporte generado: ${date}`, pageWidth - MARGIN, y - 10, { align: 'right' });

  // Header separator line
  doc.setDrawColor(...BLACK);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, y, pageWidth - MARGIN, y);
  y += LINE_HEIGHT;

  // --- Transport section ---
  if (params.transportResult && params.transportInputCosts) {
    y = sectionTitle(doc, `PROBLEMA DE TRANSPORTE — ${params.transportMethod ?? ''}`, y);
    y = label(doc, 'Datos de entrada del usuario:', y);

    y = addMatrixTable(
      doc,
      params.transportInputCosts,
      params.transportRowLabels ?? [],
      params.transportColLabels ?? [],
      y,
      params.transportInputSupply,
      params.transportInputDemand,
    );

    y += 6;
    y = label(doc, 'Matriz de asignaciones óptimas:', y);

    const tResult = params.transportResult;
    const balancedRowLabels = [...(params.transportRowLabels ?? [])];
    while (balancedRowLabels.length < tResult.asignaciones.length) {
      balancedRowLabels.push(`Ficticio ${balancedRowLabels.length - (params.transportRowLabels?.length ?? 0) + 1}`);
    }
    const balancedColLabels = [...(params.transportColLabels ?? [])];
    while (balancedColLabels.length < (tResult.asignaciones[0]?.length ?? 0)) {
      balancedColLabels.push(`Ficticio ${balancedColLabels.length - (params.transportColLabels?.length ?? 0) + 1}`);
    }

    y = addMatrixTable(doc, tResult.asignaciones, balancedRowLabels, balancedColLabels, y);
    y += 6;

    doc.setFont(FONT, 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...BLACK);
    doc.text(`Costo Total: $${tResult.costo_total.toLocaleString()}`, MARGIN, y);
    y += LINE_HEIGHT;

    if (tResult.fue_balanceada) {
      doc.setFont(FONT, 'italic');
      doc.setFontSize(10);
      doc.setTextColor(...GRAY);
      doc.text(`Balanceo aplicado: ${tResult.tipo_balanceo}`, MARGIN, y);
      y += LINE_HEIGHT;
    }

    y += 4;
  }

  // --- Assignment section ---
  if (params.assignmentResult && params.assignmentInputCosts) {
    if (y > 240) { doc.addPage(); y = MARGIN; }

    y = sectionTitle(doc, `PROBLEMA DE ASIGNACIÓN — ${params.assignmentMethod ?? ''}`, y);
    y = label(doc, 'Datos de entrada del usuario:', y);

    y = addMatrixTable(
      doc,
      params.assignmentInputCosts,
      params.assignmentRowLabels ?? [],
      params.assignmentColLabels ?? [],
      y,
      params.assignmentInputSupply,
      params.assignmentInputDemand,
    );

    y += 6;
    y = label(doc, 'Matriz de asignaciones óptimas:', y);

    const aResult = params.assignmentResult;
    const balancedRowLabels = [...(params.assignmentRowLabels ?? [])];
    while (balancedRowLabels.length < aResult.asignaciones.length) {
      balancedRowLabels.push(`Ficticio ${balancedRowLabels.length - (params.assignmentRowLabels?.length ?? 0) + 1}`);
    }
    const balancedColLabels = [...(params.assignmentColLabels ?? [])];
    while (balancedColLabels.length < (aResult.asignaciones[0]?.length ?? 0)) {
      balancedColLabels.push(`Ficticio ${balancedColLabels.length - (params.assignmentColLabels?.length ?? 0) + 1}`);
    }

    y = addMatrixTable(doc, aResult.asignaciones, balancedRowLabels, balancedColLabels, y);
    y += 6;

    doc.setFont(FONT, 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...BLACK);
    doc.text(`Costo Total: $${aResult.costo_total.toLocaleString()}`, MARGIN, y);
    y += LINE_HEIGHT;

    if (aResult.fue_balanceada) {
      doc.setFont(FONT, 'italic');
      doc.setFontSize(10);
      doc.setTextColor(...GRAY);
      doc.text(`Balanceo aplicado: ${aResult.tipo_balanceo}`, MARGIN, y);
      y += LINE_HEIGHT;
    }

    y += 4;
  }

  // --- AI Analysis section ---
  if (params.aiAnalysis) {
    if (y > 200) { doc.addPage(); y = MARGIN; }

    y = sectionTitle(doc, 'ANÁLISIS ESTRATÉGICO — IA', y);

    doc.setFont(FONT, 'normal');
    doc.setFontSize(12);
    doc.setTextColor(...BLACK);

    const lines = doc.splitTextToSize(params.aiAnalysis, pageWidth - MARGIN * 2);
    for (const line of lines) {
      if (y > 277) { doc.addPage(); y = MARGIN; }
      doc.text(line, MARGIN, y);
      y += LINE_HEIGHT;
    }
  }

  // --- Footer on every page ---
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont(FONT, 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.text(
      `NexusCore Systems — Página ${i} de ${totalPages}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: 'center' },
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  doc.save(`NexusCore_Reporte_${today}.pdf`);
}
