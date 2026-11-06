import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import type { Member, Routine } from '../../../shared/types';
import { env } from '../../config/env';
import { displayDate } from '../../shared/dates';

const styles = StyleSheet.create({
  page: {
    paddingTop: 34,
    paddingBottom: 34,
    paddingHorizontal: 34,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: '#172033',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 2,
    borderBottomColor: '#0f766e',
    paddingBottom: 10,
    marginBottom: 12,
  },
  gymName: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: '#0f766e' },
  gymMeta: { fontSize: 8, color: '#475569', marginTop: 2 },
  title: { fontSize: 15, fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  subtitle: { fontSize: 8, color: '#64748b' },
  section: { marginTop: 10 },
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#0f766e',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  infoItem: { width: '48%', marginBottom: 3 },
  label: { color: '#64748b', fontSize: 7.5 },
  value: { color: '#172033', fontSize: 9 },
  warningBox: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#f59e0b',
    backgroundColor: '#fffbeb',
    padding: 7,
    borderRadius: 4,
  },
  warningText: { fontSize: 8, color: '#92400e', marginBottom: 2 },
  day: { marginTop: 12, borderTopWidth: 1, borderTopColor: '#cbd5e1', paddingTop: 8 },
  dayTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#0f172a' },
  dayFocus: { fontSize: 8, color: '#64748b', marginTop: 1, marginBottom: 5 },
  listLabel: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#475569', marginTop: 4 },
  listItem: { fontSize: 8, color: '#334155', marginLeft: 8, marginTop: 1 },
  table: { marginTop: 5, borderWidth: 1, borderColor: '#cbd5e1' },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    paddingVertical: 4,
    paddingHorizontal: 3,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 4,
    paddingHorizontal: 3,
  },
  cellExercise: { width: '32%', paddingRight: 3 },
  cellSets: { width: '8%', textAlign: 'center' },
  cellReps: { width: '12%', textAlign: 'center' },
  cellRest: { width: '12%', textAlign: 'center' },
  cellRpe: { width: '8%', textAlign: 'center' },
  cellNotes: { width: '28%', paddingLeft: 3 },
  headerText: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#334155' },
  cellText: { fontSize: 7.5, color: '#1e293b' },
  blockLabel: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#0f766e', marginTop: 4 },
  notes: { fontSize: 8, color: '#475569', marginTop: 4 },
  progression: { fontSize: 8.5, color: '#334155', lineHeight: 1.4, marginTop: 4 },
  disclaimer: {
    marginTop: 12,
    paddingTop: 7,
    borderTopWidth: 1,
    borderTopColor: '#cbd5e1',
    fontSize: 7.5,
    color: '#64748b',
    lineHeight: 1.35,
  },
  footer: {
    position: 'absolute',
    bottom: 18,
    left: 34,
    right: 34,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7,
    color: '#94a3b8',
  },
});

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoItem}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value || '—'}</Text>
    </View>
  );
}

