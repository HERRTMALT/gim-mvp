import { Router } from 'express';
import { planUpdateSchema } from '../../../shared/schemas';
import { NotFoundError } from '../../shared/errors';
import { parseBody, parseId } from '../../shared/validation';
import { getPlanById, listPlans, updatePlanPrice } from './repository';

export const plansRouter = Router();

plansRouter.get('/', (_request, response) => {
  response.json({ plans: listPlans() });
});

plansRouter.patch('/:id', (request, response) => {
  const id = parseId(request.params.id);
  const plan = getPlanById(id);
  if (!plan) throw new NotFoundError('Plan no encontrado');

  const { priceCents } = parseBody(planUpdateSchema, request.body);
  updatePlanPrice(id, priceCents);
  response.json({ plan: listPlans().find((item) => item.id === id) });
});
