import type { MemberInput, MemberUpdateInput, MembershipInput } from '../../../shared/schemas';
import { NotFoundError, ValidationError } from '../../shared/errors';
import { getPlanById } from '../plans/repository';
import {
  archiveMember,
  createMember,
  createMembership,
  getHealthRow,
  getLatestMembershipRow,
  getMemberDetails,
  getMemberRow,
  getMemberships,
  listMembers,
  listRoutinesForMember,
  updateMember,
} from './repository';
import { mapMember } from '../../shared/mappers';

export function searchMembers(query: string, status?: Parameters<typeof listMembers>[1]) {
  return listMembers(query, status);
}

export function getMember(id: number) {
  const row = getMemberRow(id);
  if (!row) throw new NotFoundError('Socio no encontrado');
  return mapMember(row, getHealthRow(id), getLatestMembershipRow(id));
}

export function getMemberWithHistory(id: number) {
  const member = getMemberDetails(id);
  if (!member) throw new NotFoundError('Socio no encontrado');
  return {
    member,
    memberships: getMemberships(id),
    routines: listRoutinesForMember(id),
  };
}

export function addMember(input: MemberInput) {
  const id = createMember(input);
  return getMemberWithHistory(id);
}

export function editMember(id: number, input: MemberUpdateInput) {
  const existing = getMemberRow(id);
  if (!existing) throw new NotFoundError('Socio no encontrado');
  updateMember(id, input);
  return getMemberWithHistory(id);
}

export function removeMember(id: number) {
  const existing = getMemberRow(id);
  if (!existing) throw new NotFoundError('Socio no encontrado');
  archiveMember(id);
}

export function addMembership(id: number, input: MembershipInput) {
  const member = getMemberRow(id);
  if (!member) throw new NotFoundError('Socio no encontrado');

  const plan = getPlanById(input.planId);
  if (!plan || plan.active !== 1) throw new ValidationError('El plan seleccionado no está disponible');

  createMembership(
    id,
    plan.id,
    plan.price_cents,
    input.startsOn,
    input.endsOn,
    input.notes ?? '',
  );

  return getMemberWithHistory(id);
}