export function RoutineDocument({ routine, member }: { routine: Routine; member: Member }) {
  const { plan } = routine;
  const memberName = `${member.lastName}, ${member.firstName}`;
  const age = member.birthDate
    ? Math.max(
        0,
        Math.floor(
          (Date.now() - new Date(`${member.birthDate}T12:00:00`).getTime()) /
            (365.25 * 24 * 60 * 60 * 1000),
        ),
      )
    : null;

  return (
    <Document
      title={`Rutina ${memberName} v${routine.version}`}
      author={env.GYM_NAME}
      subject="Plan de entrenamiento"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.gymName}>{env.GYM_NAME}</Text>
            <Text style={styles.gymMeta}>
              {[env.GYM_ADDRESS, env.GYM_PHONE].filter(Boolean).join(' · ') || 'Entrenamiento y salud'}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.title}>Plan de entrenamiento</Text>
            <Text style={styles.subtitle}>
              Versión {routine.version} · {displayDate(routine.createdAt.slice(0, 10))}
            </Text>
          </View>
        </View>

        <View style={styles.infoGrid}>
          <Row label="Socio" value={memberName} />
          <Row label="DNI" value={member.dni ?? '—'} />
          <Row label="Edad" value={age ? `${age} años` : '—'} />
          <Row label="Frecuencia" value={`${plan.summary.daysPerWeek} días por semana`} />
          <Row label="Objetivo" value={plan.summary.goalLabel} />
          <Row label="Nivel" value={plan.summary.levelLabel} />
          <Row label="Enfoque" value={plan.summary.sportLabel} />
          <Row label="Duración de sesión" value={`${plan.summary.sessionMinutes} minutos`} />
        </View>

        {routine.warnings.length > 0 && (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>Antes de comenzar</Text>
            {routine.warnings.map((warning) => (
              <Text key={warning} style={styles.warningText}>
                • {warning}
              </Text>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cómo leer el plan</Text>
          <Text style={styles.progression}>
            Series y repeticiones son una guía. El RPE va de 1 a 10: 6 es un esfuerzo moderado y 8
            es exigente pero técnico. Los descansos se expresan en segundos. Ante cualquier dolor,
            mareo o falta de aire anormal, detené la sesión y consultá a un profesional.
          </Text>
        </View>

        {plan.days.map((day) => (
          <View key={day.name} style={styles.day} wrap={false}>
            <Text style={styles.dayTitle}>{day.name}</Text>
            <Text style={styles.dayFocus}>{day.focus.join(' · ')}</Text>

            <Text style={styles.listLabel}>Entrada en calor</Text>
            {day.warmup.map((item) => (
              <Text key={item} style={styles.listItem}>
                • {item}
              </Text>
            ))}

            {day.blocks.map((block) => (
              <View key={`${day.name}-${block.type}`}>
                <Text style={styles.blockLabel}>
                  {block.type === 'main'
                    ? 'Bloque principal'
                    : block.type === 'accessory'
                      ? 'Accesorios y prevención'
                      : 'Cardio / acondicionamiento'}
                </Text>
                <View style={styles.table}>
                  <View style={styles.tableHeader}>
                    <Text style={[styles.headerText, styles.cellExercise]}>Ejercicio</Text>
                    <Text style={[styles.headerText, styles.cellSets]}>Series</Text>
                    <Text style={[styles.headerText, styles.cellReps]}>Reps</Text>
                    <Text style={[styles.headerText, styles.cellRest]}>Descanso</Text>
                    <Text style={[styles.headerText, styles.cellRpe]}>RPE</Text>
                    <Text style={[styles.headerText, styles.cellNotes]}>Notas</Text>
                  </View>
                  {block.exercises.map((exercise, index) => (
                    <View key={`${exercise.name}-${index}`} style={styles.tableRow} wrap={false}>
                      <Text style={[styles.cellText, styles.cellExercise]}>{exercise.name}</Text>
                      <Text style={[styles.cellText, styles.cellSets]}>{exercise.sets}</Text>
                      <Text style={[styles.cellText, styles.cellReps]}>{exercise.reps}</Text>
                      <Text style={[styles.cellText, styles.cellRest]}>
                        {exercise.restSec ? `${exercise.restSec}s` : '—'}
                      </Text>
                      <Text style={[styles.cellText, styles.cellRpe]}>{exercise.rpe ?? '—'}</Text>
                      <Text style={[styles.cellText, styles.cellNotes]}>{exercise.notes}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}

            <Text style={styles.listLabel}>Vuelta a la calma</Text>
            {day.cooldown.map((item) => (
              <Text key={item} style={styles.listItem}>
                • {item}
              </Text>
            ))}
            {day.notes ? <Text style={styles.notes}>{day.notes}</Text> : null}
          </View>
        ))}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Progresión</Text>
          <Text style={styles.progression}>{plan.progression}</Text>
        </View>

        <Text style={styles.disclaimer}>{plan.disclaimer}</Text>

        <View style={styles.footer} fixed>
          <Text>
            {env.GYM_NAME} · {memberName}
          </Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `Página ${pageNumber} de ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
