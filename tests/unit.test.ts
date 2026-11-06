import { describe, expect, it } from 'vitest';
import { hashPassword, safeCompare, verifyPassword } from '../src/server/modules/auth/password';
import { displayDate, plusDays, plusMonths } from '../src/server/shared/dates';
import {
  generateRoutine,
  RoutineSafetyError,
  RULES_VERSION,
} from '../src/server/domain/routines/engine';
import { EXERCISES } from '../src/server/domain/routines/exercises';
import type { RoutineInput } from '../src/shared/types';

const baseInput: RoutineInput = {
  goal: 'general_health',
  level: 'beginner',
  daysPerWeek: 3,
  sessionMinutes: 60,
  equipment: ['bodyweight', 'dumbbells', 'machines', 'bench', 'bands'],
  sport: 'none',
  footballSeason: 'off_season',
  age: 30,
  conditions: [],
  injuries: '',
  medicalClearance: true,
  parq: [],
  notes: '',
};

function allExercises(plan: ReturnType<typeof generateRoutine>['plan']) {
  return plan.days.flatMap((day) => day.blocks.flatMap((block) => block.exercises));
}

describe('password hashing', () => {
  it('verifica una contraseña hasheada', () => {
    const hash = hashPassword('clave-segura');
    expect(hash.startsWith('scrypt$')).toBe(true);
    expect(verifyPassword('clave-segura', hash)).toBe(true);
    expect(verifyPassword('otra-clave', hash)).toBe(false);
  });

  it('rechaza hashes con formato inválido', () => {
    expect(verifyPassword('x', 'texto-plano')).toBe(false);
    expect(verifyPassword('x', 'bcrypt$salt$hash')).toBe(false);
  });

  it('compara strings en tiempo constante', () => {
    expect(safeCompare('admin123', 'admin123')).toBe(true);
    expect(safeCompare('admin123', 'admin124')).toBe(false);
    expect(safeCompare('corto', 'una-clave-mucho-mas-larga')).toBe(false);
  });
});

describe('fechas de membresía', () => {
  it('suma días respetando el calendario', () => {
    expect(plusDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(plusDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('suma meses con fin de mes ajustado', () => {
    expect(plusMonths('2026-01-15', 1)).toBe('2026-02-15');
    expect(plusMonths('2026-01-31', 1)).toBe('2026-02-28');
    expect(plusMonths('2026-12-15', 1)).toBe('2027-01-15');
  });

  it('formatea fechas y normaliza timestamps', () => {
    expect(displayDate('2026-11-06')).toBe('06/11/2026');
    expect(displayDate(null)).toBe('—');
  });
});

describe('generador de rutinas', () => {
  it('genera la cantidad de días solicitada para 3, 4 y 5 días', () => {
    for (const daysPerWeek of [3, 4, 5]) {
      const { plan, rulesVersion } = generateRoutine(
        { ...baseInput, daysPerWeek },
        EXERCISES,
        1234,
      );
      expect(plan.days).toHaveLength(daysPerWeek);
      expect(plan.days.every((day) => day.blocks.length > 0)).toBe(true);
      expect(plan.summary.daysPerWeek).toBe(daysPerWeek);
      expect(rulesVersion).toBe(RULES_VERSION);
    }
  });

  it('es determinístico para la misma semilla', () => {
    const first = generateRoutine({ ...baseInput, daysPerWeek: 4 }, EXERCISES, 42);
    const second = generateRoutine({ ...baseInput, daysPerWeek: 4 }, EXERCISES, 42);
    expect(second.plan).toEqual(first.plan);
    expect(second.warnings).toEqual(first.warnings);
  });

  it('bloquea la generación ante señales de alarma', () => {
    for (const condition of ['chest_pain', 'heart_condition', 'recent_surgery', 'pregnancy'] as const) {
      expect(() =>
        generateRoutine({ ...baseInput, conditions: [condition] }, EXERCISES, 1),
      ).toThrow(RoutineSafetyError);
    }
  });

  it('evita ejercicios contraindicados para dolor de rodilla', () => {
    const { plan } = generateRoutine(
      { ...baseInput, conditions: ['knee_pain'], daysPerWeek: 4 },
      EXERCISES,
      7,
    );
    const blocked = new Set(
      EXERCISES.filter(
        (exercise) =>
          exercise.contraindications.includes('knee_flexion') ||
          exercise.contraindications.includes('impact'),
      ).map((exercise) => exercise.name),
    );
    const generated = allExercises(plan);
    expect(generated.length).toBeGreaterThan(0);
    expect(generated.every((exercise) => !blocked.has(exercise.name))).toBe(true);
  });

  it('agrupa las advertencias de reemplazo en un solo mensaje', () => {
    const { warnings } = generateRoutine(
      { ...baseInput, conditions: ['knee_pain', 'lower_back_pain'], daysPerWeek: 5 },
      EXERCISES,
      99,
    );
    const replacementWarnings = warnings.filter((warning) =>
      warning.includes('Se adaptaron algunos patrones'),
    );
    expect(replacementWarnings).toHaveLength(1);
    const missingWarnings = warnings.filter((warning) =>
      warning.includes('No se encontraron ejercicios compatibles'),
    );
    expect(missingWarnings.length).toBeLessThanOrEqual(1);
  });

  it('incluye advertencia cuando falta el apto médico', () => {
    const { warnings } = generateRoutine(
      { ...baseInput, medicalClearance: false },
      EXERCISES,
      5,
    );
    expect(warnings.some((warning) => warning.includes('apto médico'))).toBe(true);
  });
});
