import {
  EQUIPMENT_LABELS,
  GOAL_LABELS,
  LEVEL_LABELS,
  SPORT_LABELS,
  type Condition,
  type RoutineInput,
  type RoutinePlan,
  type RoutineDay,
  type PlannedExercise,
} from '../../../shared/types';
import type { ExerciseSeed, ExercisePattern } from './exercises';

export const RULES_VERSION = '1.0.0';

export class RoutineSafetyError extends Error {
  code = 'ROUTINE_SAFETY';
}

type SlotPattern = ExercisePattern | 'accessory';

type DayTemplate = {
  name: string;
  focus: string[];
  slots: SlotPattern[];
};

const RED_FLAGS: Condition[] = [
  'chest_pain',
  'dizziness',
  'heart_condition',
  'recent_surgery',
  'pregnancy',
];

const CONDITION_CONTRAINDICATIONS: Record<Condition, string[]> = {
  knee_pain: ['knee_flexion', 'impact'],
  shoulder_pain: ['overhead', 'shoulder_load'],
  lower_back_pain: ['spinal_load', 'heavy_hinge'],
  hypertension: ['valsalva', 'high_intensity'],
  asthma: ['high_intensity'],
  diabetes: ['high_intensity'],
  pregnancy: [],
  heart_condition: [],
  recent_surgery: [],
  dizziness: [],
  chest_pain: [],
  other: [],
};

const SPLITS: Record<number, DayTemplate[]> = {
  3: [
    {
      name: 'Día 1 · Cuerpo completo',
      focus: ['Cuerpo completo'],
      slots: ['squat', 'push_horizontal', 'pull_horizontal', 'core', 'accessory'],
    },
    {
      name: 'Día 2 · Cuerpo completo',
      focus: ['Cuerpo completo'],
      slots: ['hinge', 'push_vertical', 'pull_vertical', 'lunge', 'core'],
    },
    {
      name: 'Día 3 · Cuerpo completo',
      focus: ['Cuerpo completo'],
      slots: ['squat', 'hinge', 'push_horizontal', 'pull_horizontal', 'core'],
    },
  ],
  4: [
    {
      name: 'Día 1 · Tren superior',
      focus: ['Tren superior'],
      slots: ['push_horizontal', 'pull_horizontal', 'push_vertical', 'pull_vertical', 'core'],
    },
    {
      name: 'Día 2 · Tren inferior',
      focus: ['Tren inferior'],
      slots: ['squat', 'hinge', 'lunge', 'calf', 'core'],
    },
    {
      name: 'Día 3 · Tren superior',
      focus: ['Tren superior'],
      slots: ['push_vertical', 'pull_vertical', 'push_horizontal', 'pull_horizontal', 'accessory'],
    },
    {
      name: 'Día 4 · Tren inferior',
      focus: ['Tren inferior'],
      slots: ['hinge', 'squat', 'lunge', 'calf', 'core'],
    },
  ],
  5: [
    {
      name: 'Día 1 · Empuje',
      focus: ['Pecho', 'hombros', 'tríceps'],
      slots: ['push_horizontal', 'push_vertical', 'push_horizontal', 'core', 'accessory'],
    },
    {
      name: 'Día 2 · Tracción',
      focus: ['Espalda', 'bíceps'],
      slots: ['pull_horizontal', 'pull_vertical', 'pull_horizontal', 'core', 'accessory'],
    },
    {
      name: 'Día 3 · Piernas',
      focus: ['Piernas', 'glúteos'],
      slots: ['squat', 'hinge', 'lunge', 'calf', 'core'],
    },
    {
      name: 'Día 4 · Tren superior',
      focus: ['Tren superior'],
      slots: ['push_vertical', 'pull_horizontal', 'push_horizontal', 'pull_vertical', 'core'],
    },
    {
      name: 'Día 5 · Tren inferior',
      focus: ['Piernas', 'glúteos'],
      slots: ['hinge', 'squat', 'lunge', 'calf', 'core'],
    },
  ],
};

const FOOTBALL_ACCESSORIES = [
  'curl-nordico',
  'copenhagen-plank',
  'aductores-banda',
  'caminata-lateral-banda',
  'elevacion-talones-pie',
  'peso-muerto-una-pierna',
];

