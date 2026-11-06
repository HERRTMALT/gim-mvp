import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarDays,
  Dumbbell,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import type { PlannedExercise, Routine, RoutineDay, RoutinePlan } from '../../shared/types';
import { api, getErrorMessage } from '../lib/api';
import { formatDate } from '../lib/utils';
import { RoutineSummary } from '../components/RoutinePlanView';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Field,
  Input,
  LinkButton,
  LoadingBlock,
  PageHeader,
  Textarea,
} from '../components/ui';

const BLOCK_LABELS: Record<RoutineDay['blocks'][number]['type'], string> = {
  main: 'Bloque principal',
  accessory: 'Accesorios y prevención',
  conditioning: 'Cardio / acondicionamiento',
};

function newExercise(): PlannedExercise {
  return {
    exerciseId: null,
    name: 'Nuevo ejercicio',
    pattern: 'core',
    sets: 3,
    reps: '10-12',
    restSec: 60,
    rpe: 7,
    notes: '',
  };
}

function validatePlan(plan: RoutinePlan): string | null {
  if (plan.days.length === 0) return 'La rutina debe tener al menos un día.';
  for (const [dayIndex, day] of plan.days.entries()) {
    if (!day.name.trim()) return `El día ${dayIndex + 1} necesita un nombre.`;
    if (day.blocks.length === 0) return `El día ${dayIndex + 1} necesita al menos un bloque.`;
    for (const block of day.blocks) {
      if (block.exercises.length === 0) {
        return `El bloque "${BLOCK_LABELS[block.type]}" del día ${dayIndex + 1} no tiene ejercicios.`;
      }
      for (const exercise of block.exercises) {
        if (!exercise.name.trim()) {
          return `Hay un ejercicio sin nombre en el día ${dayIndex + 1}.`;
        }
        if (!exercise.pattern.trim()) {
          return `El ejercicio "${exercise.name}" necesita un patrón.`;
        }
        if (!exercise.reps.trim()) {
          return `El ejercicio "${exercise.name}" necesita repeticiones.`;
        }
        if (!Number.isInteger(exercise.sets) || exercise.sets < 1 || exercise.sets > 20) {
          return `Las series de "${exercise.name}" deben ser un número entre 1 y 20.`;
        }
        if (!Number.isInteger(exercise.restSec) || exercise.restSec < 0) {
          return `El descanso de "${exercise.name}" debe ser 0 o más segundos.`;
        }
      }
    }
  }
  if (!plan.progression.trim()) return 'Completá la progresión sugerida.';
  if (!plan.disclaimer.trim()) return 'Completá el aviso importante.';
  return null;
}

function cleanPlan(plan: RoutinePlan): RoutinePlan {
  return {
    ...plan,
    days: plan.days.map((day) => ({
      ...day,
      name: day.name.trim(),
      focus: day.focus.map((item) => item.trim()).filter(Boolean),
      warmup: day.warmup.map((item) => item.trim()).filter(Boolean),
      cooldown: day.cooldown.map((item) => item.trim()).filter(Boolean),
      notes: day.notes.trim(),
      blocks: day.blocks.map((block) => ({
        ...block,
        exercises: block.exercises.map((exercise) => ({
          ...exercise,
          name: exercise.name.trim(),
          pattern: exercise.pattern.trim(),
          reps: exercise.reps.trim(),
          notes: exercise.notes.trim(),
        })),
      })),
    })),
    progression: plan.progression.trim(),
    disclaimer: plan.disclaimer.trim(),
  };
}

