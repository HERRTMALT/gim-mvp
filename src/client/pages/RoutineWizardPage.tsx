import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Clock,
  Dumbbell,
  Flame,
  HeartPulse,
  Save,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  CONDITIONS,
  CONDITION_LABELS,
  EQUIPMENT,
  EQUIPMENT_LABELS,
  FOOTBALL_SEASONS,
  FOOTBALL_SEASON_LABELS,
  GOALS,
  GOAL_LABELS,
  LEVELS,
  LEVEL_LABELS,
  SPORTS,
  SPORT_LABELS,
  type Condition,
  type Equipment,
  type FootballSeason,
  type Goal,
  type Level,
  type Routine,
  type RoutineInput,
  type Sport,
} from '../../shared/types';
import { api, getErrorMessage } from '../lib/api';
import type { MemberDetail, RoutinePreview } from '../lib/types';
import { cn, ageFromBirthDate, fullName } from '../lib/utils';
import { RoutinePlanView, RoutineSummary } from '../components/RoutinePlanView';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Field,
  Input,
  LinkButton,
  LoadingBlock,
  PageHeader,
  Select,
  Textarea,
} from '../components/ui';

type WizardForm = {
  goal: Goal;
  level: Level;
  daysPerWeek: number;
  sessionMinutes: number;
  equipment: Equipment[];
  sport: Sport;
  footballSeason: FootballSeason;
  age: string;
  conditions: Condition[];
  injuries: string;
  medicalClearance: boolean;
  notes: string;
};

const GOAL_HINTS: Record<Goal, string> = {
  fat_loss: 'Reducir grasa con trabajo de fuerza y ritmo sostenido.',
  muscle_gain: 'Aumentar masa muscular y volumen de entrenamiento.',
  strength: 'Mejorar fuerza máxima con series más pesadas.',
  endurance: 'Mejorar resistencia y capacidad cardiovascular.',
  general_health: 'Moverse mejor, ganar técnica y constancia.',
};

const GOAL_ICONS: Record<Goal, LucideIcon> = {
  fat_loss: Flame,
  muscle_gain: Dumbbell,
  strength: TrendingUp,
  endurance: Activity,
  general_health: HeartPulse,
};

const LEVEL_HINTS: Record<Level, string> = {
  beginner: 'Recién empieza o vuelve después de un parate.',
  intermediate: 'Entrena con continuidad y conoce los ejercicios.',
  advanced: 'Tiene experiencia y buena técnica en cargas.',
};

const SPORT_HINTS: Record<Sport, string> = {
  none: 'Entrenamiento general sin foco deportivo.',
  recreational: 'Actividad recreativa ocasional.',
  football: 'Se prioriza fuerza de piernas, prevención y recuperación.',
};

const RED_FLAG_CONDITIONS: Condition[] = [
  'chest_pain',
  'dizziness',
  'heart_condition',
  'recent_surgery',
  'pregnancy',
];

const STEPS = [
  { title: 'Objetivo', subtitle: 'Meta y experiencia' },
  { title: 'Frecuencia', subtitle: 'Días y equipamiento' },
  { title: 'Salud', subtitle: 'Condiciones y seguridad' },
];

function buildInput(form: WizardForm, seed?: number): RoutineInput {
  const ageNumber = form.age.trim() ? Number(form.age) : undefined;
  return {
    goal: form.goal,
    level: form.level,
    daysPerWeek: form.daysPerWeek,
    sessionMinutes: form.sessionMinutes,
    equipment: form.equipment,
    sport: form.sport,
    footballSeason: form.footballSeason,
    age: ageNumber !== undefined && Number.isFinite(ageNumber) ? ageNumber : undefined,
    conditions: form.conditions,
    injuries: form.injuries.trim(),
    medicalClearance: form.medicalClearance,
    parq: [],
    notes: form.notes.trim(),
    ...(seed !== undefined ? { seed } : {}),
  };
}

function ChoiceCard({
  selected,
  onClick,
  title,
  description,
  icon: Icon,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  description?: string;
  icon?: LucideIcon;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-start gap-3 rounded-xl border p-4 text-left transition',
        selected
          ? 'border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-500/20'
          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50',
      )}
    >
      {Icon && (
        <span
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
            selected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500',
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
      )}
      <span className="min-w-0">
        <span className="flex items-center gap-2">
          <span className="font-semibold text-slate-900">{title}</span>
          {selected && <Check className="h-4 w-4 text-emerald-600" />}
        </span>
        {description && <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">{description}</span>}
      </span>
    </button>
  );
}

