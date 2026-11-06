import type { MemberInput, MemberUpdateInput } from '../../../shared/schemas';
import type { MemberStatus } from '../../../shared/types';
import { execute, queryAll, queryOne, transaction } from '../../infra/db';
import {
  mapMember,
  mapMemberListItem,
  mapMembershipRow,
  mapRoutineListItem,
  type HealthRow,
  type MemberListRow,
  type MemberRow,
  type MembershipRow,
  type RoutineRow,
} from '../../shared/mappers';

export function listMembers(query: string, status?: MemberStatus) {
  const conditions = ["m.status != 'archived'"];
  const params: Array<string | number> = [];

  if (query.trim()) {
    const term = `%${query.trim()}%`;
    conditions.push(
      '(m.first_name LIKE ? OR m.last_name LIKE ? OR m.dni LIKE ? OR m.phone LIKE ?)',
    );
    params.push(term, term, term, term);
  }

  if (status) {
    conditions.push('m.status = ?');
    params.push(status);
  }

  const rows = queryAll<MemberListRow>(
    `SELECT m.*,
            p.name AS plan_name,
            ms.ends_on AS membership_ends_on
     FROM members m
     LEFT JOIN memberships ms ON ms.id = (
       SELECT id FROM memberships
       WHERE member_id = m.id
       ORDER BY ends_on DESC, id DESC
       LIMIT 1
     )
     LEFT JOIN plans p ON p.id = ms.plan_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY m.last_name COLLATE NOCASE, m.first_name COLLATE NOCASE
     LIMIT 300`,
    params,
  );

  return rows.map(mapMemberListItem);
}

export function getMemberRow(id: number): MemberRow | undefined {
  return queryOne<MemberRow>('SELECT * FROM members WHERE id = ?', [id]);
}

export function getHealthRow(memberId: number): HealthRow | undefined {
  return queryOne<HealthRow>('SELECT * FROM member_health WHERE member_id = ?', [memberId]);
}

export function getLatestMembershipRow(memberId: number): MembershipRow | undefined {
  return queryOne<MembershipRow>(
    `SELECT ms.*, p.name AS plan_name, p.days_per_week
     FROM memberships ms
     JOIN plans p ON p.id = ms.plan_id
     WHERE ms.member_id = ?
     ORDER BY ms.ends_on DESC, ms.id DESC
     LIMIT 1`,
    [memberId],
  );
}

export function getMemberships(memberId: number) {
  return queryAll<MembershipRow>(
    `SELECT ms.*, p.name AS plan_name, p.days_per_week
     FROM memberships ms
     JOIN plans p ON p.id = ms.plan_id
     WHERE ms.member_id = ?
     ORDER BY ms.ends_on DESC, ms.id DESC`,
    [memberId],
  ).map(mapMembershipRow);
}

export function getMemberDetails(id: number) {
  const row = getMemberRow(id);
  if (!row) return null;
  return mapMember(row, getHealthRow(id), getLatestMembershipRow(id));
}

export function getMemberName(id: number): string | undefined {
  const row = queryOne<{ first_name: string; last_name: string }>(
    'SELECT first_name, last_name FROM members WHERE id = ?',
    [id],
  );
  return row ? `${row.last_name}, ${row.first_name}` : undefined;
}

export function createMember(input: MemberInput): number {
  return transaction(() => {
    const result = execute(
      `INSERT INTO members (
        first_name, last_name, dni, birth_date, phone, email, address,
        emergency_name, emergency_phone, notes, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.firstName,
        input.lastName,
        input.dni || null,
        input.birthDate,
        input.phone || null,
        input.email || null,
        input.address || null,
        input.emergencyName || null,
        input.emergencyPhone || null,
        input.notes || null,
        input.status,
      ],
    );

    upsertHealth(result.lastInsertRowid, input);
    return result.lastInsertRowid;
  });
}

export function updateMember(id: number, input: MemberUpdateInput): void {
  transaction(() => {
    const sets: string[] = [];
    const params: Array<string | number | null> = [];

    const map: Array<[keyof MemberUpdateInput, string]> = [
      ['firstName', 'first_name'],
      ['lastName', 'last_name'],
      ['dni', 'dni'],
      ['birthDate', 'birth_date'],
      ['phone', 'phone'],
      ['email', 'email'],
      ['address', 'address'],
      ['emergencyName', 'emergency_name'],
      ['emergencyPhone', 'emergency_phone'],
      ['notes', 'notes'],
      ['status', 'status'],
    ];

    for (const [key, column] of map) {
      const value = input[key] as string | number | null | undefined;
      if (value === undefined) continue;
      sets.push(`${column} = ?`);
      params.push(value === '' ? null : value);
    }

    if (sets.length) {
      sets.push("updated_at = datetime('now')");
      params.push(id);
      execute(`UPDATE members SET ${sets.join(', ')} WHERE id = ?`, params);
    }

    if (input.health !== undefined) {
      upsertHealth(id, input as MemberInput);
    }
  });
}

function upsertHealth(memberId: number, input: MemberInput | MemberUpdateInput): void {
  const health = input.health;
  if (!health) return;

  const existing = getHealthRow(memberId);
  const consentSignedAt = health.consentSigned
    ? (existing?.consent_signed_at ?? new Date().toISOString())
    : null;

  execute(
    `INSERT INTO member_health (
      member_id, conditions_json, injuries, medications, medical_clearance,
      medical_clearance_expires_on, consent_signed_at, notes, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(member_id) DO UPDATE SET
      conditions_json = excluded.conditions_json,
      injuries = excluded.injuries,
      medications = excluded.medications,
      medical_clearance = excluded.medical_clearance,
      medical_clearance_expires_on = excluded.medical_clearance_expires_on,
      consent_signed_at = excluded.consent_signed_at,
      notes = excluded.notes,
      updated_at = datetime('now')`,
    [
      memberId,
      JSON.stringify(health.conditions ?? []),
      health.injuries ?? '',
      health.medications ?? '',
      health.medicalClearance ? 1 : 0,
      health.medicalClearanceExpiresOn ?? null,
      consentSignedAt,
      health.notes ?? '',
    ],
  );
}

export function archiveMember(id: number): void {
  execute(
    `UPDATE members SET status = 'archived', updated_at = datetime('now') WHERE id = ?`,
    [id],
  );
}

export function listRoutinesForMember(memberId: number) {
  return queryAll<RoutineRow>(
    `SELECT * FROM routines WHERE member_id = ? ORDER BY version DESC, id DESC`,
    [memberId],
  ).map(mapRoutineListItem);
}

export function createMembership(
  memberId: number,
  planId: number,
  priceCents: number,
  startsOn: string,
  endsOn: string,
  notes: string,
): number {
  return transaction(() => {
    execute(
      `UPDATE memberships
       SET status = 'expired'
       WHERE member_id = ? AND status = 'active'`,
      [memberId],
    );

    const result = execute(
      `INSERT INTO memberships (member_id, plan_id, price_cents, starts_on, ends_on, status, notes)
       VALUES (?, ?, ?, ?, ?, 'active', ?)`,
      [memberId, planId, priceCents, startsOn, endsOn, notes],
    );

    return result.lastInsertRowid;
  });
}
