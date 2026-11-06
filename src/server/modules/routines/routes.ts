import { Router } from 'express';
import { routineInputSchema, routineSaveSchema, routineUpdateSchema } from '../../../shared/schemas';
import { parseBody, parseId } from '../../shared/validation';
import { renderRoutinePdf } from '../../infra/pdf/render';
import {
  editRoutine,
  getRoutineOrThrow,
  getRoutinePdfData,
  handleRoutineError,
  previewRoutine,
  regenerateRoutine,
  saveRoutine,
} from './service';
import { listExercises } from './repository';

export const memberRoutinesRouter = Router({ mergeParams: true });

memberRoutinesRouter.post('/preview', (request, response) => {
  const memberId = parseId((request.params as { memberId?: string }).memberId, 'socio');
  const input = parseBody(routineInputSchema, request.body);
  try {
    const result = previewRoutine(memberId, input);
    response.json(result);
  } catch (error) {
    handleRoutineError(error);
  }
});

memberRoutinesRouter.post('/', (request, response) => {
  const memberId = parseId((request.params as { memberId?: string }).memberId, 'socio');
  const { input, plan } = parseBody(routineSaveSchema, request.body);
  try {
    const routine = saveRoutine(memberId, input, plan);
    response.status(201).json({ routine });
  } catch (error) {
    handleRoutineError(error);
  }
});

export const routinesRouter = Router();

routinesRouter.get('/:id/pdf', async (request, response, next) => {
  try {
    const id = parseId(request.params.id);
    const { routine, member } = getRoutinePdfData(id);
    const buffer = await renderRoutinePdf(routine, member);
    const safeName = `${member.lastName}-${member.firstName}`
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9-_]+/g, '-')
      .replace(/^-+|-+$/g, '');
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="rutina-${safeName}-v${routine.version}.pdf"`,
    );
    response.send(buffer);
  } catch (error) {
    next(error);
  }
});

routinesRouter.get('/:id', (request, response) => {
  const id = parseId(request.params.id);
  response.json({ routine: getRoutineOrThrow(id) });
});

routinesRouter.patch('/:id', (request, response) => {
  const id = parseId(request.params.id);
  const { plan } = parseBody(routineUpdateSchema, request.body);
  response.json({ routine: editRoutine(id, plan) });
});

routinesRouter.post('/:id/regenerate', (request, response) => {
  const id = parseId(request.params.id);
  try {
    response.status(201).json({ routine: regenerateRoutine(id) });
  } catch (error) {
    handleRoutineError(error);
  }
});

export const exercisesRouter = Router();

exercisesRouter.get('/', (_request, response) => {
  response.json({ exercises: listExercises() });
});
