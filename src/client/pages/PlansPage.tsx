import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, Check, CreditCard, Pencil, Users } from 'lucide-react';
import { toast } from 'sonner';
import type { Plan } from '../../shared/types';
import { api, getErrorMessage } from '../lib/api';
import { formatCurrency } from '../lib/utils';
import {
  Alert,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Field,
  Input,
  LinkButton,
  LoadingBlock,
  PageHeader,
  Spinner,
} from '../components/ui';

function PlanCard({ plan }: { plan: Plan }) {
  const queryClient = useQueryClient();
  const [price, setPrice] = useState(String(plan.priceCents / 100));

  useEffect(() => {
    setPrice(String(plan.priceCents / 100));
  }, [plan.priceCents]);

  const numericPrice = Number(price);
  const isValid = price.trim() !== '' && Number.isFinite(numericPrice) && numericPrice >= 0;
  const cents = isValid ? Math.round(numericPrice * 100) : 0;
  const isDirty = isValid && cents !== plan.priceCents;

  const mutation = useMutation({
    mutationFn: (priceCents: number) =>
      api<{ plan: Plan }>(`/plans/${plan.id}`, { method: 'PATCH', body: { priceCents } }),
    onSuccess: () => {
      toast.success(`Precio de ${plan.name} actualizado`);
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>{plan.name}</CardTitle>
            <CardDescription>
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                {plan.daysPerWeek} días por semana
              </span>
            </CardDescription>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <CreditCard className="h-5 w-5" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Precio actual</p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            {formatCurrency(plan.priceCents)}
          </p>
        </div>

        <form
          className="mt-auto space-y-3 border-t border-slate-100 pt-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!isDirty) return;
            mutation.mutate(cents);
          }}
        >
          <Field
            label="Nuevo precio (ARS)"
            htmlFor={`plan-price-${plan.id}`}
            hint="Se usa al registrar nuevas cuotas."
            error={!isValid && price.trim() !== '' ? 'Ingresá un precio válido' : undefined}
          >
            <div className="flex gap-2">
              <Input
                id={`plan-price-${plan.id}`}
                type="number"
                min={0}
                step={100}
                inputMode="numeric"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
              />
              <Button type="submit" disabled={!isDirty || mutation.isPending}>
                {mutation.isPending ? <Spinner /> : isDirty ? <Check className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                Guardar
              </Button>
            </div>
          </Field>
        </form>
      </CardContent>
    </Card>
  );
}

export function PlansPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['plans'],
    queryFn: () => api<{ plans: Plan[] }>('/plans'),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Planes y precios"
        description="Los tres planes del gimnasio y su precio mensual. El precio se copia a la cuota al momento de registrarla."
        actions={
          <LinkButton to="/socios" variant="outline">
            <Users className="h-4 w-4" /> Ver socios
          </LinkButton>
        }
      />

      <Alert variant="info" title="Los cambios no afectan cuotas ya registradas">
        Cada membresía guarda el precio que tenía el plan cuando se cargó. Si actualizás el precio, las
        cuotas anteriores conservan su valor histórico.
      </Alert>

      {isLoading ? (
        <LoadingBlock label="Cargando planes…" />
      ) : error || !data ? (
        <Alert variant="danger" title="No pudimos cargar los planes">
          {getErrorMessage(error)}
        </Alert>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data.plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      )}
    </div>
  );
}