const FOOTBALL_FOCUS = ['fútbol', 'lower', 'piernas'];

const FALLBACK_PATTERNS: Partial<Record<SlotPattern, ExercisePattern[]>> = {
  squat: ['hinge', 'calf', 'core', 'carry'],
  lunge: ['hinge', 'calf', 'core', 'carry'],
  hinge: ['squat', 'calf', 'core'],
  push_horizontal: ['pull_horizontal', 'core'],
  push_vertical: ['pull_horizontal', 'core'],
  pull_horizontal: ['push_horizontal', 'core'],
  pull_vertical: ['push_horizontal', 'core'],
  calf: ['core', 'carry'],
  conditioning: ['core'],
};

function levelNumber(level: RoutineInput['level']): number {
  return level === 'beginner' ? 1 : level === 'intermediate' ? 2 : 3;
}

function mulberry32(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    const current = copy[i];
    const target = copy[j];
    if (current !== undefined && target !== undefined) {
      copy[i] = target;
      copy[j] = current;
    }
  }
  return copy;
}

function blockedTags(input: RoutineInput): Set<string> {
  const tags = new Set<string>();
  for (const condition of input.conditions) {
    for (const tag of CONDITION_CONTRAINDICATIONS[condition]) tags.add(tag);
  }
  return tags;
}

function isAvailable(
  exercise: ExerciseSeed,
  input: RoutineInput,
  blocked: Set<string>,
  maxDifficulty: number,
): boolean {
  const availableEquipment = new Set<string>(['bodyweight', ...input.equipment]);
  const hasEquipment = exercise.equipment.every((item) => availableEquipment.has(item));
  if (!hasEquipment) return false;
  if (exercise.difficulty > maxDifficulty) return false;
  if (exercise.contraindications.some((tag) => blocked.has(tag))) return false;
  return true;
}

function selectExercise(
  pattern: ExercisePattern,
  input: RoutineInput,
  catalog: ExerciseSeed[],
  blocked: Set<string>,
  used: Set<string>,
  random: () => number,
): ExerciseSeed | null {
  const candidates = catalog.filter(
    (exercise) =>
      exercise.pattern === pattern &&
      !used.has(exercise.slug) &&
      isAvailable(exercise, input, blocked, levelNumber(input.level)),
  );

  const scored = shuffle(candidates, random)
    .map((exercise) => {
      let score = 0;
      if (input.sport === 'football' && exercise.sportTags.includes('football')) score += 3;
      if (input.sport === 'recreational' && exercise.sportTags.includes('general')) score += 1;
      if (input.goal === 'strength' && exercise.difficulty >= 2) score += 1;
      if (input.goal === 'general_health' && exercise.difficulty === 1) score += 1;
      return { exercise, score };
    })
    .sort((a, b) => b.score - a.score);

  const selected = scored[0]?.exercise;
  if (selected) return selected;

  const fallback = catalog.find(
    (exercise) =>
      exercise.pattern === pattern &&
      !used.has(exercise.slug) &&
      exercise.equipment.every((item) => item === 'bodyweight') &&
      exercise.difficulty <= levelNumber(input.level) &&
      !exercise.contraindications.some((tag) => blocked.has(tag)),
  );

  return fallback ?? null;
}

function selectAccessory(
  input: RoutineInput,
  catalog: ExerciseSeed[],
  blocked: Set<string>,
  used: Set<string>,
  random: () => number,
): ExerciseSeed | null {
  const preferred: ExercisePattern[] =
    input.goal === 'fat_loss' || input.goal === 'endurance'
      ? ['conditioning', 'core', 'carry']
      : input.goal === 'strength'
        ? ['core', 'carry', 'calf']
        : ['core', 'calf', 'carry', 'pull_horizontal'];

  for (const pattern of preferred) {
    const exercise = selectExercise(pattern, input, catalog, blocked, used, random);
    if (exercise) return exercise;
  }
  return null;
}

