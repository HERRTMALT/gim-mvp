import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarDays,
  Contact,
  CreditCard,
  Download,
  Dumbbell,
  Edit3,
  FileText,
  HeartPulse,
  Mail,
  MapPin,
  Phone,
  Plus,
  ShieldCheck,
  Trash2,
  UserRound,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  CONDITION_LABELS,
  type MemberStatus,
  type Membership,
  type Plan,
} from '../../shared/types';
import { api, getErrorMessage } from '../lib/api';
import type { MemberDetail } from '../lib/types';
import {
  addMonthsISO,
  ageFromBirthDate,
  daysBetween,
  formatCurrency,
  formatDate,
  formatDateTime,
  fullName,
  todayISO,
} from '../lib/utils';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  Field,
  Input,
  LinkButton,
  LoadingBlock,
  Modal,
  PageHeader,
  Select,
  Textarea,
} from '../components/ui';

function memberStatusBadge(status: MemberStatus) {
  if (status === 'active') return <Badge variant="success">Activo</Badge>;
  if (status === 'inactive') return <Badge variant="neutral">Inactivo</Badge>;
  return <Badge variant="danger">Archivado</Badge>;
}

function membershipStatusBadge(membership: Membership, today: string) {
  if (membership.status === 'cancelled') return <Badge variant="danger">Cancelada</Badge>;
  if (membership.endsOn < today) return <Badge variant="danger">Vencida</Badge>;
  if (membership.status === 'expired') return <Badge variant="neutral">Finalizada</Badge>;
  const remaining = daysBetween(today, membership.endsOn);
  if (remaining <= 7) return <Badge variant="warning">Vence en {remaining} días</Badge>;
  return <Badge variant="success">Vigente</Badge>;
}

function MembershipForm({
  memberId,
  plans,
  onClose,
}: {
  memberId: number;
  plans: Plan[];
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [planId, setPlanId] = useState(plans[0]?.id ?? 0);
  const [startsOn, setStartsOn] = useState(todayISO());
  const [endsOn, setEndsOn] = useState(addMonthsISO(todayISO(), 1));
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  const selectedPlan = plans.find((plan) => plan.id === planId);
  const totalDays = daysBetween(startsOn, endsOn);

  const mutation = useMutation({
    mutationFn: () =>
      api<MemberDetail>(`/members/${memberId}/memberships`, {
        method: 'POST',
        body: { planId, startsOn, endsOn, notes },
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(['member', String(memberId)], data);
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Cuota registrada');
      onClose();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return (
    <>
      <form
        id="membership-form"
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (!planId) {
            setFormError('Elegí un plan');
            return;
          }
          if (!startsOn || !endsOn) {
            setFormError('Completá las fechas de inicio y fin');
            return;
          }
          if (endsOn < startsOn) {
            setFormError('La fecha de fin no puede ser anterior al inicio');
            return;
          }
          setFormError('');
          mutation.mutate();
        }}
      >
        {plans.length === 0 ? (
          <Alert variant="warning" title="No hay planes disponibles">
            Revisá la configuración de planes antes de registrar una cuota.
          </Alert>
        ) : (
          <>
            <Field label="Plan" htmlFor="membership-plan" required>
              <Select
                id="membership-plan"
                value={planId}
                onChange={(event) => setPlanId(Number(event.target.value))}
              >
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} · {formatCurrency(plan.priceCents)}
                  </option>
                ))}
              </Select>
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Inicio" htmlFor="membership-start" required>
                <Input
                  id="membership-start"
                  type="date"
                  value={startsOn}
                  onChange={(event) => {
                    const value = event.target.value;
                    setStartsOn(value);
                    if (value) setEndsOn(addMonthsISO(value, 1));
                  }}
                />
              </Field>
              <Field label="Fin" htmlFor="membership-end" required>
                <Input
                  id="membership-end"
                  type="date"
                  value={endsOn}
                  onChange={(event) => setEndsOn(event.target.value)}
                />
              </Field>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-slate-500">Precio del plan</span>
                <span className="text-lg font-bold text-slate-900">
                  {selectedPlan ? formatCurrency(selectedPlan.priceCents) : '—'}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {selectedPlan
                  ? `${selectedPlan.daysPerWeek} días por semana · ${totalDays} ${totalDays === 1 ? 'día' : 'días'} de vigencia`
                  : 'Elegí un plan para ver el precio.'}
              </p>
            </div>

            <Field label="Notas de la cuota" htmlFor="membership-notes">
              <Textarea
                id="membership-notes"
                className="min-h-20"
                placeholder="Opcional: forma de pago, observaciones…"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </Field>

            {formError && <Alert variant="danger">{formError}</Alert>}

            <Alert variant="info">
              Al registrar una cuota nueva, la membresía activa anterior queda marcada como
              finalizada. El precio se copia desde el plan y queda guardado en el historial.
            </Alert>
          </>
        )}
      </form>

      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          type="submit"
          form="membership-form"
          disabled={mutation.isPending || plans.length === 0}
        >
          <CreditCard className="h-4 w-4" />
          {mutation.isPending ? 'Registrando…' : 'Registrar cuota'}
        </Button>
      </div>
    </>
  );
}

