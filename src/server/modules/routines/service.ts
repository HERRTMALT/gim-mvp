import type { RoutineInput, RoutinePlan } from '../../../shared/types';
import { generateRoutine, RoutineSafetyError } from '../../domain/routines/engine';
import { AppError, NotFoundError } from '../../shared/errors';
import { getMemberDetails, getMemberRow } from '../members/repository';
import {
  createRoutine,
  getRoutine,
  getRoutineRow,
  listExercises,
} from './repository';

function ensureMember(memberId: number): void {
  if (!getMemberRow(memberId)) throw new NotFoundError('Socio no encontrado');
}

export function previewRoutine(memberId: number, input: RoutineInput) {
  ensureMember(memberId);
  return generateRoutine(input, listExercises(), input.seed);
}

export function saveRoutine(memberId: number, input: RoutineInput, providedPlan?: RoutinePlan) {
  ensureMember(memberId);
  const generated = generateRoutine(input, listExercises(), input.seed);
  const id = createRoutine({
    memberId,
    input,
    plan: providedPlan ?? generated.plan,
    warnings: generated.warnings,
    source: 'auto',
    rulesVersion: generated.rulesVersion,
    seed: generated.seed,
  });
  return getRoutine(id);
}

export function editRoutine(routineId: number, plan: RoutinePlan) {
  const existing = getRoutineRow(routineId);
  if (!existing) throw new NotFoundError('Rutina no encontrada');

  const routine = getRoutine(routineId);
  if (!routine) throw new NotFoundError('Rutina no encontrada');

  const id = createRoutine({
    memberId: routine.memberId,
    input: routine.input,
    plan,
    warnings: [...routine.warnings, 'Rutina editada manualmente. Revisá la coherencia antes de entregarla.'],
    source: 'manual',
    rulesVersion: routine.rulesVersion,
    seed: 0,
  });

  return getRoutine(id);
}

export function regenerateRoutine(routineId: number) {
  const existing = getRoutineRow(routineId);
  if (!existing) throw new NotFoundError('Rutina no encontrada');

  const routine = getRoutine(routineId);
  if (!routine) throw new NotFoundError('Rutina no encontrada');

  const nextSeed = (routine.input.seed ?? 0) + 1;
  const input: RoutineInput = { ...routine.input, seed: nextSeed };
  const generated = generateRoutine(input, listExercises(), nextSeed);

  const id = createRoutine({
    memberId: routine.memberId,
    input,
    plan: generated.plan,
    warnings: generated.warnings,
    source: 'auto',
    rulesVersion: generated.rulesVersion,
    seed: generated.seed,
  });

  return getRoutine(id);
}

export function getRoutineOrThrow(id: number) {
  const routine = getRoutine(id);
  if (!routine) throw new NotFoundError('Rutina no encontrada');
  return routine;
}

export function getRoutinePdfData(id: number) {
  const routine = getRoutineOrThrow(id);
  const member = getMemberDetails(routine.memberId);
  if (!member) throw new NotFoundError('Socio no encontrado');
  return { routine, member };
}

export function handleRoutineError(error: unknown): never {
  if (error instanceof RoutineSafetyError) {
    throw new AppError(422, 'ROUTINE_SAFETY', error.message);
  }
  throw error;
}
