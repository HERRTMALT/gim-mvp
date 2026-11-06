export const GOALS = [
  'fat_loss',
  'muscle_gain',
  'strength',
  'endurance',
  'general_health',
] as const;
export type Goal = (typeof GOALS)[number];

export const GOAL_LABELS: Record<Goal, string> = {
  fat_loss: 'Descenso de grasa',
  muscle_gain: 'Hipertrofia',
  strength: 'Fuerza',
  endurance: 'Resistencia',
  general_health: 'Salud general',
};

export const LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
export type Level = (typeof LEVELS)[number];

export const LEVEL_LABELS: Record<Level, string> = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
};

export const SPORTS = ['none', 'recreational', 'football'] as const;
export type Sport = (typeof SPORTS)[number];

export const SPORT_LABELS: Record<Sport, string> = {
  none: 'Sin deporte específico',
  recreational: 'Recreativo',
  football: 'Fútbol',
};

export const FOOTBALL_SEASONS = ['off_season', 'pre_season', 'in_season'] as const;
export type FootballSeason = (typeof FOOTBALL_SEASONS)[number];

export const FOOTBALL_SEASON_LABELS: Record<FootballSeason, string> = {
  off_season: 'Pretemporada / fuera de temporada',
  pre_season: 'Pretemporada',
  in_season: 'En temporada',
};

export const EQUIPMENT = [
  'bodyweight',
  'dumbbells',
  'barbell',
  'machines',
  'bands',
  'kettlebell',
  'bench',
  'turf',
] as const;
export type Equipment = (typeof EQUIPMENT)[number];

export const EQUIPMENT_LABELS: Record<Equipment, string> = {
  bodyweight: 'Peso corporal',
  dumbbells: 'Mancuernas',
  barbell: 'Barra',
  machines: 'Máquinas',
  bands: 'Bandas elásticas',
  kettlebell: 'Kettlebell',
  bench: 'Banco',
  turf: 'Pista / espacio para correr',
};

export const CONDITIONS = [
  'knee_pain',
  'shoulder_pain',
  'lower_back_pain',
  'hypertension',
  'asthma',
  'diabetes',
  'pregnancy',
  'heart_condition',
  'recent_surgery',
  'dizziness',
  'chest_pain',
  'other',
] as const;
export type Condition = (typeof CONDITIONS)[number];

export const CONDITION_LABELS: Record<Condition, string> = {
  knee_pain: 'Dolor o lesión de rodilla',
  shoulder_pain: 'Dolor o lesión de hombro',
  lower_back_pain: 'Dolor o lesión lumbar',
  hypertension: 'Hipertensión',
  asthma: 'Asma',
  diabetes: 'Diabetes',
  pregnancy: 'Embarazo',
  heart_condition: 'Enfermedad cardíaca',
  recent_surgery: 'Cirugía reciente',
  dizziness: 'Mareos o desmayos',
  chest_pain: 'Dolor de pecho',
  other: 'Otra condición',
};

export const MEMBER_STATUSES = ['active', 'inactive', 'archived'] as const;
export type MemberStatus = (typeof MEMBER_STATUSES)[number];

export const MEMBER_STATUS_LABELS: Record<MemberStatus, string> = {
  active: 'Activo',
  inactive: 'Inactivo',
  archived: 'Archivado',
};

export const ROUTINE_STATUSES = ['draft', 'final', 'archived'] as const;
export type RoutineStatus = (typeof ROUTINE_STATUSES)[number];

export const ROUTINE_SOURCES = ['auto', 'manual'] as const;
export type RoutineSource = (typeof ROUTINE_SOURCES)[number];

export const SESSION_MINUTES = [45, 60, 75, 90] as const;

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export type MemberHealth = {
  conditions: Condition[];
  injuries: string;
  medications: string;
  medicalClearance: boolean;
  medicalClearanceExpiresOn: string | null;
  consentSignedAt: string | null;
  notes: string;
  updatedAt: string;
};

