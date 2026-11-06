import type {
  Member,
  Membership,
  RoutineListItem,
  RoutinePlan,
} from '../../shared/types';

export type MemberDetail = {
  member: Member;
  memberships: Membership[];
  routines: RoutineListItem[];
};

export type RoutinePreview = {
  plan: RoutinePlan;
  warnings: string[];
  rulesVersion: string;
  seed: number;
};
