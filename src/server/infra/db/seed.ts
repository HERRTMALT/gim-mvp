import { execute, queryOne, transaction } from './index';
import { EXERCISES } from '../../domain/routines/exercises';

const PLANS = [
  { name: 'Plan 3 días', daysPerWeek: 3, priceCents: 30_000 },
  { name: 'Plan 4 días', daysPerWeek: 4, priceCents: 35_000 },
  { name: 'Plan 5 días', daysPerWeek: 5, priceCents: 40_000 },
];

export function seedDatabase(): void {
  // En serverless el seed corre en cada cold start. Si el catálogo ya está
  // completo no hace falta volver a escribir 59 ejercicios.
  const existing = queryOne<{ plans: number; exercises: number }>(
    `SELECT
       (SELECT COUNT(*) FROM plans) AS plans,
       (SELECT COUNT(*) FROM exercises) AS exercises`,
  );
  if ((existing?.plans ?? 0) >= PLANS.length && (existing?.exercises ?? 0) >= EXERCISES.length) {
    return;
  }

  transaction(() => {
    for (const plan of PLANS) {
      execute(
        `INSERT OR IGNORE INTO plans (name, days_per_week, price_cents)
         VALUES (?, ?, ?)`,
        [plan.name, plan.daysPerWeek, plan.priceCents],
      );
    }

    for (const exercise of EXERCISES) {
      execute(
        `INSERT INTO exercises (
          slug, name, pattern, primary_muscles, secondary_muscles, equipment,
          difficulty, impact, contraindications, sport_tags, instructions, alternatives
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(slug) DO UPDATE SET
          name = excluded.name,
          pattern = excluded.pattern,
          primary_muscles = excluded.primary_muscles,
          secondary_muscles = excluded.secondary_muscles,
          equipment = excluded.equipment,
          difficulty = excluded.difficulty,
          impact = excluded.impact,
          contraindications = excluded.contraindications,
          sport_tags = excluded.sport_tags,
          instructions = excluded.instructions,
          alternatives = excluded.alternatives`,
        [
          exercise.slug,
          exercise.name,
          exercise.pattern,
          exercise.primaryMuscles,
          exercise.secondaryMuscles,
          JSON.stringify(exercise.equipment),
          exercise.difficulty,
          exercise.impact,
          JSON.stringify(exercise.contraindications),
          JSON.stringify(exercise.sportTags),
          exercise.instructions,
          exercise.alternatives,
        ],
      );
    }
  });

  const count = queryOne<{ count: number }>('SELECT COUNT(*) AS count FROM exercises');
  console.log(`Catálogo listo: ${count?.count ?? 0} ejercicios`);
}
