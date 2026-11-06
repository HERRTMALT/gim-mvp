import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  Dumbbell,
  Edit3,
  RefreshCw,
  UserRound,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Routine } from '../../shared/types';
import { api, getErrorMessage } from '../lib/api';
import { formatDate, formatDateTime } from '../lib/utils';
import { RoutinePlanView, RoutineSummary } from '../components/RoutinePlanView';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  LinkButton,
  LoadingBlock,
  Modal,
  PageHeader,
} from '../components/ui';

export function RoutineViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [regenerateOpen, setRegenerateOpen] = useState(false);

  const routineQuery = useQuery({
    queryKey: ['routine', id],
    queryFn: () => api<{ routine: Routine }>(`/routines/${id}`),
    enabled: Boolean(id),
  });

  const regenerateMutation = useMutation({
    mutationFn: () =>
      api<{ routine: Routine }>(`/routines/${id}/regenerate`, { method: 'POST' }),
    onSuccess: ({ routine }) => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['member', String(routine.memberId)] });
      toast.success(`Rutina v${routine.version} generada`);
      setRegenerateOpen(false);
      navigate(`/rutinas/${routine.id}`, { replace: true });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  if (routineQuery.isLoading) return <LoadingBlock label="Cargando rutina…" />;

  if (routineQuery.error || !routineQuery.data) {
    return (
      <div className="space-y-4">
        <LinkButton to="/socios" variant="outline" size="sm">
          <ArrowLeft className="h-4 w-4" /> Volver a socios
        </LinkButton>
        <Alert variant="danger" title="No pudimos cargar la rutina">
          {getErrorMessage(routineQuery.error)}
        </Alert>
      </div>
    );
  }

  const { routine } = routineQuery.data;

  return (
    <div className="space-y-6">
      <div>
        <Link
          to={`/socios/${routine.memberId}`}
          className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" /> Volver al socio
        </Link>
        <PageHeader
          title={`Rutina v${routine.version}`}
          description={
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to={`/socios/${routine.memberId}`}
                className="inline-flex items-center gap-1 font-medium text-emerald-700 hover:text-emerald-800"
              >
                <UserRound className="h-3.5 w-3.5" />
                {routine.memberName ?? 'Socio'}
              </Link>
              <span>·</span>
              <span>{routine.plan.summary.goalLabel}</span>
              <span>·</span>
              <span>{routine.plan.summary.daysPerWeek} días / semana</span>
              <span>·</span>
              <span>{formatDate(routine.createdAt)}</span>
            </div>
          }
          actions={
            <>
              <a
                href={`/api/routines/${routine.id}/pdf`}
                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <Download className="h-4 w-4" /> PDF
              </a>
              <LinkButton to={`/rutinas/${routine.id}/editar`} variant="outline">
                <Edit3 className="h-4 w-4" /> Editar
              </LinkButton>
              <Button variant="secondary" onClick={() => setRegenerateOpen(true)}>
                <RefreshCw className="h-4 w-4" /> Regenerar
              </Button>
            </>
          }
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={routine.source === 'manual' ? 'info' : 'brand'}>
          <Dumbbell className="h-3.5 w-3.5" />
          {routine.source === 'manual' ? 'Editada manualmente' : 'Generada automáticamente'}
        </Badge>
        <Badge variant={routine.status === 'final' ? 'success' : 'warning'}>
          {routine.status === 'final' ? 'Final' : 'Borrador'}
        </Badge>
        <Badge variant="neutral">Reglas v{routine.rulesVersion}</Badge>
        <span className="text-xs text-slate-400">
          Actualizada {formatDateTime(routine.updatedAt)}
        </span>
      </div>

      <RoutineSummary plan={routine.plan} />

      <RoutinePlanView plan={routine.plan} warnings={routine.warnings} />

      <Card>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium text-slate-800">¿Necesitás otra variante?</p>
            <p className="text-sm text-slate-500">
              Regenerar crea una nueva versión con el mismo objetivo y otras variantes de ejercicios.
            </p>
          </div>
          <Button variant="outline" onClick={() => setRegenerateOpen(true)}>
            <RefreshCw className="h-4 w-4" /> Regenerar rutina
          </Button>
        </CardContent>
      </Card>

      <Modal
        open={regenerateOpen}
        onClose={() => setRegenerateOpen(false)}
        title="Regenerar rutina"
        description="Se creará una nueva versión y la actual quedará en el historial."
        size="sm"
      >
        <div className="space-y-4">
          <Alert variant="info">
            La nueva versión usará los mismos datos del socio y el mismo equipamiento, pero puede
            cambiar la selección de ejercicios. Después podés editarla manualmente.
          </Alert>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setRegenerateOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="secondary"
              onClick={() => regenerateMutation.mutate()}
              disabled={regenerateMutation.isPending}
            >
              <RefreshCw className={`h-4 w-4 ${regenerateMutation.isPending ? 'animate-spin' : ''}`} />
              {regenerateMutation.isPending ? 'Generando…' : 'Regenerar'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
