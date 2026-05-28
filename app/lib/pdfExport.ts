/**
 * pdfExport.ts — RespondaCare jsPDF handover generator
 * Produces a signed, RA 10173-stamped clinical handover PDF.
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const BRAND_COLOR = [139, 26, 26]; // Matches Next.js primary brand color: #8b1a1a

export interface PCRReportData {
  incidentDate?: string;
  incidentTime?: string;
  arrivalTime?: string;
  clearTime?: string;
  incidentLocation?: string;
  barangay?: string;
  responderId?: string;
  unitCallSign?: string;
  incidentType?: string;
  severityScore?: string;
  responseOutcome?: string;
  natureOfCall?: string;
  patientName?: string;
  patientAge?: string;
  patientSex?: string;
  chiefComplaint?: string;
  painScale?: string;
  levelOfConsciousness?: string;
  airwayStatus?: string;
  breathingStatus?: string;
  circulationStatus?: string;
  skinCondition?: string;
  pupilResponse?: string;
  bloodPressure?: string;
  pulseRate?: string;
  respiratoryRate?: string;
  spo2?: string;
  temperature?: string;
  bloodGlucose?: string;
  gcsTotal?: number;
  interventionsPerformed?: string;
  medicationsGiven?: string;
  ivAccess?: string;
  oxygenTherapy?: string;
  immobilization?: string;
  patientDisposition?: string;
  hospitalName?: string;
  receivingProvider?: string;
  transportMode?: string;
  departureTime?: string;
  arrivalAtFacility?: string;
  turnoverNotes?: string;
  clinicalNarrative?: string;
}

/**
 * Generates a clinical handover PDF from UIR data.
 */
