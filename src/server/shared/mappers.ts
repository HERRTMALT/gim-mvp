import type {
  Condition,
  Member,
  MemberHealth,
  MemberListItem,
  MemberStatus,
  Membership,
  Plan,
  Routine,
  RoutineInput,
  RoutineListItem,
  RoutinePlan,
  RoutineSource,
  RoutineStatus,
} from '../../shared/types';
import { toIso } from './dates';

export type MemberRow = {
  id: number;
  first_name: string;
  last_name: string;
  dni: string | null;
  birth_date: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  emergency_name: string | null;
  emergency_phone: string | null;
  notes: string | null;
  status: MemberStatus;
  created_at: string;
  updated_at: string;
};

export type HealthRow = {
  member_id: number;
  conditions_json: string;
  injuries: string;
  medications: string;
  medical_clearance: number;
  medical_clearance_expires_on: string | null;
  consent_signed_at: string | null;
  notes: string;
  updated_at: string;
};

export type PlanRow = {
  id: number;
  name: string;
  days_per_week: number;
  price_cents: number;
  active: number;
  created_at: string;
  updated_at: string;
};

export type MembershipRow = {
  id: number;
  member_id: number;
  plan_id: number;
  price_cents: number;
  starts_on: string;
  ends_on: string;
  status: 'active' | 'expired' | 'cancelled';
  notes: string | null;
  created_at: string;
  plan_name?: string;
  days_per_week?: number;
};

export type MemberListRow = MemberRow & {
  plan_name: string | null;
  membership_ends_on: string | null;
};

export type RoutineRow = {
  id: number;
  member_id: number;
  version: number;
  status: RoutineStatus;
  source: RoutineSource;
  rules_version: string;
  input_json: string;
  plan_json: string;
  warnings_json: string;
  seed: number;
  created_at: string;
  updated_at: string;
  member_name?: string;
};

export function parseJsonArray<T = string>(value: string): T[] {
  try {
    const parsed = JSON.parse(value) as T[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function mapHealthRow(row: HealthRow | undefined): MemberHealth | null {
  if (!row) return null;
  return {
    conditions: parseJsonArray<Condition>(row.conditions_json),
    injuries: row.injuries,
    medications: row.medications,
    medicalClearance: row.medical_clearance === 1,
    medicalClearanceExpiresOn: row.medical_clearance_expires_on,
    consentSignedAt: row.consent_signed_at,
    notes: row.notes,
    updatedAt: toIso(row.updated_at),
  };
}

export function mapMembershipRow(row: MembershipRow | undefined): Membership | null {
  if (!row) return null;
  return {
    id: row.id,
    memberId: row.member_id,
    planId: row.plan_id,
    planName: row.plan_name ?? '',
    daysPerWeek: row.days_per_week ?? 0,
    priceCents: row.price_cents,
    startsOn: row.starts_on,
    endsOn: row.ends_on,
    status: row.status,
    notes: row.notes,
    createdAt: toIso(row.created_at),
  };
}

export function mapMember(
  row: MemberRow,
  health: HealthRow | undefined,
  membership: MembershipRow | undefined,
): Member {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    dni: row.dni,
    birthDate: row.birth_date,
    phone: row.phone,
    email: row.email,
    address: row.address,
    emergencyName: row.emergency_name,
    emergencyPhone: row.emergency_phone,
    notes: row.notes,
    status: row.status,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    health: mapHealthRow(health),
    currentMembership: mapMembershipRow(membership),
  };
}

export function mapMemberListItem(row: MemberListRow): MemberListItem {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    dni: row.dni,
    phone: row.phone,
    status: row.status,
    planName: row.plan_name,
    membershipEndsOn: row.membership_ends_on,
    createdAt: toIso(row.created_at),
  };
}

export function mapPlan(row: PlanRow): Plan {
  return {
    id: row.id,
    name: row.name,
    daysPerWeek: row.days_per_week,
    priceCents: row.price_cents,
    active: row.active === 1,
    updatedAt: toIso(row.updated_at),
  };
}

export function mapRoutine(row: RoutineRow): Routine {
  return {
    id: row.id,
    memberId: row.member_id,
    memberName: row.member_name,
    version: row.version,
    status: row.status,
    source: row.source,
    rulesVersion: row.rules_version,
    input: JSON.parse(row.input_json) as RoutineInput,
    plan: JSON.parse(row.plan_json) as RoutinePlan,
    warnings: parseJsonArray(row.warnings_json),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

export function mapRoutineListItem(row: RoutineRow): RoutineListItem {
  const plan = JSON.parse(row.plan_json) as RoutinePlan;
  return {
    id: row.id,
    version: row.version,
    status: row.status,
    source: row.source,
    goalLabel: plan.summary.goalLabel,
    daysPerWeek: plan.summary.daysPerWeek,
    createdAt: toIso(row.created_at),
  };
}
