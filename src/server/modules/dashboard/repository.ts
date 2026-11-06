import type { DashboardData, RoutinePlan } from '../../../shared/types';
import { queryAll, queryOne } from '../../infra/db';
import { firstDayOfMonth, plusDays, toIso, today } from '../../shared/dates';

function count(sql: string, params: Array<string | number> = []): number {
  return queryOne<{ count: number }>(sql, params)?.count ?? 0;
}

export function getDashboard(): DashboardData {
  const currentDate = today();
  const nextWeek = plusDays(currentDate, 7);
  const monthStart = firstDayOfMonth();

  const activeMembers = count(
    `SELECT COUNT(*) AS count
     FROM members m
     WHERE m.status = 'active'
       AND EXISTS (
         SELECT 1 FROM memberships ms
         WHERE ms.member_id = m.id AND ms.status = 'active' AND ms.ends_on >= ?
       )`,
    [currentDate],
  );

  const expiringSoon = count(
    `SELECT COUNT(*) AS count
     FROM members m
     JOIN memberships ms ON ms.member_id = m.id
     WHERE m.status = 'active'
       AND ms.status = 'active'
       AND ms.ends_on >= ? AND ms.ends_on <= ?`,
    [currentDate, nextWeek],
  );

  const newThisMonth = count(
    `SELECT COUNT(*) AS count FROM members
     WHERE status != 'archived' AND date(created_at) >= ?`,
    [monthStart],
  );

  const totalMembers = count(
    "SELECT COUNT(*) AS count FROM members WHERE status != 'archived'",
  );

  const withoutMembership = count(
    `SELECT COUNT(*) AS count
     FROM members m
     WHERE m.status = 'active'
       AND NOT EXISTS (
         SELECT 1 FROM memberships ms
         WHERE ms.member_id = m.id AND ms.status = 'active' AND ms.ends_on >= ?
       )`,
    [currentDate],
  );

  const planDistribution = queryAll<{
    plan_name: string;
    days_per_week: number;
    count: number;
  }>(
    `SELECT p.name AS plan_name, p.days_per_week, COUNT(DISTINCT m.id) AS count
     FROM members m
     JOIN memberships ms ON ms.member_id = m.id
     JOIN plans p ON p.id = ms.plan_id
     WHERE m.status = 'active'
       AND ms.status = 'active'
       AND ms.ends_on >= ?
     GROUP BY p.id
     ORDER BY p.days_per_week`,
    [currentDate],
  ).map((row) => ({
    planName: row.plan_name,
    daysPerWeek: row.days_per_week,
    count: row.count,
  }));

  const recentMembers = queryAll<{
    id: number;
    first_name: string;
    last_name: string;
    created_at: string;
  }>(
    `SELECT id, first_name, last_name, created_at
     FROM members
     WHERE status != 'archived'
     ORDER BY id DESC
     LIMIT 5`,
  ).map((row) => ({
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    createdAt: toIso(row.created_at),
  }));

  const recentRoutines = queryAll<{
    id: number;
    member_id: number;
    member_name: string;
    version: number;
    plan_json: string;
    created_at: string;
  }>(
    `SELECT r.id, r.member_id, (m.last_name || ', ' || m.first_name) AS member_name,
            r.version, r.plan_json, r.created_at
     FROM routines r
     JOIN members m ON m.id = r.member_id
     ORDER BY r.id DESC
     LIMIT 5`,
  ).map((row) => {
    const plan = JSON.parse(row.plan_json) as RoutinePlan;
    return {
      id: row.id,
      memberId: row.member_id,
      memberName: row.member_name,
      version: row.version,
      goalLabel: plan.summary.goalLabel,
      createdAt: toIso(row.created_at),
    };
  });

  const expiringMembers = queryAll<{
    id: number;
    first_name: string;
    last_name: string;
    phone: string | null;
    plan_name: string;
    ends_on: string;
  }>(
    `SELECT m.id, m.first_name, m.last_name, m.phone, p.name AS plan_name, ms.ends_on
     FROM members m
     JOIN memberships ms ON ms.member_id = m.id
     JOIN plans p ON p.id = ms.plan_id
     WHERE m.status = 'active'
       AND ms.status = 'active'
       AND ms.ends_on >= ? AND ms.ends_on <= ?
     ORDER BY ms.ends_on ASC
     LIMIT 10`,
    [currentDate, nextWeek],
  ).map((row) => ({
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    phone: row.phone,
    planName: row.plan_name,
    endsOn: row.ends_on,
  }));

  return {
    today: currentDate,
    activeMembers,
    expiringSoon,
    newThisMonth,
    totalMembers,
    withoutMembership,
    planDistribution,
    recentMembers,
    recentRoutines,
    expiringMembers,
  };
}