export function generateHandoverPDF(reportData: PCRReportData): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentW = pageW - margin * 2;

  // ── Header Banner ──────────────────────────────────────────────────
  doc.setFillColor(BRAND_COLOR[0], BRAND_COLOR[1], BRAND_COLOR[2]);
  doc.rect(0, 0, pageW, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('RespondaCare', margin, 12);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Barangay 45 Emergency Medical Services', margin, 18);
  doc.text('HOSPITAL HANDOVER / PATIENT CARE REPORT', margin, 23);

  // RA 10173 stamp — top right
  doc.setFontSize(7);
  doc.text('RA 10173 COMPLIANT', pageW - margin, 12, { align: 'right' });
  doc.text('Philippine Data Privacy Act', pageW - margin, 17, { align: 'right' });
  const now = new Date();
  doc.text(
    `Generated: ${now.toLocaleString('en-PH')}`,
    pageW - margin,
    22,
    { align: 'right' }
  );

  let y = 36;

  // ── Section: Incident Details ──────────────────────────────────────
  doc.setFillColor(254, 242, 242); // Warm red background
  doc.rect(margin, y, contentW, 7, 'F');
  doc.setTextColor(BRAND_COLOR[0], BRAND_COLOR[1], BRAND_COLOR[2]);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('A. INCIDENT & RESPONSE DETAILS', margin + 2, y + 5);
  y += 10;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: 'plain',
    styles: { fontSize: 8, cellPadding: 2, textColor: [40, 40, 40] },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50, textColor: [80, 80, 80] },
      1: { cellWidth: contentW / 2 - 25 },
      2: { fontStyle: 'bold', cellWidth: 40, textColor: [80, 80, 80] },
      3: { cellWidth: contentW / 2 - 25 },
    },
    body: [
      ['Incident Date', reportData.incidentDate || '—', 'Dispatch Time', reportData.incidentTime || '—'],
      ['On-Scene Arrival', reportData.arrivalTime || '—', 'Scene Clear', reportData.clearTime || '—'],
      ['Incident Location', reportData.incidentLocation || '—', 'Barangay', reportData.barangay || '—'],
      ['Responder ID', reportData.responderId || '—', 'Unit Call Sign', reportData.unitCallSign || '—'],
      ['Incident Type', reportData.incidentType || '—', 'Severity Score', reportData.severityScore || '—'],
      ['Response Outcome', reportData.responseOutcome || '—', 'Nature of Call', reportData.natureOfCall || '—'],
    ],
  });

  // @ts-ignore
  y = doc.lastAutoTable.finalY + 6;

  // ── Section: Patient Information ───────────────────────────────────
  doc.setFillColor(254, 242, 242);
  doc.rect(margin, y, contentW, 7, 'F');
  doc.setTextColor(BRAND_COLOR[0], BRAND_COLOR[1], BRAND_COLOR[2]);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('B. PATIENT INFORMATION', margin + 2, y + 5);
  y += 10;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: 'plain',
    styles: { fontSize: 8, cellPadding: 2, textColor: [40, 40, 40] },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50, textColor: [80, 80, 80] },
      1: { cellWidth: contentW / 2 - 25 },
      2: { fontStyle: 'bold', cellWidth: 40, textColor: [80, 80, 80] },
      3: { cellWidth: contentW / 2 - 25 },
    },
    body: [
      ['Full Name', reportData.patientName || '—', 'Age / Sex', `${reportData.patientAge || '—'} / ${reportData.patientSex || '—'}`],
      ['Chief Complaint', reportData.chiefComplaint || '—', 'Pain Scale', reportData.painScale || '—'],
      ['LOC', reportData.levelOfConsciousness || '—', 'Airway', reportData.airwayStatus || '—'],
      ['Breathing', reportData.breathingStatus || '—', 'Circulation', reportData.circulationStatus || '—'],
      ['Skin Condition', reportData.skinCondition || '—', 'Pupils', reportData.pupilResponse || '—'],
    ],
  });

  // @ts-ignore
  y = doc.lastAutoTable.finalY + 6;

  // ── Section: Vital Signs ───────────────────────────────────────────
  doc.setFillColor(254, 242, 242);
  doc.rect(margin, y, contentW, 7, 'F');
  doc.setTextColor(BRAND_COLOR[0], BRAND_COLOR[1], BRAND_COLOR[2]);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('C. VITAL SIGNS', margin + 2, y + 5);
  y += 10;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: 'grid',
    headStyles: {
      fillColor: [BRAND_COLOR[0], BRAND_COLOR[1], BRAND_COLOR[2]],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
    },
    styles: { fontSize: 8, cellPadding: 2 },
    head: [['BP', 'Pulse (BPM)', 'RR', 'SpO2', 'Temp °C', 'Glucose', 'GCS']],
    body: [
      [
        reportData.bloodPressure || '—',
        reportData.pulseRate || '—',
        reportData.respiratoryRate || '—',
        reportData.spo2 ? `${reportData.spo2}%` : '—',
        reportData.temperature || '—',
        reportData.bloodGlucose || '—',
        reportData.gcsTotal !== undefined ? String(reportData.gcsTotal) : '—',
      ],
    ],
  });

  // @ts-ignore
  y = doc.lastAutoTable.finalY + 6;

  // ── Section: Interventions ─────────────────────────────────────────
  if (y > pageH - 60) {
    doc.addPage();
    y = 20;
  }

  doc.setFillColor(254, 242, 242);
  doc.rect(margin, y, contentW, 7, 'F');
  doc.setTextColor(BRAND_COLOR[0], BRAND_COLOR[1], BRAND_COLOR[2]);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('D. INTERVENTIONS & TREATMENT', margin + 2, y + 5);
  y += 10;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: 'plain',
    styles: { fontSize: 8, cellPadding: 2, textColor: [40, 40, 40] },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 55, textColor: [80, 80, 80] },
    },
    body: [
      ['Interventions', reportData.interventionsPerformed || 'None documented.'],
      ['Medications Given', reportData.medicationsGiven || 'None'],
      ['IV Access', reportData.ivAccess || 'None'],
      ['Oxygen Therapy', reportData.oxygenTherapy || 'None'],
      ['Immobilization', reportData.immobilization || 'None'],
    ],
  });

  // @ts-ignore
  y = doc.lastAutoTable.finalY + 6;

  // ── Section: Disposition ──────────────────────────────────────────
  doc.setFillColor(254, 242, 242);
  doc.rect(margin, y, contentW, 7, 'F');
  doc.setTextColor(BRAND_COLOR[0], BRAND_COLOR[1], BRAND_COLOR[2]);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('E. PATIENT DISPOSITION & HOSPITAL HANDOVER', margin + 2, y + 5);
  y += 10;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: 'plain',
    styles: { fontSize: 8, cellPadding: 2, textColor: [40, 40, 40] },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 55, textColor: [80, 80, 80] },
    },
    body: [
      ['Disposition', reportData.patientDisposition || '—'],
      ['Receiving Hospital', reportData.hospitalName || '—'],
      ['Receiving Provider', reportData.receivingProvider || '—'],
      ['Transport Mode', reportData.transportMode || '—'],
      ['Departure Time', reportData.departureTime || '—'],
      ['Arrival at Facility', reportData.arrivalAtFacility || '—'],
      ['Handover Notes', reportData.turnoverNotes || '—'],
    ],
  });

  // @ts-ignore
  y = doc.lastAutoTable.finalY + 8;

  // ── Clinical Narrative ─────────────────────────────────────────────
  if (reportData.clinicalNarrative) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(BRAND_COLOR[0], BRAND_COLOR[1], BRAND_COLOR[2]);
    doc.text('Clinical Narrative:', margin, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(8);
    const lines = doc.splitTextToSize(reportData.clinicalNarrative, contentW);
    doc.text(lines, margin, y);
    y += lines.length * 4 + 6;
  }

  // ── Signature Block ────────────────────────────────────────────────
  if (y > pageH - 45) {
    doc.addPage();
    y = 20;
  }

  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y + 10, margin + 70, y + 10);
  doc.line(pageW - margin - 70, y + 10, pageW - margin, y + 10);

  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('Paramedic / Responder Signature', margin, y + 14);
  doc.text('Receiving Physician Signature', pageW - margin - 70, y + 14);

  // ── Footer ─────────────────────────────────────────────────────────
  doc.setFillColor(BRAND_COLOR[0], BRAND_COLOR[1], BRAND_COLOR[2]);
  doc.rect(0, pageH - 12, pageW, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.text(
    'RespondaCare — Barangay 45, Pasay City | RA 10173 Philippine Data Privacy Act Compliant | CONFIDENTIAL MEDICAL RECORD',
    pageW / 2,
    pageH - 4,
    { align: 'center' }
  );

  // ── Save ───────────────────────────────────────────────────────────
  const fileName = `RespondaCare_Handover_${now.toISOString().slice(0, 10)}_${(reportData.patientName || 'Unknown').replace(/\s+/g, '_')}.pdf`;
  doc.save(fileName);
}
