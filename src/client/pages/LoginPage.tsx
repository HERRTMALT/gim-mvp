import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Dumbbell, Eye, EyeOff, LockKeyhole, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../lib/auth';
import { getErrorMessage } from '../lib/api';
import { Button, Field, Input, Spinner } from '../components/ui';

type LoginValues = { password: string };

export function LoginPage() {
  const { status, login, gymName } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);

  const from = (location.state as { from?: { pathname: string; search?: string } } | null)?.from;
  const target = from ? `${from.pathname}${from.search ?? ''}` : '/';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({ defaultValues: { password: '' } });

  const mutation = useMutation({
    mutationFn: async (values: LoginValues) => {
      await login(values.password);
    },
    onSuccess: () => {
      toast.success('Bienvenido al panel');
      navigate(target, { replace: true });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  if (status === 'authenticated') return <Navigate to={target} replace />;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-10">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-teal-500/20 blur-3xl" />

      <div className="relative w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-3 text-white">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 shadow-lg shadow-emerald-500/30">
            <Dumbbell className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xl font-bold leading-tight">{gymName}</p>
            <p className="text-sm text-slate-400">Panel de gestión</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white p-6 shadow-2xl sm:p-8">
          <div className="mb-6 space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Ingresá al panel</h1>
            <p className="text-sm text-slate-500">
              Un solo acceso para el dueño del gimnasio. La contraseña se valida contra el archivo
              <span className="mx-1 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-700">
                .env
              </span>
              del servidor.
            </p>
          </div>

          <form
            className="space-y-4"
            onSubmit={handleSubmit((values) => mutation.mutate(values))}
            noValidate
          >
            <Field label="Contraseña" htmlFor="password" error={errors.password?.message} required>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  autoFocus
                  className="pl-9 pr-10"
                  placeholder="Tu contraseña"
                  {...register('password', { required: 'Ingresá la contraseña' })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>

            <Button type="submit" size="lg" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? <Spinner /> : <LockKeyhole className="h-4 w-4" />}
              {mutation.isPending ? 'Ingresando…' : 'Ingresar'}
            </Button>
          </form>

          <div className="mt-6 flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-500">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <p>
              Los datos se guardan localmente en SQLite. Si te equivocás varias veces, el acceso se
              bloquea unos minutos por seguridad.
            </p>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-slate-500">
          {gymName} · Sistema de gestión interno
        </p>
      </div>
    </div>
  );
}
