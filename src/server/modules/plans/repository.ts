import { execute, queryAll, queryOne } from '../../infra/db';
import { mapPlan, type PlanRow } from '../../shared/mappers';

export function listPlans() {
  return queryAll<PlanRow>('SELECT * FROM plans ORDER BY days_per_week ASC').map(mapPlan);
}

export function getPlanById(id: number): PlanRow | undefined {
  return queryOne<PlanRow>('SELECT * FROM plans WHERE id = ?', [id]);
}

export function updatePlanPrice(id: number, priceCents: number): void {
  execute(
    `UPDATE plans
     SET price_cents = ?, updated_at = datetime('now')
     WHERE id = ?`,
    [priceCents, id],
  );
}
