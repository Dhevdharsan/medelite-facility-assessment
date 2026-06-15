import {
  Document, Packer, Paragraph, Table, TableRow, TableCell,
  WidthType, HeadingLevel, TextRun, ShadingType, AlignmentType,
  BorderStyle, ExternalHyperlink,
} from 'docx';
import { saveAs } from 'file-saver';
import { BANNER_LINE2, CARE_COMPARE } from '../constants/branding.js';
import { safe, formatAddress } from './fieldMapper.js';

const PURPLE = '6B21A8';
const YELLOW = 'FEF9C3';
const NAVY   = '0B1E3C';
const WHITE  = 'FFFFFF';

// US Letter: 8.5" × 11" in DXA (1440 DXA = 1 inch)
// Content width with 1" margins = 12240 - 1440 - 1440 = 9360 DXA
const PAGE_W      = 12240;
const PAGE_H      = 15840;
const MARGIN      = 1440;
const CONTENT_W   = PAGE_W - MARGIN * 2; // 9360
const COL_HALF    = CONTENT_W / 2;       // 4680

const cellBorder = { style: BorderStyle.SINGLE, size: 4, color: 'auto' };
const borders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };

function makeRow(label, value, highlighted = false) {
  const fill    = highlighted ? YELLOW : WHITE;
  const shading = { fill, type: ShadingType.CLEAR };
  const margins = { top: 80, bottom: 80, left: 120, right: 120 };
  return new TableRow({
    children: [
      new TableCell({
        shading, borders, margins,
        width: { size: COL_HALF, type: WidthType.DXA },
        children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 18 })] })],
      }),
      new TableCell({
        shading, borders, margins,
        width: { size: COL_HALF, type: WidthType.DXA },
        children: [new Paragraph({ children: [new TextRun({ text: String(value ?? 'Not Available') || 'Not Available', size: 18 })] })],
      }),
    ],
  });
}

function makeTable(rows) {
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: [COL_HALF, COL_HALF],
    rows,
  });
}

function fmtClaims(v, isRate) {
  if (v === null || v === undefined) return 'Not Available';
  return isRate ? parseFloat(v).toFixed(2) : `${parseFloat(v).toFixed(1)}%`;
}

export async function generateDocx(ccn, apiData, manualInputs) {
  const { facility, stateAverages, nationalAverages, claimsMetrics } = apiData;
  const displayName = manualInputs.nameOverride || safe(facility.facilityName);
  const careUrl     = CARE_COMPARE(ccn, facility.state);

  const mainRows = [
    makeRow('Name of Facility',                             displayName),
    makeRow('Location',                                     formatAddress(facility)),
    makeRow('EMR',                                          manualInputs.emr),
    makeRow('Census Capacity',                              safe(facility.certifiedBeds)),
    makeRow('Current Census',                               manualInputs.currentCensus || safe(facility.avgResidentsPerDay)),
    makeRow('Type of Patient',                              manualInputs.patientType),
    makeRow('Previous Coverage from Medelite',              manualInputs.previousCoverage),
    makeRow('Previous Provider Performance from Medelite',  manualInputs.previousProviderPerformance
      ? `${manualInputs.previousProviderPerformance} Patients per day` : ''),
    makeRow('Medical Coverage',                             manualInputs.medicalCoverage),
  ];

  const ratingRows = [
    makeRow('Overall Star Rating',      facility.overallRating     || 'Not Available'),
    makeRow('Health Inspection',        facility.healthInspection   || 'Not Available'),
    makeRow('Staffing',                 facility.staffing           || 'Not Available'),
    makeRow('Quality of Resident Care', facility.qualityOfCare      || 'Not Available'),
  ];

  const claimsRows = claimsMetrics ? [
    makeRow('Short Term Hospitalization',            fmtClaims(claimsMetrics.shortTermHosp, false),    true),
    makeRow('STR National Avg. for Hospitalization', fmtClaims(nationalAverages?.shortTermHosp, false), true),
    makeRow('STR State Avg. for Hospitalization',    fmtClaims(stateAverages?.shortTermHosp, false),   true),
    makeRow('STR ED Visit',                          fmtClaims(claimsMetrics.shortTermEd, false),       true),
    makeRow('STR ED Visits National Avg.',           fmtClaims(nationalAverages?.shortTermEd, false),   true),
    makeRow('STR ED Visits State Avg.',              fmtClaims(stateAverages?.shortTermEd, false),     true),
    makeRow('LT Hospitalization',                    fmtClaims(claimsMetrics.ltHosp, true),            true),
    makeRow('LT National Avg. for Hospitalization',  fmtClaims(nationalAverages?.ltHosp, true),         true),
    makeRow('LT State Avg. for Hospitalization',     fmtClaims(stateAverages?.ltHosp, true),           true),
    makeRow('ED Visit',                              fmtClaims(claimsMetrics.ltEd, true),              true),
    makeRow('LT ED Visits National Avg.',            fmtClaims(nationalAverages?.ltEd, true),           true),
    makeRow('LT ED Visits State Avg.',               fmtClaims(stateAverages?.ltEd, true),            true),
  ] : [];

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          size: { width: PAGE_W, height: PAGE_H },
          margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
        },
      },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: '∞  INFINITE — Managed by MEDELITE', bold: true, size: 28, color: PURPLE })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun({ text: BANNER_LINE2, bold: true, size: 22, color: NAVY })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: safe(facility.state) || '—', bold: true, size: 32, color: PURPLE })],
        }),
        new Paragraph({ text: '' }),

        makeTable(mainRows),
        new Paragraph({ text: '' }),

        new Paragraph({ children: [new TextRun({ text: 'CMS Star Ratings', bold: true, size: 20, color: NAVY })] }),
        makeTable(ratingRows),
        new Paragraph({ text: '' }),

        ...(claimsRows.length ? [
          new Paragraph({ children: [new TextRun({ text: 'Claims Quality Metrics', bold: true, size: 20, color: NAVY })] }),
          makeTable(claimsRows),
          new Paragraph({ text: '' }),
        ] : []),

        // Clickable hyperlink — required by spec
        new Paragraph({
          children: [
            new TextRun({ text: 'Medicare Care Compare: ', bold: true, size: 18 }),
            new ExternalHyperlink({
              link: careUrl,
              children: [new TextRun({ text: careUrl, size: 18, color: PURPLE, style: 'Hyperlink' })],
            }),
          ],
        }),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `facility-assessment-${ccn}.docx`);
}
