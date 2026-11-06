import { renderToBuffer } from '@react-pdf/renderer';
import type { Member, Routine } from '../../../shared/types';
import { RoutineDocument } from './RoutineDocument';

export async function renderRoutinePdf(routine: Routine, member: Member): Promise<Buffer> {
  return renderToBuffer(<RoutineDocument routine={routine} member={member} />);
}
