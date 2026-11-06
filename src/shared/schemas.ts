import { z } from 'zod';
import {
  CONDITIONS,
  EQUIPMENT,
  FOOTBALL_SEASONS,
  GOALS,
  LEVELS,
  MEMBER_STATUSES,
  SPORTS,
} from './types';

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Usá el formato AAAA-MM-DD');

const optionalText = z.string().trim().max(2000).optional().default('');

export const loginSchema = z.object({
  password: z.string().min(1, 'Ingresá la contraseña').max(200),
});

export const healthInputSchema = z.object({
  conditions: z.array(z.enum(CONDITIONS)).default([]),
  injuries: optionalText,
  medications: optionalText,
  medicalClearance: z.boolean().default(false),
  medicalClearanceExpiresOn: dateString.nullable().optional().default(null),
  consentSigned: z.boolean().default(false),
  notes: optionalText,
});

export const memberInputSchema = z.object({
  firstName: z.string().trim().min(1, 'El nombre es obligatorio').max(80),
  lastName: z.string().trim().min(1, 'El apellido es obligatorio').max(80),
  dni: z.string().trim().max(30).optional().default(''),
  birthDate: dateString.nullable().optional().default(null),
  phone: z.string().trim().max(40).optional().default(''),
  email: z.string().trim().max(120).optional().default(''),
  address: z.string().trim().max(200).optional().default(''),
  emergencyName: z.string().trim().max(120).optional().default(''),
  emergencyPhone: z.string().trim().max(40).optional().default(''),
  notes: z.string().trim().max(2000).optional().default(''),
  status: z.enum(MEMBER_STATUSES).optional().default('active'),
  health: healthInputSchema.default({
    conditions: [],
    injuries: '',
    medications: '',
    medicalClearance: false,
    medicalClearanceExpiresOn: null,
    consentSigned: false,
    notes: '',
  }),
});

export const memberUpdateSchema = memberInputSchema.partial();

export const planUpdateSchema = z.object({
  priceCents: z.number().int().min(0).max(100_000_000),
});

export const membershipInputSchema = z
  .object({
    planId: z.number().int().positive(),
    startsOn: dateString,
    endsOn: dateString,
    notes: z.string().trim().max(500).optional().default(''),
  })
  .refine((value) => value.endsOn >= value.startsOn, {
    message: 'La fecha de fin no puede ser anterior al inicio',
    path: ['endsOn'],
  });

export const routineInputSchema = z.object({
  goal: z.enum(GOALS),
  level: z.enum(LEVELS),
  daysPerWeek: z.number().int().min(3).max(5),
  sessionMinutes: z.number().int().min(30).max(120),
  equipment: z.array(z.enum(EQUIPMENT)).min(1, 'Elegí al menos un equipamiento'),
  sport: z.enum(SPORTS).default('none'),
  footballSeason: z.enum(FOOTBALL_SEASONS).default('off_season'),
  age: z.number().int().min(10).max(100).optional(),
  weightKg: z.number().min(25).max(300).optional(),
  heightCm: z.number().min(100).max(250).optional(),
  conditions: z.array(z.enum(CONDITIONS)).default([]),
  injuries: optionalText,
  medicalClearance: z.boolean().default(false),
  parq: z.array(z.string()).default([]),
  notes: optionalText,
  seed: z.number().int().optional(),
});

export const plannedExerciseSchema = z.object({
  exerciseId: z.number().int().positive().nullable().default(null),
  name: z.string().trim().min(1).max(120),
  pattern: z.string().trim().min(1).max(60),
  sets: z.number().int().min(1).max(10),
  reps: z.string().trim().min(1).max(40),
  restSec: z.number().int().min(0).max(600),
  rpe: z.number().min(1).max(10).nullable().default(null),
  notes: z.string().trim().max(500).optional().default(''),
});

export const routineBlockSchema = z.object({
  type: z.enum(['main', 'accessory', 'conditioning']),
  exercises: z.array(plannedExerciseSchema),
});

export const routineDaySchema = z.object({
  name: z.string().trim().min(1).max(120),
  focus: z.array(z.string().trim().max(80)).default([]),
  warmup: z.array(z.string().trim().max(300)).default([]),
  blocks: z.array(routineBlockSchema).min(1),
  cooldown: z.array(z.string().trim().max(300)).default([]),
  notes: z.string().trim().max(1000).optional().default(''),
});

export const routinePlanSchema = z.object({
  summary: z.object({
    goal: z.enum(GOALS),
    goalLabel: z.string(),
    level: z.enum(LEVELS),
    levelLabel: z.string(),
    daysPerWeek: z.number().int(),
    sessionMinutes: z.number().int(),
    sport: z.enum(SPORTS),
    sportLabel: z.string(),
    equipment: z.array(z.enum(EQUIPMENT)),
  }),
  days: z.array(routineDaySchema).min(1).max(7),
  progression: z.string().trim().min(1).max(3000),
  disclaimer: z.string().trim().min(1).max(3000),
});

export const routineSaveSchema = z.object({
  input: routineInputSchema,
  plan: routinePlanSchema.optional(),
});

export const routineUpdateSchema = z.object({
  plan: routinePlanSchema,
});

export type LoginInput = z.infer<typeof loginSchema>;
export type MemberInput = z.infer<typeof memberInputSchema>;
export type MemberUpdateInput = z.infer<typeof memberUpdateSchema>;
export type HealthInput = z.infer<typeof healthInputSchema>;
export type MembershipInput = z.infer<typeof membershipInputSchema>;
export type RoutineInputPayload = z.infer<typeof routineInputSchema>;
export type RoutinePlanPayload = z.infer<typeof routinePlanSchema>;
