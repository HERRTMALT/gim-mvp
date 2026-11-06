import { useEffect, useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  ChevronRight,
  Plus,
  Search,
  Users,
  X,
} from 'lucide-react';
import type { MemberListItem, MemberStatus } from '../../shared/types';
import { api, getErrorMessage } from '../lib/api';
import { daysBetween, formatDate, fullName, todayISO } from '../lib/utils';
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  Input,
  LinkButton,
  LoadingBlock,
  PageHeader,
} from '../components/ui';

type FilterValue = 'todos' | 'active' | 'inactive' | 'sin-cuota';

const FILTERS: Array<{ value: FilterValue; label: string }> = [
  { value: 'todos', label: 'Todos' },
  { value: 'active', label: 'Activos' },
  { value: 'inactive', label: 'Inactivos' },
  { value: 'sin-cuota', label: 'Sin cuota' },
];

function useDebounced<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timeout = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timeout);
  }, [value, delay]);
  return debounced;
}

function statusBadge(status: MemberStatus) {
  if (status === 'active') return <Badge variant="success">Activo</Badge>;
  if (status === 'inactive') return <Badge variant="neutral">Inactivo</Badge>;
  return <Badge variant="danger">Archivado</Badge>;
}

function MembershipCell({ member, today }: { member: MemberListItem; today: string }) {
  if (!member.membershipEndsOn) {
    return <Badge variant="warning">Sin cuota</Badge>;
  }
  const remaining = daysBetween(today, member.membershipEndsOn);
  if (remaining < 0) {
    return (
      <div className="space-y-1">
        <p className="text-sm text-slate-600">{formatDate(member.membershipEndsOn)}</p>
        <Badge variant="danger">Vencida</Badge>
      </div>
    );
  }
  if (remaining <= 7) {
    return (
      <div className="space-y-1">
        <p className="text-sm text-slate-600">{formatDate(member.membershipEndsOn)}</p>
        <Badge variant="warning">
          {remaining === 0 ? 'Vence hoy' : `En ${remaining} días`}
        </Badge>
      </div>
    );
  }
  return (
    <div className="space-y-1">
      <p className="text-sm text-slate-600">{formatDate(member.membershipEndsOn)}</p>
      <Badge variant="neutral">{remaining} días</Badge>
    </div>
  );
}

export function MembersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawFilter = searchParams.get('estado') ?? 'todos';
  const filter: FilterValue = FILTERS.some((item) => item.value === rawFilter)
    ? (rawFilter as FilterValue)
    : 'todos';
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounced(query);
  const today = todayISO();

  const statusParam = filter === 'active' || filter === 'sin-cuota' ? 'active' : filter === 'inactive' ? 'inactive' : undefined;

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ['members', debouncedQuery, statusParam],
    queryFn: () =>
      api<{ members: MemberListItem[] }>(
        `/members?q=${encodeURIComponent(debouncedQuery)}${statusParam ? `&status=${statusParam}` : ''}`,
      ),
    placeholderData: keepPreviousData,
  });

  const members = useMemo(() => {
    const all = data?.members ?? [];
    if (filter !== 'sin-cuota') return all;
    return all.filter(
      (member) => !member.membershipEndsOn || member.membershipEndsOn < today,
    );
  }, [data, filter, today]);

  const setFilter = (value: FilterValue) => {
    const next = new URLSearchParams(searchParams);
    if (value === 'todos') next.delete('estado');
    else next.set('estado', value);
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Socios"
        description="Registro de socios, estado de cuota y acceso a sus rutinas."
        actions={
          <LinkButton to="/socios/nuevo">
            <Plus className="h-4 w-4" /> Nuevo socio
          </LinkButton>
        }
      />

      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por nombre, DNI o teléfono…"
                className="pl-9 pr-9"
                aria-label="Buscar socios"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  aria-label="Limpiar búsqueda"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 lg:pb-0">
              {FILTERS.map((item) => (
                <Button
                  key={item.value}
                  variant={filter === item.value ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setFilter(item.value)}
                  className="whitespace-nowrap"
                >
                  {item.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3 text-sm text-slate-500">
            <span>
              {isLoading
                ? 'Buscando…'
                : `${members.length} ${members.length === 1 ? 'socio' : 'socios'}`}
              {isFetching && !isLoading ? ' · actualizando…' : ''}
            </span>
            {filter === 'sin-cuota' && <Badge variant="warning">Cuota vencida o ausente</Badge>}
          </div>

          {error ? (
            <Alert variant="danger" title="No pudimos cargar los socios">
              {getErrorMessage(error)}
            </Alert>
          ) : isLoading ? (
            <LoadingBlock label="Cargando socios…" />
          ) : members.length === 0 ? (
            <EmptyState
              icon={Users}
              title={debouncedQuery ? 'No encontramos socios' : 'Todavía no hay socios'}
              description={
                debouncedQuery
                  ? 'Probá con otro nombre, DNI o teléfono.'
                  : 'Cargá el primer socio para empezar a registrar cuotas y rutinas.'
              }
              action={
                !debouncedQuery ? (
                  <LinkButton to="/socios/nuevo" size="sm">
                    <Plus className="h-4 w-4" /> Nuevo socio
                  </LinkButton>
                ) : undefined
              }
            />
          ) : (
            <>
              <div className="hidden overflow-hidden rounded-xl border border-slate-200 md:block">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Socio</th>
                      <th className="px-4 py-3 font-semibold">Contacto</th>
                      <th className="px-4 py-3 font-semibold">Plan</th>
                      <th className="px-4 py-3 font-semibold">Vence</th>
                      <th className="px-4 py-3 font-semibold">Estado</th>
                      <th className="px-4 py-3 text-right font-semibold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {members.map((member) => (
                      <tr key={member.id} className="transition hover:bg-slate-50/70">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar firstName={member.firstName} lastName={member.lastName} />
                            <div className="min-w-0">
                              <Link
                                to={`/socios/${member.id}`}
                                className="block truncate font-medium text-slate-900 hover:text-emerald-700"
                              >
                                {fullName(member)}
                              </Link>
                              <p className="text-xs text-slate-500">
                                {member.dni ? `DNI ${member.dni}` : 'Sin DNI'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {member.phone ?? <span className="text-slate-400">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          {member.planName ? (
                            <span className="text-slate-700">{member.planName}</span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <MembershipCell member={member} today={today} />
                        </td>
                        <td className="px-4 py-3">{statusBadge(member.status)}</td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            to={`/socios/${member.id}`}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
                          >
                            Ver <ChevronRight className="h-4 w-4" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <ul className="space-y-2 md:hidden">
                {members.map((member) => (
                  <li key={member.id}>
                    <Link
                      to={`/socios/${member.id}`}
                      className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 transition active:bg-slate-50"
                    >
                      <Avatar firstName={member.firstName} lastName={member.lastName} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-medium text-slate-900">{fullName(member)}</p>
                          {statusBadge(member.status)}
                        </div>
                        <p className="truncate text-xs text-slate-500">
                          {member.planName ?? 'Sin plan'}
                          {member.membershipEndsOn ? ` · vence ${formatDate(member.membershipEndsOn)}` : ''}
                        </p>
                        <p className="truncate text-xs text-slate-400">
                          {member.phone ?? member.dni ?? 'Sin contacto'}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-slate-300" />
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