function prescription(
  input: RoutineInput,
  pattern: ExercisePattern,
  accessory = false,
): Pick<PlannedExercise, 'sets' | 'reps' | 'restSec' | 'rpe' | 'notes'> {
  const levelAdjustment = input.level === 'beginner' ? -1 : input.level === 'advanced' ? 1 : 0;
  let sets = 3;
  let reps = '8-12';
  let restSec = 90;
  let rpe: number | null = 7;
  let notes = '';

  switch (input.goal) {
    case 'strength':
      sets = 4;
      reps = '3-6';
      restSec = 150;
      rpe = 8;
      notes = 'Priorizá técnica y carga progresiva. Dejá 1-2 repeticiones en reserva.';
      break;
    case 'muscle_gain':
      sets = 4;
      reps = '6-10';
      restSec = 120;
      rpe = 8;
      notes = 'Buscá cercanía al fallo técnico sin romper la postura.';
      break;
    case 'fat_loss':
      sets = 3;
      reps = '10-15';
      restSec = 60;
      rpe = 7;
      notes = 'Mantené el ritmo y descansá lo justo para seguir con buena técnica.';
      break;
    case 'endurance':
      sets = 3;
      reps = '12-20';
      restSec = 45;
      rpe = 6;
      notes = 'Trabajá a un ritmo sostenible y controlá la respiración.';
      break;
    default:
      sets = 3;
      reps = '8-12';
      restSec = 90;
      rpe = 6;
      notes = 'Técnica primero. Aumentá la dificultad de a poco.';
  }

  if (pattern === 'core') {
    reps = '30-45 s';
    restSec = 45;
    notes = 'Mantené el abdomen firme y respirá durante todo el ejercicio.';
  }
  if (pattern === 'carry') {
    reps = '30-40 m';
    restSec = 60;
  }
  if (pattern === 'conditioning') {
    sets = 1;
    reps = '10-15 min';
    restSec = 0;
    rpe = 6;
    notes = 'Ritmo constante. Si no podés hablar mientras lo hacés, bajá la intensidad.';
  }
  if (pattern === 'calf') {
    reps = '12-20';
    restSec = 45;
  }

  sets = Math.max(2, Math.min(6, sets + (accessory ? -1 : levelAdjustment)));
  if (input.sport === 'football' && input.footballSeason === 'in_season' && !accessory) {
    sets = Math.max(2, sets - 1);
  }

  return { sets, reps, restSec, rpe, notes };
}

function toPlanned(exercise: ExerciseSeed, input: RoutineInput, accessory = false): PlannedExercise {
  return {
    exerciseId: exercise.id ?? null,
    name: exercise.name,
    pattern: exercise.pattern,
    ...prescription(input, exercise.pattern, accessory),
  };
}

function warmupFor(focus: string[], sport: RoutineInput['sport']): string[] {
  const items = [
    '5 minutos de movimiento general: caminata o bicicleta suave.',
    'Movilidad dinámica de cadera, tobillo y hombros.',
  ];
  if (focus.includes('Tren inferior') || focus.includes('Piernas') || focus.includes('glúteos')) {
    items.push('Activación de glúteos con banda y sentadilla al aire.');
  }
  if (focus.includes('Tren superior') || focus.includes('Pecho') || focus.includes('Espalda')) {
    items.push('Activación de escápulas y manguito rotador con banda.');
  }
  if (sport === 'football') {
    items.push('Activación de aductores e isquiotibiales antes de la parte principal.');
  }
  return items;
}

function cooldownFor(sport: RoutineInput['sport']): string[] {
  const items = [
    '3-5 minutos de caminata suave para bajar pulsaciones.',
    'Estiramientos suaves de los grupos trabajados, sin dolor.',
    'Hidratación y registro de cómo te sentiste.',
  ];
  if (sport === 'football') {
    items.push('Movilidad de cadera y tobillo; avisá si aparece dolor muscular persistente.');
  }
  return items;
}

