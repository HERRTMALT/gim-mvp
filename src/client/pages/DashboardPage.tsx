import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CreditCard,
  Dumbbell,
  Plus,
  Users,
  UserPlus,
  UserX,
} from 'lucide-react';
import type { DashboardData } from '../../shared/types';
import { api, getErrorMessage } from '../lib/api';
import { useAuth } from '../lib/auth';
import {
  daysBetween,
  formatDate,
  formatLongDate,
  fullName,
  pluralize,
} from '../lib/utils';
import {
  Alert,
  Avatar,
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  LinkButton,
  LoadingBlock,
  PageHeader,
  StatCard,
} from '../components/ui';

export function DashboardPage() {
  const { gymName } = useAuth();
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api<DashboardData>('/dashboard'),
  });

  if (isLoading) return <LoadingBlock label="Cargando panel…" />;

  if (error || !data) {
    return (
      <div className="space-y-4">
        <PageHeader title="Panel" />
        <Alert variant="danger" title="No pudimos cargar el panel">
          {getErrorMessage(error)}
        </Alert>
      </div>
    );
  }

  const maxPlan = Math.max(1, ...data.planDistribution.map((plan) => plan.count));

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Hola, ${gymName}`}
        description={
          <span className="capitalize">{formatLongDate(data.today)}</span>
        }
        actions={
          <>
            <LinkButton to="/socios" variant="outline">
              <Users className="h-4 w-4" /> Ver socios
            </LinkButton>
            <LinkButton to="/socios/nuevo">
              <Plus className="h-4 w-4" /> Nuevo socio
            </LinkButton>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Users}
          label="Socios activos"
          value={data.activeMembers}
          hint={`${data.totalMembers} ${pluralize(data.totalMembers, 'socio registrado', 'socios registrados')}`}
          tone="emerald"
        />
        <StatCard
          icon={CalendarClock}
          label="Vencen en 7 días"
          value={data.expiringSoon}
          hint="Cuotas por renovar"
          tone="amber"
        />
        <StatCard
          icon={UserPlus}
          label="Nuevos este mes"
          value={data.newThisMonth}
          hint="Altas del mes en curso"
          tone="sky"
        />
        <StatCard
          icon={UserX}
          label="Sin cuota activa"
          value={data.withoutMembership}
          hint="Socios activos sin membresía vigente"
          tone="rose"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle>Cuotas por vencer</CardTitle>
              <CardDescription>Socios con membresía que termina esta semana.</CardDescription>
            </div>
            <Badge variant={data.expiringSoon > 0 ? 'warning' : 'success'}>
              {data.expiringSoon} {pluralize(data.expiringSoon, 'cuota', 'cuotas')}
            </Badge>
          </CardHeader>
          <CardContent>
            {data.expiringMembers.length === 0 ? (
              <EmptyState
                icon={CalendarClock}
                title="No hay cuotas por vencer"
                description="Ninguna membresía termina en los próximos 7 días."
              />
            ) : (
              <ul className="divide-y divide-slate-100">
                {data.expiringMembers.map((member) => {
                  const remaining = daysBetween(data.today, member.endsOn);
                  return (
                    <li key={member.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                      <Avatar firstName={member.firstName} lastName={member.lastName} />
                      <div className="min-w-0 flex-1">
                        <Link
                          to={`/socios/${member.id}`}
                          className="block truncate font-medium text-slate-900 hover:text-emerald-700"
                        >
                          {fullName(member)}
                        </Link>
                        <p className="truncate text-xs text-slate-500">
                          {member.planName}
                          {member.phone ? ` · ${member.phone}` : ''}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-medium text-slate-700">
                          {formatDate(member.endsOn)}
                        </p>
                        <Badge variant={remaining <= 1 ? 'danger' : 'warning'}>
                          {remaining <= 0
                            ? 'Vence hoy'
                            : `En ${remaining} ${pluralize(remaining, 'día', 'días')}`}
                        </Badge>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribución por plan</CardTitle>
            <CardDescription>Socios activos con cuota vigente.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.planDistribution.length === 0 ? (
              <EmptyState
                icon={CreditCard}
                title="Sin cuotas activas"
                description="Registrá una membresía para ver la distribución."
              />
            ) : (
              <div className="space-y-4">
                {data.planDistribution.map((plan) => (
                  <div key={plan.planName} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="font-medium text-slate-700">{plan.planName}</span>
                      <span className="text-slate-500">
                        {plan.count} {pluralize(plan.count, 'socio', 'socios')}
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${Math.max(6, (plan.count / maxPlan) * 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-400">{plan.daysPerWeek} días por semana</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle>Últimos socios</CardTitle>
              <CardDescription>Altas más recientes del registro.</CardDescription>
            </div>
            <Link
              to="/socios"
              className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:text-emerald-800"
            >
              Ver todos <ArrowRight className="h-4 w-4" />
            </Link>
          </CardHeader>
          <CardContent>
            {data.recentMembers.length === 0 ? (
              <EmptyState
                icon={Users}
                title="Todavía no hay socios"
                description="Cargá el primer socio para empezar a usar el sistema."
                action={
                  <LinkButton to="/socios/nuevo" size="sm">
                    <Plus className="h-4 w-4" /> Nuevo socio
                  </LinkButton>
                }
              />
            ) : (
              <ul className="divide-y divide-slate-100">
                {data.recentMembers.map((member) => (
                  <li key={member.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <Avatar firstName={member.firstName} lastName={member.lastName} />
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/socios/${member.id}`}
                        className="block truncate font-medium text-slate-900 hover:text-emerald-700"
                      >
                        {fullName(member)}
                      </Link>
                      <p className="text-xs text-slate-500">Alta: {formatDate(member.createdAt)}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-slate-300" />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rutinas recientes</CardTitle>
            <CardDescription>Últimos planes de entrenamiento generados.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.recentRoutines.length === 0 ? (
              <EmptyState
                icon={Dumbbell}
                title="Todavía no hay rutinas"
                description="Entrá al perfil de un socio y generá su primera rutina."
              />
            ) : (
              <ul className="divide-y divide-slate-100">
                {data.recentRoutines.map((routine) => (
                  <li key={routine.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-700">
                      <Dumbbell className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/rutinas/${routine.id}`}
                        className="block truncate font-medium text-slate-900 hover:text-emerald-700"
                      >
                        {routine.memberName}
                      </Link>
                      <p className="truncate text-xs text-slate-500">
                        {routine.goalLabel} · v{routine.version} · {formatDate(routine.createdAt)}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-slate-300" />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {data.withoutMembership > 0 && (
        <Alert variant="warning" title="Hay socios activos sin cuota vigente">
          Revisá la lista de socios y registrá la membresía correspondiente para que el panel refleje
          su situación real.{' '}
          <Link to="/socios?estado=sin-cuota" className="font-semibold underline">
            Revisar socios
          </Link>
          .
        </Alert>
      )}

      <div className="flex items-start gap-2 text-xs text-slate-400">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Los datos de salud son sensibles. Este panel es de uso interno: no compartas capturas ni
          información de socios por canales públicos.
        </p>
      </div>
    </div>
  );
}