export type Member = {
  id: number;
  firstName: string;
  lastName: string;
  dni: string | null;
  birthDate: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  emergencyName: string | null;
  emergencyPhone: string | null;
  notes: string | null;
  status: MemberStatus;
  createdAt: string;
  updatedAt: string;
  health: MemberHealth | null;
  currentMembership: Membership | null;
};

export type MemberListItem = {
  id: number;
  firstName: string;
  lastName: string;
  dni: string | null;
  phone: string | null;
  status: MemberStatus;
  planName: string | null;
  membershipEndsOn: string | null;
  createdAt: string;
};

export type Plan = {
  id: number;
  name: string;
  daysPerWeek: number;
  priceCents: number;
  active: boolean;
  updatedAt: string;
};

export type Membership = {
  id: number;
  memberId: number;
  planId: number;
  planName: string;
  daysPerWeek: number;
  priceCents: number;
  startsOn: string;
  endsOn: string;
  status: 'active' | 'expired' | 'cancelled';
  notes: string | null;
  createdAt: string;
};

export type Exercise = {
  id: number;
  slug: string;
  name: string;
  pattern: string;
  primaryMuscles: string;
  secondaryMuscles: string;
  equipment: Equipment[];
  difficulty: number;
  impact: string;
  contraindications: string[];
  sportTags: string[];
  instructions: string;
  alternatives: string;
};

export type RoutineSummary = {
  goal: Goal;
  goalLabel: string;
  level: Level;
  levelLabel: string;
  daysPerWeek: number;
  sessionMinutes: number;
  sport: Sport;
  sportLabel: string;
  equipment: Equipment[];
};

export type PlannedExercise = {
  exerciseId: number | null;
  name: string;
  pattern: string;
  sets: number;
  reps: string;
  restSec: number;
  rpe: number | null;
  notes: string;
};

export type RoutineBlock = {
  type: 'main' | 'accessory' | 'conditioning';
  exercises: PlannedExercise[];
};

export type RoutineDay = {
  name: string;
  focus: string[];
  warmup: string[];
  blocks: RoutineBlock[];
  cooldown: string[];
  notes: string;
};

export type RoutinePlan = {
  summary: RoutineSummary;
  days: RoutineDay[];
  progression: string;
  disclaimer: string;
};

export type Routine = {
  id: number;
  memberId: number;
  memberName?: string;
  version: number;
  status: RoutineStatus;
  source: RoutineSource;
  rulesVersion: string;
  input: RoutineInput;
  plan: RoutinePlan;
  warnings: string[];
  createdAt: string;
  updatedAt: string;
};

export type RoutineListItem = {
  id: number;
  version: number;
  status: RoutineStatus;
  source: RoutineSource;
  goalLabel: string;
  daysPerWeek: number;
  createdAt: string;
};

export type RoutineInput = {
  goal: Goal;
  level: Level;
  daysPerWeek: number;
  sessionMinutes: number;
  equipment: Equipment[];
  sport: Sport;
  footballSeason: FootballSeason;
  age?: number;
  weightKg?: number;
  heightCm?: number;
  conditions: Condition[];
  injuries: string;
  medicalClearance: boolean;
  parq: string[];
  notes: string;
  seed?: number;
};

export type DashboardData = {
  today: string;
  activeMembers: number;
  expiringSoon: number;
  newThisMonth: number;
  totalMembers: number;
  withoutMembership: number;
  planDistribution: Array<{ planName: string; daysPerWeek: number; count: number }>;
  recentMembers: Array<{
    id: number;
    firstName: string;
    lastName: string;
    createdAt: string;
  }>;
  recentRoutines: Array<{
    id: number;
    memberId: number;
    memberName: string;
    version: number;
    goalLabel: string;
    createdAt: string;
  }>;
  expiringMembers: Array<{
    id: number;
    firstName: string;
    lastName: string;
    phone: string | null;
    planName: string;
    endsOn: string;
  }>;
};

export type AuthMe = {
  authenticated: true;
  gymName: string;
  gymPhone: string;
};