function progressionFor(input: RoutineInput): string {
  const base =
    'Semanas 1-2: familiarización y técnica. Semanas 3-4: aumentá 1-2 repeticiones o un poco la carga manteniendo la técnica. Si llegás al final de la serie con 2 repeticiones de reserva, subí la carga en la próxima sesión.';
  if (input.goal === 'strength') {
    return `${base} Para fuerza, priorizá series de 3-6 repeticiones y descansos largos. Hacé una semana de descarga cada 4-6 semanas.`;
  }
  if (input.goal === 'fat_loss') {
    return `${base} Mantené descansos cortos y sumá caminata diaria. No uses el entrenamiento para compensar comidas: la alimentación se trabaja aparte con un profesional.`;
  }
  if (input.sport === 'football') {
    return `${base} En temporada, evitá llegar fatigado al partido: si jugás al día siguiente, reducí una serie en los ejercicios de piernas. Fuera de temporada podés progresar en fuerza y volumen.`;
  }
  return `${base} Si aparece dolor agudo, mareo o falta de aire anormal, detené la sesión y consultá a un profesional.`;
}

export function generateRoutine(
  input: RoutineInput,
  catalog: ExerciseSeed[],
  requestedSeed?: number,
): { plan: RoutinePlan; warnings: string[]; rulesVersion: string; seed: number } {
  if (input.conditions.some((condition) => RED_FLAGS.includes(condition))) {
    throw new RoutineSafetyError(
      'El socio presenta una condición que requiere autorización médica antes de generar una rutina automática. Registrá el apto médico y consultá con un profesional.',
    );
  }

  const seed = Number.isFinite(requestedSeed)
    ? Number(requestedSeed)
    : Math.floor(Math.random() * 1_000_000_000);
  const warnings: string[] = [];
  const blocked = blockedTags(input);
  const used = new Set<string>();
  const templates = SPLITS[input.daysPerWeek];

  if (!templates) {
    throw new RoutineSafetyError('La frecuencia semanal debe ser de 3, 4 o 5 días.');
  }

  if (!input.medicalClearance) {
    warnings.push(
      'No hay apto médico vigente registrado. La rutina es una sugerencia general y requiere autorización médica antes de ser entregada.',
    );
  }
  if (input.conditions.length > 0) {
    warnings.push(
      'Se adaptó la selección de ejercicios a las condiciones de salud declaradas. No reemplaza una evaluación médica o kinesiológica.',
    );
  }
  if (input.equipment.length === 1 && input.equipment[0] === 'bodyweight') {
    warnings.push('La rutina usa solo peso corporal porque no se cargó otro equipamiento.');
  }
  if (input.sessionMinutes <= 45 && input.daysPerWeek === 5) {
    warnings.push(
      'Cinco días con sesiones de 45 minutos puede ser exigente. Se redujo el volumen; si no se recupera bien, bajar a 3 o 4 días.',
    );
  }
  if (input.age !== undefined && input.age >= 65) {
    warnings.push('Socio mayor de 65 años: priorizá técnica, equilibrio y progresión lenta.');
  }
  if (input.conditions.includes('hypertension')) {
    warnings.push(
      'Con hipertensión: evitá aguantar la respiración y cargas máximas. Controlá la intensidad con RPE 6-7.',
    );
  }
  if (input.sport === 'football' && input.footballSeason === 'in_season') {
    warnings.push(
      'En temporada de fútbol se redujo el volumen de piernas para favorecer la recuperación entre partidos.',
    );
  }

  const replacements: Array<{ slot: string; fallback: string; day: string }> = [];
  const missingSlots: Array<{ slot: string; day: string }> = [];

  const days: RoutineDay[] = templates.map((template, dayIndex) => {
    const random = mulberry32(seed + dayIndex * 1000);
    const mainExercises: PlannedExercise[] = [];
    const accessoryExercises: PlannedExercise[] = [];
    const conditioningExercises: PlannedExercise[] = [];

    for (const slot of template.slots) {
      let exercise =
        slot === 'accessory'
          ? selectAccessory(input, catalog, blocked, used, random)
          : selectExercise(slot, input, catalog, blocked, used, random);

      if (!exercise && slot !== 'accessory') {
        for (const fallbackPattern of FALLBACK_PATTERNS[slot] ?? []) {
          const fallback = selectExercise(
            fallbackPattern,
            input,
            catalog,
            blocked,
            used,
            random,
          );
          if (fallback) {
            exercise = fallback;
            replacements.push({ slot, fallback: fallbackPattern, day: template.name });
            break;
          }
        }
      }

      if (!exercise) {
        missingSlots.push({ slot, day: template.name });
        continue;
      }

      used.add(exercise.slug);
      const planned = toPlanned(exercise, input, slot === 'accessory');
      if (slot === 'accessory') accessoryExercises.push(planned);
      else mainExercises.push(planned);
    }

    if (
      (input.goal === 'fat_loss' || input.goal === 'endurance') &&
      dayIndex < 2 &&
      !conditioningExercises.length
    ) {
      const conditioning = selectExercise(
        'conditioning',
        input,
        catalog,
        blocked,
        used,
        random,
      );
      if (conditioning) {
        used.add(conditioning.slug);
        conditioningExercises.push(toPlanned(conditioning, input, true));
      }
    }

    if (
      input.sport === 'football' &&
      (template.focus.some((focus) => FOOTBALL_FOCUS.includes(focus)) ||
        template.focus.includes('Tren inferior'))
    ) {
      const options = FOOTBALL_ACCESSORIES.filter((slug) => !used.has(slug));
      const extraSlugs = shuffle(options, random).slice(0, 2);
      for (const slug of extraSlugs) {
        const exercise = catalog.find((item) => item.slug === slug);
        if (!exercise) continue;
        const available = isAvailable(exercise, input, blocked, levelNumber(input.level));
        if (!available) continue;
        used.add(exercise.slug);
        accessoryExercises.push(toPlanned(exercise, input, true));
      }
    }

    const blocks: RoutineDay['blocks'] = [];
    if (mainExercises.length) blocks.push({ type: 'main', exercises: mainExercises });
    if (accessoryExercises.length) {
      blocks.push({ type: 'accessory', exercises: accessoryExercises });
    }
    if (conditioningExercises.length) {
      blocks.push({ type: 'conditioning', exercises: conditioningExercises });
    }

    const notes =
      input.sport === 'football' && template.focus.includes('Tren inferior')
        ? 'Si jugás un partido en las próximas 24-48 horas, reducí una serie de los ejercicios de piernas.'
        : '';

    return {
      name: template.name,
      focus: template.focus,
      warmup: warmupFor(template.focus, input.sport),
      blocks,
      cooldown: cooldownFor(input.sport),
      notes,
    };
  });

  if (replacements.length > 0) {
    const pairs = [...new Set(replacements.map((item) => `"${item.slot}" → "${item.fallback}"`))].join(
      ', ',
    );
    const affectedDays = [...new Set(replacements.map((item) => item.day))].join(', ');
    warnings.push(
      `Se adaptaron algunos patrones por las restricciones de salud o el equipamiento disponible: ${pairs}. Días afectados: ${affectedDays}.`,
    );
  }

  if (missingSlots.length > 0) {
    const list = [...new Set(missingSlots.map((item) => `"${item.slot}" en ${item.day}`))].join(
      ', ',
    );
    warnings.push(
      `No se encontraron ejercicios compatibles para ${list}. Revisá el equipamiento o las restricciones de salud.`,
    );
  }

  const equipmentLabels = input.equipment.map((item) => EQUIPMENT_LABELS[item]).join(', ');

  const plan: RoutinePlan = {
    summary: {
      goal: input.goal,
      goalLabel: GOAL_LABELS[input.goal],
      level: input.level,
      levelLabel: LEVEL_LABELS[input.level],
      daysPerWeek: input.daysPerWeek,
      sessionMinutes: input.sessionMinutes,
      sport: input.sport,
      sportLabel: SPORT_LABELS[input.sport],
      equipment: input.equipment,
    },
    days,
    progression: progressionFor(input),
    disclaimer:
      'Este plan es una sugerencia general de entrenamiento y no constituye diagnóstico ni tratamiento médico. Requiere autorización médica y supervisión profesional. Detené la actividad y consultá si sentís dolor agudo, mareo, palpitaciones o falta de aire anormal. Equipamiento considerado: ' +
      equipmentLabels +
      '.',
  };

  return {
    plan,
    warnings: [...new Set(warnings)],
    rulesVersion: RULES_VERSION,
    seed,
  };
}