export function MemberDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [membershipOpen, setMembershipOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const today = todayISO();

  const memberQuery = useQuery({
    queryKey: ['member', id],
    queryFn: () => api<MemberDetail>(`/members/${id}`),
    enabled: Boolean(id),
  });

  const plansQuery = useQuery({
    queryKey: ['plans'],
    queryFn: () => api<{ plans: Plan[] }>('/plans'),
  });

  const archiveMutation = useMutation({
    mutationFn: () => api<{ ok: true }>(`/members/${id}/archive`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.removeQueries({ queryKey: ['member', id] });
      toast.success('Socio archivado');
      navigate('/socios', { replace: true });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  if (memberQuery.isLoading) return <LoadingBlock label="Cargando socio…" />;

  if (memberQuery.error || !memberQuery.data) {
    return (
      <div className="space-y-4">
        <LinkButton to="/socios" variant="outline" size="sm">
          <ArrowLeft className="h-4 w-4" /> Volver a socios
        </LinkButton>
        <Alert variant="danger" title="No pudimos cargar el socio">
          {getErrorMessage(memberQuery.error)}
        </Alert>
      </div>
    );
  }

  const { member, memberships, routines } = memberQuery.data;
  const age = ageFromBirthDate(member.birthDate);
  const health = member.health;
  const current = member.currentMembership;
  const expired = current ? current.endsOn < today : false;
  const remaining = current ? daysBetween(today, current.endsOn) : 0;

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/socios"
          className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" /> Volver a socios
        </Link>
        <PageHeader
          title={fullName(member)}
          description={
            <div className="flex flex-wrap items-center gap-2">
              {memberStatusBadge(member.status)}
              {member.dni && <span>DNI {member.dni}</span>}
              {age !== null && <span>{age} años</span>}
              <span>Socio desde {formatDate(member.createdAt)}</span>
            </div>
          }
          actions={
            <>
              <LinkButton to={`/socios/${member.id}/editar`} variant="outline">
                <Edit3 className="h-4 w-4" /> Editar
              </LinkButton>
              <Button onClick={() => setMembershipOpen(true)}>
                <CreditCard className="h-4 w-4" /> Registrar cuota
              </Button>
            </>
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="flex-row items-start justify-between gap-3">
              <div className="space-y-1">
                <CardTitle>Membresía actual</CardTitle>
                <CardDescription>Plan y vigencia más reciente.</CardDescription>
              </div>
              {current && membershipStatusBadge(current, today)}
            </CardHeader>
            <CardContent>
              {!current ? (
                <EmptyState
                  icon={CreditCard}
                  title="Sin cuota registrada"
                  description="Registrá la primera cuota para saber cuándo vence y qué plan tiene el socio."
                  action={
                    <Button size="sm" onClick={() => setMembershipOpen(true)}>
                      <Plus className="h-4 w-4" /> Registrar cuota
                    </Button>
                  }
                />
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <p className="text-2xl font-bold tracking-tight text-slate-900">
                        {current.planName}
                      </p>
                      <p className="text-sm text-slate-500">
                        {current.daysPerWeek} días por semana
                      </p>
                    </div>
                    <p className="text-xl font-semibold text-slate-800">
                      {formatCurrency(current.priceCents)}
                    </p>
                  </div>

                  <div className="grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-3">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Inicio
                      </p>
                      <p className="mt-0.5 font-medium text-slate-800">
                        {formatDate(current.startsOn)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Vence
                      </p>
                      <p className="mt-0.5 font-medium text-slate-800">
                        {formatDate(current.endsOn)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Días restantes
                      </p>
                      <p className="mt-0.5 font-medium text-slate-800">
                        {expired ? 'Vencida' : `${remaining} ${remaining === 1 ? 'día' : 'días'}`}
                      </p>
                    </div>
                  </div>

                  {expired && (
                    <Alert variant="warning" title="La cuota está vencida">
                      Registrá una renovación para actualizar el estado del socio.
                    </Alert>
                  )}
                  {current.notes && (
                    <p className="text-sm text-slate-500">Nota: {current.notes}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-start justify-between gap-3">
              <div className="space-y-1">
                <CardTitle>Rutinas</CardTitle>
                <CardDescription>Planes de entrenamiento guardados del socio.</CardDescription>
              </div>
              <LinkButton to={`/socios/${member.id}/rutina/nueva`} size="sm">
                <Plus className="h-4 w-4" /> Nueva rutina
              </LinkButton>
            </CardHeader>
            <CardContent>
              {routines.length === 0 ? (
                <EmptyState
                  icon={Dumbbell}
                  title="Todavía no hay rutinas"
                  description="Generá una rutina a partir del objetivo, el nivel y las condiciones de salud del socio."
                  action={
                    <LinkButton to={`/socios/${member.id}/rutina/nueva`} size="sm">
                      <Plus className="h-4 w-4" /> Generar rutina
                    </LinkButton>
                  }
                />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {routines.map((routine) => (
                    <li
                      key={routine.id}
                      className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:gap-3"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-700">
                        <Dumbbell className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            to={`/rutinas/${routine.id}`}
                            className="font-medium text-slate-900 hover:text-emerald-700"
                          >
                            Rutina v{routine.version}
                          </Link>
                          <Badge variant={routine.source === 'manual' ? 'info' : 'brand'}>
                            {routine.source === 'manual' ? 'Editada' : 'Generada'}
                          </Badge>
                          {routine.status === 'draft' && <Badge variant="warning">Borrador</Badge>}
                        </div>
                        <p className="text-xs text-slate-500">
                          {routine.goalLabel} · {routine.daysPerWeek} días/semana ·{' '}
                          {formatDate(routine.createdAt)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <LinkButton to={`/rutinas/${routine.id}`} size="sm" variant="outline">
                          <FileText className="h-4 w-4" /> Ver
                        </LinkButton>
                        <a
                          href={`/api/routines/${routine.id}/pdf`}
                          className="inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                        >
                          <Download className="h-4 w-4" /> PDF
                        </a>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Historial de cuotas</CardTitle>
              <CardDescription>Todas las membresías registradas para este socio.</CardDescription>
            </CardHeader>
            <CardContent>
              {memberships.length === 0 ? (
                <p className="py-4 text-center text-sm text-slate-500">
                  Todavía no hay cuotas en el historial.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] text-left text-sm">
                    <thead className="text-xs uppercase tracking-wide text-slate-400">
                      <tr>
                        <th className="pb-2 font-semibold">Plan</th>
                        <th className="pb-2 font-semibold">Inicio</th>
                        <th className="pb-2 font-semibold">Fin</th>
                        <th className="pb-2 font-semibold">Precio</th>
                        <th className="pb-2 font-semibold">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {memberships.map((membership) => (
                        <tr key={membership.id}>
                          <td className="py-2.5 pr-3 font-medium text-slate-800">
                            {membership.planName}
                          </td>
                          <td className="py-2.5 pr-3 text-slate-600">
                            {formatDate(membership.startsOn)}
                          </td>
                          <td className="py-2.5 pr-3 text-slate-600">
                            {formatDate(membership.endsOn)}
                          </td>
                          <td className="py-2.5 pr-3 text-slate-600">
                            {formatCurrency(membership.priceCents)}
                          </td>
                          <td className="py-2.5">{membershipStatusBadge(membership, today)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <HeartPulse className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Salud y seguridad</CardTitle>
                <CardDescription>Datos declarados para adaptar el entrenamiento.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {!health ? (
                <p className="text-sm text-slate-500">No hay datos de salud registrados.</p>
              ) : (
                <>
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Condiciones declaradas
                    </p>
                    {health.conditions.length === 0 ? (
                      <p className="text-sm text-slate-500">Sin condiciones declaradas.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {health.conditions.map((condition) => (
                          <Badge key={condition} variant="warning">
                            {CONDITION_LABELS[condition] ?? condition}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant={health.medicalClearance ? 'success' : 'danger'}>
                      <ShieldCheck className="h-3.5 w-3.5" />
                      {health.medicalClearance ? 'Apto médico vigente' : 'Sin apto médico'}
                    </Badge>
                    {health.medicalClearanceExpiresOn && (
                      <Badge variant="neutral">
                        Vence {formatDate(health.medicalClearanceExpiresOn)}
                      </Badge>
                    )}
                    <Badge variant={health.consentSignedAt ? 'success' : 'neutral'}>
                      {health.consentSignedAt ? 'Consentimiento firmado' : 'Consentimiento pendiente'}
                    </Badge>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Lesiones o molestias
                      </p>
                      <p className="mt-1 text-sm text-slate-700">
                        {health.injuries || 'Sin datos'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Medicamentos
                      </p>
                      <p className="mt-1 text-sm text-slate-700">
                        {health.medications || 'Sin datos'}
                      </p>
                    </div>
                  </div>

                  {health.notes && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Notas de salud
                      </p>
                      <p className="mt-1 whitespace-pre-line text-sm text-slate-700">
                        {health.notes}
                      </p>
                    </div>
                  )}

                  <p className="text-xs text-slate-400">
                    Última actualización: {formatDateTime(health.updatedAt)}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="flex-row items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                <Contact className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Contacto</CardTitle>
                <CardDescription>Datos de comunicación.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-2.5">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                {member.phone ? (
                  <a href={`tel:${member.phone}`} className="text-slate-700 hover:text-emerald-700">
                    {member.phone}
                  </a>
                ) : (
                  <span className="text-slate-400">Sin teléfono</span>
                )}
              </div>
              <div className="flex items-start gap-2.5">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                {member.email ? (
                  <a href={`mailto:${member.email}`} className="break-all text-slate-700 hover:text-emerald-700">
                    {member.email}
                  </a>
                ) : (
                  <span className="text-slate-400">Sin email</span>
                )}
              </div>
              <div className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <span className={member.address ? 'text-slate-700' : 'text-slate-400'}>
                  {member.address || 'Sin dirección'}
                </span>
              </div>
              <div className="border-t border-slate-100 pt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Emergencia
                </p>
                <p className="mt-1 text-slate-700">
                  {member.emergencyName || 'Sin contacto de emergencia'}
                </p>
                {member.emergencyPhone && (
                  <a
                    href={`tel:${member.emergencyPhone}`}
                    className="text-sm text-slate-600 hover:text-emerald-700"
                  >
                    {member.emergencyPhone}
                  </a>
                )}
              </div>
            </CardContent>
          </Card>

          {member.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notas internas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line text-sm text-slate-700">{member.notes}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="flex-row items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                <UserRound className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Ficha del socio</CardTitle>
                <CardDescription>Estado y acciones administrativas.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Estado actual</span>
                {memberStatusBadge(member.status)}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Alta</span>
                <span className="text-slate-700">{formatDate(member.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Cuotas registradas</span>
                <span className="text-slate-700">{memberships.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Rutinas</span>
                <span className="text-slate-700">{routines.length}</span>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <p className="text-xs leading-relaxed text-slate-500">
                  Archivar oculta al socio de la lista principal. No borra sus cuotas ni rutinas.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full border-rose-200 text-rose-700 hover:bg-rose-50"
                  onClick={() => setArchiveOpen(true)}
                >
                  <Trash2 className="h-4 w-4" /> Archivar socio
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal
        open={membershipOpen}
        onClose={() => setMembershipOpen(false)}
        title="Registrar cuota"
        description={`Membresía para ${fullName(member)}.`}
      >
        <MembershipForm
          memberId={member.id}
          plans={plansQuery.data?.plans ?? []}
          onClose={() => setMembershipOpen(false)}
        />
      </Modal>

      <Modal
        open={archiveOpen}
        onClose={() => setArchiveOpen(false)}
        title="Archivar socio"
        description="El socio dejará de aparecer en la lista principal."
        size="sm"
      >
        <div className="space-y-4">
          <Alert variant="warning" title="Esta acción conserva el historial">
            Se ocultará a {fullName(member)} de la lista de socios, pero sus cuotas y rutinas
            seguirán guardadas en la base de datos.
          </Alert>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setArchiveOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              disabled={archiveMutation.isPending}
              onClick={() => archiveMutation.mutate()}
            >
              <Trash2 className="h-4 w-4" />
              {archiveMutation.isPending ? 'Archivando…' : 'Archivar socio'}
            </Button>
          </div>
        </div>
      </Modal>

      <div className="flex items-start gap-2 text-xs text-slate-400">
        <CalendarDays className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          La vigencia de la cuota se calcula por fecha de fin. El estado del socio no cambia
          automáticamente al vencer: revisá la lista de cuotas por vencer.
        </p>
      </div>
    </div>
  );
}
