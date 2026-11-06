import {
  EQUIPMENT_LABELS,
  GOAL_LABELS,
  LEVEL_LABELS,
  SPORT_LABELS,
  type RoutineDay,
  type RoutinePlan,
} from '../../shared/types';
import { Alert, Badge, Card, CardContent, CardHeader, CardTitle } from './ui';

const BLOCK_LABELS: Record<RoutineDay['blocks'][number]['type'], string> = {
  main: 'Bloque principal',
  accessory: 'Accesorios y prevención',
  conditioning: 'Cardio / acondicionamiento',
};

const BLOCK_STYLES: Record<RoutineDay['blocks'][number]['type'], { dot: string }> = {
  main: { dot: 'bg-emerald-500' },
  accessory: { dot: 'bg-sky-500' },
  conditioning: { dot: 'bg-amber-500' },
};

export function RoutineSummary({ plan }: { plan: RoutinePlan }) {
  const { summary } = plan;
  const items = [
    { label: 'Objetivo', value: GOAL_LABELS[summary.goal] },
    { label: 'Nivel', value: LEVEL_LABELS[summary.level] },
    { label: 'Frecuencia', value: `${summary.daysPerWeek} días / semana` },
    { label: 'Sesión', value: `${summary.sessionMinutes} minutos` },
    { label: 'Enfoque', value: SPORT_LABELS[summary.sport] },
    {
      label: 'Equipamiento',
      value: summary.equipment.map((item) => EQUIPMENT_LABELS[item]).join(', '),
    },
  ];

  return (
    <Card>
      <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {items.map((item) => (
          <div key={item.label}>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {item.label}
            </p>
            <p className="mt-0.5 text-sm font-medium text-slate-800">{item.value}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ExerciseTable({ day }: { day: RoutineDay }) {
  const { blocks } = day;
  return (
    <div className="space-y-4">
      {blocks.map((block) => {
        const style = BLOCK_STYLES[block.type];
        return (
          <div key={`${day.name}-${block.type}`}>
            <div className="mb-2 flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${style.dot}`} />
              <h4 className="text-sm font-semibold text-slate-800">
                {BLOCK_LABELS[block.type]}
              </h4>
              <span className="text-xs text-slate-400">
                {block.exercises.length}{' '}
                {block.exercises.length === 1 ? 'ejercicio' : 'ejercicios'}
              </span>
            </div>

            <div className="hidden overflow-hidden rounded-xl border border-slate-200 sm:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Ejercicio</th>
                    <th className="px-2 py-2 text-center font-semibold">Series</th>
                    <th className="px-2 py-2 text-center font-semibold">Reps</th>
                    <th className="px-2 py-2 text-center font-semibold">Descanso</th>
                    <th className="px-2 py-2 text-center font-semibold">RPE</th>
                    <th className="px-3 py-2 font-semibold">Notas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {block.exercises.map((exercise, index) => (
                    <tr key={`${exercise.name}-${index}`} className="align-top">
                      <td className="px-3 py-2.5 font-medium text-slate-800">{exercise.name}</td>
                      <td className="px-2 py-2.5 text-center text-slate-700">{exercise.sets}</td>
                      <td className="px-2 py-2.5 text-center text-slate-700">{exercise.reps}</td>
                      <td className="px-2 py-2.5 text-center text-slate-700">
                        {exercise.restSec ? `${exercise.restSec}s` : '—'}
                      </td>
                      <td className="px-2 py-2.5 text-center text-slate-700">
                        {exercise.rpe ?? '—'}
                      </td>
                      <td className="px-3 py-2.5 text-xs leading-relaxed text-slate-500">
                        {exercise.notes || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="space-y-2 sm:hidden">
              {block.exercises.map((exercise, index) => (
                <li
                  key={`${exercise.name}-${index}`}
                  className="rounded-xl border border-slate-200 p-3"
                >
                  <p className="font-medium text-slate-800">{exercise.name}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge variant="neutral">{exercise.sets} series</Badge>
                    <Badge variant="neutral">{exercise.reps}</Badge>
                    {exercise.restSec > 0 && (
                      <Badge variant="neutral">Desc. {exercise.restSec}s</Badge>
                    )}
                    {exercise.rpe !== null && <Badge variant="neutral">RPE {exercise.rpe}</Badge>}
                  </div>
                  {exercise.notes && (
                    <p className="mt-2 text-xs leading-relaxed text-slate-500">{exercise.notes}</p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <ul className="mt-1.5 space-y-1">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm text-slate-600">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-400" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function RoutinePlanView({
  plan,
  warnings,
}: {
  plan: RoutinePlan;
  warnings?: string[];
}) {
  return (
    <div className="space-y-6">
      {warnings && warnings.length > 0 && (
        <Alert variant="warning" title="Antes de comenzar">
          <ul className="space-y-1">
            {warnings.map((warning) => (
              <li key={warning} className="flex gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-current" />
                {warning}
              </li>
            ))}
          </ul>
        </Alert>
      )}

      {plan.days.map((day, index) => (
        <Card key={day.name}>
          <CardHeader className="flex-row items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                  {index + 1}
                </span>
                <CardTitle>{day.name}</CardTitle>
              </div>
              {day.focus.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pl-9">
                  {day.focus.map((focus) => (
                    <Badge key={focus} variant="neutral">
                      {focus}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ListBlock title="Entrada en calor" items={day.warmup} />
            <ExerciseTable day={day} />
            <ListBlock title="Vuelta a la calma" items={day.cooldown} />
            {day.notes && <Alert variant="info">{day.notes}</Alert>}
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader>
          <CardTitle>Progresión sugerida</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">
            {plan.progression}
          </p>
        </CardContent>
      </Card>

      <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs leading-relaxed text-slate-500">
        <p className="mb-1 font-semibold uppercase tracking-wide text-slate-400">
          Aviso importante
        </p>
        {plan.disclaimer}
      </div>
    </div>
  );
}