function RoutineEditorContent({ routine }: { routine: Routine }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [plan, setPlan] = useState<RoutinePlan>(() => structuredClone(routine.plan));
  const [error, setError] = useState('');

  const updateDay = (dayIndex: number, patch: Partial<RoutineDay>) => {
    setPlan((previous) => ({
      ...previous,
      days: previous.days.map((day, index) =>
        index === dayIndex ? { ...day, ...patch } : day,
      ),
    }));
  };

  const updateExercise = (
    dayIndex: number,
    blockIndex: number,
    exerciseIndex: number,
    patch: Partial<PlannedExercise>,
  ) => {
    setPlan((previous) => ({
      ...previous,
      days: previous.days.map((day, dayPosition) =>
        dayPosition !== dayIndex
          ? day
          : {
              ...day,
              blocks: day.blocks.map((block, blockPosition) =>
                blockPosition !== blockIndex
                  ? block
                  : {
                      ...block,
                      exercises: block.exercises.map((exercise, exercisePosition) =>
                        exercisePosition !== exerciseIndex
                          ? exercise
                          : { ...exercise, ...patch },
                      ),
                    },
              ),
            },
      ),
    }));
  };

  const addExercise = (dayIndex: number, blockIndex: number) => {
    setPlan((previous) => ({
      ...previous,
      days: previous.days.map((day, index) =>
        index !== dayIndex
          ? day
          : {
              ...day,
              blocks: day.blocks.map((block, position) =>
                position === blockIndex
                  ? { ...block, exercises: [...block.exercises, newExercise()] }
                  : block,
              ),
            },
      ),
    }));
  };

  const removeExercise = (dayIndex: number, blockIndex: number, exerciseIndex: number) => {
    setPlan((previous) => ({
      ...previous,
      days: previous.days.map((day, index) =>
        index !== dayIndex
          ? day
          : {
              ...day,
              blocks: day.blocks.map((block, position) =>
                position === blockIndex
                  ? {
                      ...block,
                      exercises: block.exercises.filter(
                        (_, exercisePosition) => exercisePosition !== exerciseIndex,
                      ),
                    }
                  : block,
              ),
            },
      ),
    }));
  };

  const addDay = () => {
    setPlan((previous) => ({
      ...previous,
      days: [
        ...previous.days,
        {
          name: `Día ${previous.days.length + 1} · Personalizado`,
          focus: [],
          warmup: ['5 minutos de movimiento general.'],
          blocks: [{ type: 'main', exercises: [newExercise()] }],
          cooldown: [],
          notes: '',
        },
      ],
    }));
  };

  const removeDay = (dayIndex: number) => {
    setPlan((previous) =>
      previous.days.length <= 1
        ? previous
        : { ...previous, days: previous.days.filter((_, index) => index !== dayIndex) },
    );
  };

  const mutation = useMutation({
    mutationFn: (payload: RoutinePlan) =>
      api<{ routine: Routine }>(`/routines/${routine.id}`, {
        method: 'PATCH',
        body: { plan: payload },
      }),
    onSuccess: ({ routine: saved }) => {
      queryClient.invalidateQueries({ queryKey: ['member', String(saved.memberId)] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(`Rutina v${saved.version} guardada`);
      navigate(`/rutinas/${saved.id}`, { replace: true });
    },
    onError: (mutationError) => toast.error(getErrorMessage(mutationError)),
  });

  const save = () => {
    const cleaned = cleanPlan(plan);
    const validation = validatePlan(cleaned);
    if (validation) {
      setError(validation);
      toast.error(validation);
      return;
    }
    setError('');
    mutation.mutate(cleaned);
  };

  return (
    <div className="space-y-6">
      <div>
        <Link
          to={`/rutinas/${routine.id}`}
          className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" /> Volver a la rutina
        </Link>
        <PageHeader
          title={`Editar rutina v${routine.version}`}
          description={`${routine.memberName ?? 'Socio'} · ${routine.plan.summary.goalLabel} · ${formatDate(routine.createdAt)}`}
          actions={
            <>
              <LinkButton to={`/rutinas/${routine.id}`} variant="outline">
                Cancelar
              </LinkButton>
              <Button onClick={save} disabled={mutation.isPending}>
                <Save className="h-4 w-4" />
                {mutation.isPending ? 'Guardando…' : 'Guardar nueva versión'}
              </Button>
            </>
          }
        />
      </div>

      <Alert variant="info" title="Se va a crear una nueva versión">
        La versión actual queda intacta en el historial. Podés ajustar días, ejercicios, series,
        repeticiones y textos antes de guardar.
      </Alert>

      {error && (
        <Alert variant="danger" title="Revisá la rutina">
          {error}
        </Alert>
      )}

      {routine.warnings.length > 0 && (
        <Alert variant="warning" title="Advertencias de la versión original">
          <ul className="space-y-1">
            {routine.warnings.map((warning) => (
              <li key={warning} className="flex gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-current" />
                {warning}
              </li>
            ))}
          </ul>
        </Alert>
      )}

      <RoutineSummary plan={plan} />

      {plan.days.map((day, dayIndex) => (
        <Card key={dayIndex}>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Badge variant="brand">
                <CalendarDays className="h-3.5 w-3.5" /> Día {dayIndex + 1}
              </Badge>
              <Input
                value={day.name}
                onChange={(event) => updateDay(dayIndex, { name: event.target.value })}
                aria-label={`Nombre del día ${dayIndex + 1}`}
                className="font-semibold"
              />
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeDay(dayIndex)}
                  disabled={plan.days.length <= 1}
                  aria-label={`Eliminar día ${dayIndex + 1}`}
                  className="text-rose-600 hover:bg-rose-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <CardDescription className="mt-2">
              Ajustá el nombre, el enfoque y los ejercicios de este día.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field
              label="Enfoque"
              htmlFor={`day-focus-${dayIndex}`}
              hint="Separá los enfoques con comas. Ej.: Piernas, glúteos"
            >
              <Input
                id={`day-focus-${dayIndex}`}
                value={day.focus.join(', ')}
                onChange={(event) =>
                  updateDay(dayIndex, {
                    focus: event.target.value.split(',').map((item) => item.trim()),
                  })
                }
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Entrada en calor" htmlFor={`day-warmup-${dayIndex}`} hint="Un ítem por línea.">
                <Textarea
                  id={`day-warmup-${dayIndex}`}
                  className="min-h-28"
                  value={day.warmup.join('\n')}
                  onChange={(event) =>
                    updateDay(dayIndex, { warmup: event.target.value.split('\n') })
                  }
                />
              </Field>
              <Field label="Vuelta a la calma" htmlFor={`day-cooldown-${dayIndex}`} hint="Un ítem por línea.">
                <Textarea
                  id={`day-cooldown-${dayIndex}`}
                  className="min-h-28"
                  value={day.cooldown.join('\n')}
                  onChange={(event) =>
                    updateDay(dayIndex, { cooldown: event.target.value.split('\n') })
                  }
                />
              </Field>
            </div>

            {day.blocks.map((block, blockIndex) => (
              <div key={blockIndex} className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                  <div className="flex items-center gap-2">
                    <Dumbbell className="h-4 w-4 text-emerald-600" />
                    <h4 className="text-sm font-semibold text-slate-800">
                      {BLOCK_LABELS[block.type]}
                    </h4>
                    <span className="text-xs text-slate-400">
                      {block.exercises.length}{' '}
                      {block.exercises.length === 1 ? 'ejercicio' : 'ejercicios'}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addExercise(dayIndex, blockIndex)}
                  >
                    <Plus className="h-4 w-4" /> Agregar ejercicio
                  </Button>
                </div>

                <div className="space-y-3">
                  {block.exercises.map((exercise, exerciseIndex) => (
                    <div
                      key={exerciseIndex}
                      className="rounded-xl border border-slate-200 bg-slate-50/60 p-3"
                    >
                      <div className="flex items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <Field label="Ejercicio">
                            <Input
                              value={exercise.name}
                              onChange={(event) =>
                                updateExercise(dayIndex, blockIndex, exerciseIndex, {
                                  name: event.target.value,
                                })
                              }
                              aria-label={`Nombre del ejercicio ${exerciseIndex + 1}`}
                            />
                          </Field>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="mt-6 shrink-0 text-rose-600 hover:bg-rose-50"
                          onClick={() => removeExercise(dayIndex, blockIndex, exerciseIndex)}
                          aria-label={`Eliminar ${exercise.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
                        <Field label="Patrón">
                          <Input
                            value={exercise.pattern}
                            onChange={(event) =>
                              updateExercise(dayIndex, blockIndex, exerciseIndex, {
                                pattern: event.target.value,
                              })
                            }
                          />
                        </Field>
                        <Field label="Series">
                          <Input
                            type="number"
                            min={1}
                            max={20}
                            value={exercise.sets}
                            onChange={(event) =>
                              updateExercise(dayIndex, blockIndex, exerciseIndex, {
                                sets: Number(event.target.value),
                              })
                            }
                          />
                        </Field>
                        <Field label="Reps">
                          <Input
                            value={exercise.reps}
                            onChange={(event) =>
                              updateExercise(dayIndex, blockIndex, exerciseIndex, {
                                reps: event.target.value,
                              })
                            }
                          />
                        </Field>
                        <Field label="Descanso (s)">
                          <Input
                            type="number"
                            min={0}
                            max={600}
                            value={exercise.restSec}
                            onChange={(event) =>
                              updateExercise(dayIndex, blockIndex, exerciseIndex, {
                                restSec: Number(event.target.value),
                              })
                            }
                          />
                        </Field>
                        <Field label="RPE">
                          <Input
                            type="number"
                            min={1}
                            max={10}
                            value={exercise.rpe ?? ''}
                            onChange={(event) =>
                              updateExercise(dayIndex, blockIndex, exerciseIndex, {
                                rpe: event.target.value === '' ? null : Number(event.target.value),
                              })
                            }
                          />
                        </Field>
                      </div>

                      <Field label="Notas" className="mt-2">
                        <Input
                          value={exercise.notes}
                          onChange={(event) =>
                            updateExercise(dayIndex, blockIndex, exerciseIndex, {
                              notes: event.target.value,
                            })
                          }
                          placeholder="Indicaciones técnicas para este ejercicio…"
                        />
                      </Field>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <Field label="Notas del día" htmlFor={`day-notes-${dayIndex}`}>
              <Input
                id={`day-notes-${dayIndex}`}
                value={day.notes}
                onChange={(event) => updateDay(dayIndex, { notes: event.target.value })}
                placeholder="Opcional: indicaciones para este día…"
              />
            </Field>
          </CardContent>
        </Card>
      ))}

      <Button variant="outline" onClick={addDay} className="w-full">
        <Plus className="h-4 w-4" /> Agregar día
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Progresión y aviso</CardTitle>
          <CardDescription>Textos que se imprimen en el PDF de la rutina.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Progresión sugerida" htmlFor="plan-progression">
            <Textarea
              id="plan-progression"
              className="min-h-28"
              value={plan.progression}
              onChange={(event) =>
                setPlan((previous) => ({ ...previous, progression: event.target.value }))
              }
            />
          </Field>
          <Field label="Aviso importante" htmlFor="plan-disclaimer">
            <Textarea
              id="plan-disclaimer"
              className="min-h-24"
              value={plan.disclaimer}
              onChange={(event) =>
                setPlan((previous) => ({ ...previous, disclaimer: event.target.value }))
              }
            />
          </Field>
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse gap-2 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:justify-end">
        <LinkButton to={`/rutinas/${routine.id}`} variant="outline">
          Cancelar
        </LinkButton>
        <Button onClick={save} disabled={mutation.isPending}>
          <Save className="h-4 w-4" />
          {mutation.isPending ? 'Guardando…' : 'Guardar nueva versión'}
        </Button>
      </div>
    </div>
  );
}

export function RoutineEditorPage() {
  const { id } = useParams<{ id: string }>();

  const routineQuery = useQuery({
    queryKey: ['routine', id],
    queryFn: () => api<{ routine: Routine }>(`/routines/${id}`),
    enabled: Boolean(id),
  });

  if (routineQuery.isLoading) return <LoadingBlock label="Cargando rutina…" />;

  if (routineQuery.error || !routineQuery.data) {
    return (
      <div className="space-y-4">
        <LinkButton to="/socios" variant="outline" size="sm">
          <ArrowLeft className="h-4 w-4" /> Volver a socios
        </LinkButton>
        <Alert variant="danger" title="No pudimos cargar la rutina">
          {getErrorMessage(routineQuery.error)}
        </Alert>
      </div>
    );
  }

  return <RoutineEditorContent routine={routineQuery.data.routine} />;
}
