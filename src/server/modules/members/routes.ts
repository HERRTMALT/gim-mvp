import { Router } from 'express';
import {
  memberInputSchema,
  memberUpdateSchema,
  membershipInputSchema,
} from '../../../shared/schemas';
import { MEMBER_STATUSES, type MemberStatus } from '../../../shared/types';
import { parseBody, parseId } from '../../shared/validation';
import {
  addMember,
  addMembership,
  editMember,
  getMemberWithHistory,
  removeMember,
  searchMembers,
} from './service';

export const membersRouter = Router();

membersRouter.get('/', (request, response) => {
  const query = typeof request.query.q === 'string' ? request.query.q : '';
  const statusValue = typeof request.query.status === 'string' ? request.query.status : undefined;
  const status =
    statusValue && MEMBER_STATUSES.includes(statusValue as MemberStatus)
      ? (statusValue as MemberStatus)
      : undefined;
  response.json({ members: searchMembers(query, status) });
});

membersRouter.post('/', (request, response) => {
  const input = parseBody(memberInputSchema, request.body);
  response.status(201).json(addMember(input));
});

membersRouter.get('/:id', (request, response) => {
  const id = parseId(request.params.id);
  response.json(getMemberWithHistory(id));
});

membersRouter.patch('/:id', (request, response) => {
  const id = parseId(request.params.id);
  const input = parseBody(memberUpdateSchema, request.body);
  response.json(editMember(id, input));
});

membersRouter.post('/:id/archive', (request, response) => {
  const id = parseId(request.params.id);
  removeMember(id);
  response.json({ ok: true });
});

membersRouter.post('/:id/memberships', (request, response) => {
  const id = parseId(request.params.id);
  const input = parseBody(membershipInputSchema, request.body);
  response.status(201).json(addMembership(id, input));
});
