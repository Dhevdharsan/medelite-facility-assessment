import { Document, Page, Text, View, StyleSheet, Link, pdf } from '@react-pdf/renderer';
import { BANNER_LINE1, BANNER_LINE2, CARE_COMPARE } from '../constants/branding.js';
import { safe, formatAddress } from './fieldMapper.js';

const S = StyleSheet.create({
  page: { padding: '28 36', fontFamily: 'Helvetica', backgroundColor: '#ffffff' },

  headerBg: { backgroundColor: '#0B1E3C', padding: '10 20', marginBottom: 0 },
  headerTitle: { color: '#ffffff', fontSize: 12, fontFamily: 'Helvetica-Bold', textAlign: 'center', letterSpacing: 1 },

  sectionBg: { backgroundColor: '#F8FAFF', padding: '6 20', borderBottom: '1 solid #E2E8F0', marginBottom: 10 },
  sectionTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold', textAlign: 'center', color: '#1E293B', letterSpacing: 2 },
  stateText: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: '#6B21A8', textAlign: 'center', marginTop: 1 },

  table: { marginBottom: 8 },
  row: { flexDirection: 'row', borderBottom: '1 solid #E2E8F0' },
  rowHighlight: { flexDirection: 'row', borderBottom: '1 solid #FDE68A', backgroundColor: '#FEFCE8' },
  cell: { flex: 1, padding: '3 8', fontSize: 8.5, color: '#475569', borderRight: '1 solid #E2E8F0' },
  cellLabel: { flex: 1, padding: '3 8', fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: '#1E293B', borderRight: '1 solid #E2E8F0' },
  cellLabelHL: { flex: 1, padding: '3 8', fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: '#92400E', borderRight: '1 solid #FDE68A' },
  cellHL: { flex: 1, padding: '3 8', fontSize: 8.5, color: '#78350F' },

  sectionHeader: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#6B7280', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4, marginTop: 8 },

  linkBox: { backgroundColor: '#F3EFFE', border: '1 solid #DDD6FE', borderRadius: 6, padding: '6 12', marginTop: 8, flexDirection: 'row', alignItems: 'center' },
  linkLabel: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#6B21A8', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 },
  link: { fontSize: 7.5, color: '#6B21A8', textDecoration: 'underline' },
  linkText: { flex: 1 },
});

function TableRow({ label, value, highlight }) {
  return (
    <View style={highlight ? S.rowHighlight : S.row}>
      <Text style={highlight ? S.cellLabelHL : S.cellLabel}>{label}</Text>
      <Text style={highlight ? S.cellHL : S.cell}>{value || 'Not Available'}</Text>
    </View>
  );
}

function fmtClaims(v, isRate) {
  if (v === null || v === undefined) return 'Not Available';
  return isRate ? parseFloat(v).toFixed(2) : `${parseFloat(v).toFixed(1)}%`;
}

export async function generatePDF(ccn, apiData, manualInputs) {
  const { facility, stateAverages, nationalAverages, claimsMetrics } = apiData;
  const displayName = manualInputs.nameOverride || safe(facility.facilityName);
  const careUrl = CARE_COMPARE(ccn, facility.state);

  const doc = (
    <Document title={`Facility Assessment — ${displayName}`} author="INFINITE Managed by MEDELITE">
      <Page size="A4" style={S.page}>

        {/* ── Static INFINITE Banner ── */}
        <View style={S.headerBg}>
          <Text style={S.headerTitle}>∞ {BANNER_LINE1}</Text>
        </View>

        <View style={S.sectionBg}>
          <Text style={S.sectionTitle}>{BANNER_LINE2}</Text>
          <Text style={S.stateText}>{safe(facility.state)}</Text>
        </View>

        {/* ── Main Fields ── */}
        <View style={S.table}>
          <TableRow label="Name of Facility"                              value={displayName} />
          <TableRow label="Location"                                      value={formatAddress(facility)} />
          <TableRow label="EMR"                                           value={manualInputs.emr} />
          <TableRow label="Census Capacity"                               value={safe(facility.certifiedBeds)} />
          <TableRow label="Current Census"                                value={manualInputs.currentCensus || safe(facility.avgResidentsPerDay)} />
          <TableRow label="Type of Patient"                               value={manualInputs.patientType} />
          <TableRow label="Previous Coverage from Medelite"               value={manualInputs.previousCoverage} />
          <TableRow
            label="Previous Provider Performance from Medelite"
            value={manualInputs.previousProviderPerformance
              ? `${manualInputs.previousProviderPerformance} Patients per day`
              : ''}
          />
          <TableRow label="Medical Coverage"                              value={manualInputs.medicalCoverage} />
        </View>

        {/* ── Star Ratings ── */}
        <Text style={S.sectionHeader}>CMS Star Ratings</Text>
        <View style={S.table}>
          <TableRow label="Overall Star Rating"       value={facility.overallRating   || 'Not Available'} />
          <TableRow label="Health Inspection"         value={facility.healthInspection || 'Not Available'} />
          <TableRow label="Staffing"                  value={facility.staffing         || 'Not Available'} />
          <TableRow label="Quality of Resident Care"  value={facility.qualityOfCare    || 'Not Available'} />
        </View>

        {/* ── Claims Metrics (Bonus) ── */}
        {claimsMetrics && (
          <>
            <Text style={S.sectionHeader}>Claims Quality Metrics</Text>
            <View style={S.table}>
              <TableRow highlight label="Short Term Hospitalization"            value={fmtClaims(claimsMetrics.shortTermHosp, false)} />
              <TableRow highlight label="STR National Avg. for Hospitalization" value={fmtClaims(nationalAverages?.shortTermHosp, false)} />
              <TableRow highlight label="STR State Avg. for Hospitalization"    value={fmtClaims(stateAverages?.shortTermHosp, false)} />
              <TableRow highlight label="STR ED Visit"                          value={fmtClaims(claimsMetrics.shortTermEd, false)} />
              <TableRow highlight label="STR ED Visits National Avg."           value={fmtClaims(nationalAverages?.shortTermEd, false)} />
              <TableRow highlight label="STR ED Visits State Avg."              value={fmtClaims(stateAverages?.shortTermEd, false)} />
              <TableRow highlight label="LT Hospitalization"                    value={fmtClaims(claimsMetrics.ltHosp, true)} />
              <TableRow highlight label="LT National Avg. for Hospitalization"  value={fmtClaims(nationalAverages?.ltHosp, true)} />
              <TableRow highlight label="LT State Avg. for Hospitalization"     value={fmtClaims(stateAverages?.ltHosp, true)} />
              <TableRow highlight label="ED Visit"                              value={fmtClaims(claimsMetrics.ltEd, true)} />
              <TableRow highlight label="LT ED Visits National Avg."            value={fmtClaims(nationalAverages?.ltEd, true)} />
              <TableRow highlight label="LT ED Visits State Avg."               value={fmtClaims(stateAverages?.ltEd, true)} />
            </View>
          </>
        )}

        {/* ── Clickable Medicare Link ── */}
        <View style={S.linkBox}>
          <View style={S.linkText}>
            <Text style={S.linkLabel}>Medicare Care Compare</Text>
            <Link src={careUrl} style={S.link}>{careUrl}</Link>
          </View>
        </View>

      </Page>
    </Document>
  );

  const blob = await pdf(doc).toBlob();
  return blob;
}
