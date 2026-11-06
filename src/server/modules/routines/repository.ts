import type { RoutineInput, RoutinePlan } from '../../../shared/types';
import type { ExerciseSeed } from '../../domain/routines/exercises';
import { execute, queryAll, queryOne } from '../../infra/db';
import {
  mapRoutine,
  parseJsonArray,
  type RoutineRow,
} from '../../shared/mappers';

type ExerciseRow = {
  id: number;
  slug: string;
  name: string;
  pattern: string;
  primary_muscles: string;
  secondary_muscles: string;
  equipment: string;
  difficulty: number;
  impact: string;
  contraindications: string;
  sport_tags: string;
  instructions: string;
  alternatives: string;
};

export function listExercises(): ExerciseSeed[] {
  return queryAll<ExerciseRow>(
    'SELECT * FROM exercises WHERE active = 1 ORDER BY name COLLATE NOCASE',
  ).map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    pattern: row.pattern as ExerciseSeed['pattern'],
    primaryMuscles: row.primary_muscles,
    secondaryMuscles: row.secondary_muscles,
    equipment: parseJsonArray(row.equipment) as ExerciseSeed['equipment'],
    difficulty: row.difficulty,
    impact: row.impact as ExerciseSeed['impact'],
    contraindications: parseJsonArray(row.contraindications),
    sportTags: parseJsonArray(row.sport_tags),
    instructions: row.instructions,
    alternatives: row.alternatives,
  }));
}

export function getRoutineRow(id: number): RoutineRow | undefined {
  return queryOne<RoutineRow>(
    `SELECT r.*, (m.last_name || ', ' || m.first_name) AS member_name
     FROM routines r
     JOIN members m ON m.id = r.member_id
     WHERE r.id = ?`,
    [id],
  );
}

export function getRoutine(id: number) {
  const row = getRoutineRow(id);
  return row ? mapRoutine(row) : null;
}

export function nextRoutineVersion(memberId: number): number {
  const row = queryOne<{ max_version: number | null }>(
    'SELECT MAX(version) AS max_version FROM routines WHERE member_id = ?',
    [memberId],
  );
  return (row?.max_version ?? 0) + 1;
}

export function createRoutine(params: {
  memberId: number;
  input: RoutineInput;
  plan: RoutinePlan;
  warnings: string[];
  source: 'auto' | 'manual';
  rulesVersion: string;
  seed: number;
}): number {
  const version = nextRoutineVersion(params.memberId);
  const result = execute(
    `INSERT INTO routines (
      member_id, version, status, source, rules_version,
      input_json, plan_json, warnings_json, seed
    ) VALUES (?, ?, 'final', ?, ?, ?, ?, ?, ?)`,
    [
      params.memberId,
      version,
      params.source,
      params.rulesVersion,
      JSON.stringify(params.input),
      JSON.stringify(params.plan),
      JSON.stringify(params.warnings),
      params.seed,
    ],
  );
  return result.lastInsertRowid;
}