function StepIndicator({ current }: { current: number }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-2 sm:gap-4">
        {STEPS.map((step, index) => {
          const done = index < current;
          const active = index === current;
          return (
            <div key={step.title} className="flex flex-1 items-center gap-2">
              <span
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
                  done
                    ? 'bg-emerald-600 text-white'
                    : active
                      ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-500/30'
                      : 'bg-slate-100 text-slate-400',
                )}
              >
                {done ? <Check className="h-4 w-4" /> : index + 1}
              </span>
              <div className="hidden min-w-0 sm:block">
                <p className={cn('truncate text-sm font-medium', active ? 'text-slate-900' : 'text-slate-500')}>
                  {step.title}
                </p>
                <p className="truncate text-xs text-slate-400">{step.subtitle}</p>
              </div>
              {index < STEPS.length - 1 && <div className="h-px flex-1 bg-slate-200" />}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function RoutineWizardContent({ detail }: { detail: MemberDetail }) {
  const { member } = detail;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);

  const initialDays = member.currentMembership?.daysPerWeek;
  const [form, setForm] = useState<WizardForm>({
    goal: 'general_health',
    level: 'beginner',
    daysPerWeek: initialDays && [3, 4, 5].includes(initialDays) ? initialDays : 3,
    sessionMinutes: 60,
    equipment: ['bodyweight', 'dumbbells', 'machines', 'bench', 'bands'],
    sport: 'none',
    footballSeason: 'off_season',
    age: String(ageFromBirthDate(member.birthDate) ?? ''),
    conditions: member.health?.conditions ?? [],
    injuries: member.health?.injuries ?? '',
    medicalClearance: member.health?.medicalClearance ?? false,
    notes: '',
  });

  const update = <K extends keyof WizardForm,>(key: K, value: WizardForm[K]) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const toggleEquipment = (equipment: Equipment, checked: boolean) => {
    update(
      'equipment',
      checked
        ? [...form.equipment.filter((item) => item !== equipment), equipment]
        : form.equipment.filter((item) => item !== equipment),
    );
  };

  const toggleCondition = (condition: Condition, checked: boolean) => {
    update(
      'conditions',
      checked
        ? [...form.conditions.filter((item) => item !== condition), condition]
        : form.conditions.filter((item) => item !== condition),
    );
  };

  const previewMutation = useMutation({
    mutationFn: (input: RoutineInput) =>
      api<RoutinePreview>(`/members/${member.id}/routines/preview`, {
        method: 'POST',
        body: input,
      }),
    onSuccess: () => window.scrollTo({ top: 0, behavior: 'smooth' }),
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const saveMutation = useMutation({
    mutationFn: (input: RoutineInput) =>
      api<{ routine: Routine }>(`/members/${member.id}/routines`, {
        method: 'POST',
        body: { input, plan: previewMutation.data?.plan },
      }),
    onSuccess: ({ routine }) => {
      queryClient.invalidateQueries({ queryKey: ['member', String(member.id)] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(`Rutina v${routine.version} guardada`);
      navigate(`/rutinas/${routine.id}`, { replace: true });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const preview = previewMutation.data;
  const hasRedFlag = form.conditions.some((condition) => RED_FLAG_CONDITIONS.includes(condition));
  const canGenerate =
    form.equipment.length > 0 && !hasRedFlag && !previewMutation.isPending;

  const generate = () => {
    previewMutation.mutate(buildInput(form));
  };

  const save = () => {
    if (!preview) return;
    saveMutation.mutate(buildInput(form, preview.seed));
  };

  if (preview) {
    return (
      <div className="space-y-6">
        <div>
          <button
            type="button"
            onClick={() => previewMutation.reset()}
            className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="h-4 w-4" /> Ajustar datos
          </button>
          <PageHeader
            title="Vista previa de la rutina"
            description={`Para ${fullName(member)}. Revisá el plan antes de guardarlo.`}
            actions={
              <>
                <Button variant="outline" onClick={() => previewMutation.reset()}>
                  Ajustar datos
                </Button>
                <Button onClick={save} disabled={saveMutation.isPending}>
                  <Save className="h-4 w-4" />
                  {saveMutation.isPending ? 'Guardando…' : 'Guardar rutina'}
                </Button>
              </>
            }
          />
        </div>

        <Alert variant="info" title="Todavía no está guardada">
          Esta es una previsualización generada con tus datos. Al guardar se crea una nueva versión
          en el historial del socio.
        </Alert>

        <RoutineSummary plan={preview.plan} />

        <RoutinePlanView plan={preview.plan} warnings={preview.warnings} />

        <div className="flex flex-col-reverse gap-2 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => previewMutation.reset()}>
            Ajustar datos
          </Button>
          <Button onClick={save} disabled={saveMutation.isPending}>
            <Save className="h-4 w-4" />
            {saveMutation.isPending ? 'Guardando…' : 'Guardar rutina'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to={`/socios/${member.id}`}
          className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" /> Volver al socio
        </Link>
        <PageHeader
          title="Nueva rutina"
          description={`Generador automático para ${fullName(member)}.`}
          actions={
            <LinkButton to={`/socios/${member.id}`} variant="outline">
              Cancelar
            </LinkButton>
          }
        />
      </div>

      <StepIndicator current={step} />

      {previewMutation.error && (
        <Alert variant="danger" title="No se pudo generar la rutina">
          {getErrorMessage(previewMutation.error)}
        </Alert>
      )}

      {step === 0 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>¿Cuál es el objetivo?</CardTitle>
              <CardDescription>La selección de ejercicios y series se adapta a esta meta.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {GOALS.map((goal) => (
                <ChoiceCard
                  key={goal}
                  selected={form.goal === goal}
                  onClick={() => update('goal', goal)}
                  title={GOAL_LABELS[goal]}
                  description={GOAL_HINTS[goal]}
                  icon={GOAL_ICONS[goal]}
                />
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Experiencia</CardTitle>
              <CardDescription>Define la dificultad y el volumen inicial.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              {LEVELS.map((level) => (
                <ChoiceCard
                  key={level}
                  selected={form.level === level}
                  onClick={() => update('level', level)}
                  title={LEVEL_LABELS[level]}
                  description={LEVEL_HINTS[level]}
                />
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Deporte y edad</CardTitle>
              <CardDescription>El fútbol agrega trabajo preventivo y ajusta el volumen.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                {SPORTS.map((sport) => (
                  <ChoiceCard
                    key={sport}
                    selected={form.sport === sport}
                    onClick={() => update('sport', sport)}
                    title={SPORT_LABELS[sport]}
                    description={SPORT_HINTS[sport]}
                  />
                ))}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {form.sport === 'football' && (
                  <Field label="Momento de la temporada" htmlFor="football-season">
                    <Select
                      id="football-season"
                      value={form.footballSeason}
                      onChange={(event) =>
                        update('footballSeason', event.target.value as FootballSeason)
                      }
                    >
                      {FOOTBALL_SEASONS.map((season) => (
                        <option key={season} value={season}>
                          {FOOTBALL_SEASON_LABELS[season]}
                        </option>
                      ))}
                    </Select>
                  </Field>
                )}
                <Field
                  label="Edad"
                  htmlFor="age"
                  hint="Opcional. Ayuda a ajustar la progresión."
                >
                  <Input
                    id="age"
                    type="number"
                    min={10}
                    max={100}
                    inputMode="numeric"
                    placeholder="Ej.: 32"
                    value={form.age}
                    onChange={(event) => update('age', event.target.value)}
                  />
                </Field>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex-row items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Frecuencia semanal</CardTitle>
                <CardDescription>Se arma un split específico para 3, 4 o 5 días.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {[3, 4, 5].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => update('daysPerWeek', days)}
                    className={cn(
                      'rounded-xl border p-4 text-center transition',
                      form.daysPerWeek === days
                        ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50',
                    )}
                  >
                    <p className="text-2xl font-bold text-slate-900">{days}</p>
                    <p className="text-xs text-slate-500">días / semana</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Duración de la sesión</CardTitle>
                <CardDescription>Tiempo aproximado disponible por día.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-2">
                {[45, 60, 75, 90].map((minutes) => (
                  <button
                    key={minutes}
                    type="button"
                    onClick={() => update('sessionMinutes', minutes)}
                    className={cn(
                      'rounded-xl border p-3 text-center transition',
                      form.sessionMinutes === minutes
                        ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50',
                    )}
                  >
                    <p className="text-lg font-bold text-slate-900">{minutes}</p>
                    <p className="text-xs text-slate-500">min</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Equipamiento disponible</CardTitle>
              <CardDescription>Seleccioná todo lo que el socio puede usar.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {EQUIPMENT.map((equipment) => (
                  <label
                    key={equipment}
                    className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-slate-200 p-3 text-sm transition hover:border-emerald-300 hover:bg-emerald-50/40"
                  >
                    <Checkbox
                      checked={form.equipment.includes(equipment)}
                      onChange={(event) => toggleEquipment(equipment, event.target.checked)}
                    />
                    <span className="text-slate-700">{EQUIPMENT_LABELS[equipment]}</span>
                  </label>
                ))}
              </div>
              {form.equipment.length === 0 && (
                <Alert variant="warning">Elegí al menos un equipamiento para continuar.</Alert>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex-row items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Salud y condiciones</CardTitle>
                <CardDescription>Las restricciones modifican la selección de ejercicios.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {CONDITIONS.map((condition) => (
                  <label
                    key={condition}
                    className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-slate-200 p-3 text-sm transition hover:border-emerald-300 hover:bg-emerald-50/40"
                  >
                    <Checkbox
                      className="mt-0.5"
                      checked={form.conditions.includes(condition)}
                      onChange={(event) => toggleCondition(condition, event.target.checked)}
                    />
                    <span className="text-slate-700">{CONDITION_LABELS[condition]}</span>
                  </label>
                ))}
              </div>

              {hasRedFlag && (
                <Alert variant="danger" title="Se requiere evaluación médica">
                  Una de las condiciones seleccionadas (dolor de pecho, mareos, enfermedad cardíaca,
                  cirugía reciente o embarazo) impide generar una rutina automática. Registrá el apto
                  médico y consultá con un profesional antes de continuar.
                </Alert>
              )}

              <Field label="Lesiones o molestias" htmlFor="routine-injuries">
                <Textarea
                  id="routine-injuries"
                  className="min-h-20"
                  placeholder="Describí cualquier molestia que deba tenerse en cuenta…"
                  value={form.injuries}
                  onChange={(event) => update('injuries', event.target.value)}
                />
              </Field>

              <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-slate-200 p-4 text-sm">
                <Checkbox
                  className="mt-0.5"
                  checked={form.medicalClearance}
                  onChange={(event) => update('medicalClearance', event.target.checked)}
                />
                <span>
                  <span className="font-medium text-slate-800">El socio tiene apto médico vigente</span>
                  <span className="block text-xs text-slate-500">
                    Si no está marcado, la rutina se genera pero incluye una advertencia para no
                    entregarla sin autorización médica.
                  </span>
                </span>
              </label>

              <Field label="Indicaciones para esta rutina" htmlFor="routine-notes">
                <Textarea
                  id="routine-notes"
                  className="min-h-20"
                  placeholder="Opcional: preferencias, horarios, observaciones…"
                  value={form.notes}
                  onChange={(event) => update('notes', event.target.value)}
                />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resumen de la configuración</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Objetivo</p>
                <p className="font-medium text-slate-800">{GOAL_LABELS[form.goal]}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Nivel</p>
                <p className="font-medium text-slate-800">{LEVEL_LABELS[form.level]}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Frecuencia</p>
                <p className="font-medium text-slate-800">
                  {form.daysPerWeek} días · {form.sessionMinutes} min
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Enfoque</p>
                <p className="font-medium text-slate-800">
                  {SPORT_LABELS[form.sport]}
                  {form.sport === 'football'
                    ? ` · ${FOOTBALL_SEASON_LABELS[form.footballSeason]}`
                    : ''}
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs uppercase tracking-wide text-slate-400">Equipamiento</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {form.equipment.map((equipment) => (
                    <Badge key={equipment} variant="neutral">
                      {EQUIPMENT_LABELS[equipment]}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-1.5 text-xs text-slate-400">
          <Target className="h-4 w-4" />
          Paso {step + 1} de {STEPS.length}
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          {step > 0 ? (
            <Button variant="outline" onClick={() => setStep((value) => value - 1)}>
              <ArrowLeft className="h-4 w-4" /> Atrás
            </Button>
          ) : (
            <LinkButton to={`/socios/${member.id}`} variant="outline">
              Cancelar
            </LinkButton>
          )}

          {step < STEPS.length - 1 ? (
            <Button
              onClick={() => setStep((value) => value + 1)}
              disabled={step === 1 && form.equipment.length === 0}
            >
              Continuar <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={generate} disabled={!canGenerate}>
              <Sparkles className="h-4 w-4" />
              {previewMutation.isPending ? 'Generando…' : 'Generar rutina'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function RoutineWizardPage() {
  const { id } = useParams<{ id: string }>();

  const memberQuery = useQuery({
    queryKey: ['member', id],
    queryFn: () => api<MemberDetail>(`/members/${id}`),
    enabled: Boolean(id),
  });

  if (memberQuery.isLoading) return <LoadingBlock label="Cargando socio…" />;

  if (memberQuery.error || !memberQuery.data) {
    return (
      <div className="space-y-4">
        <LinkButton to="/socios" variant="outline" size="sm">
          <ArrowLeft className="h-4 w-4" /> Volver a socios
        </LinkButton>
        <Alert variant="danger" title="No pudimos cargar el socio">
          {getErrorMessage(memberQuery.error)}
        </Alert>
      </div>
    );
  }

  return <RoutineWizardContent detail={memberQuery.data} />;
}
