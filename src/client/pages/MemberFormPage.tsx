import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, HeartPulse, Save, ShieldAlert, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import {
  CONDITIONS,
  CONDITION_LABELS,
  MEMBER_STATUSES,
  MEMBER_STATUS_LABELS,
  type Condition,
  type MemberStatus,
} from '../../shared/types';
import { api, getErrorMessage } from '../lib/api';
import type { MemberDetail } from '../lib/types';
import {
  Alert,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Field,
  Input,
  LinkButton,
  LoadingBlock,
  PageHeader,
  Select,
  Textarea,
} from '../components/ui';

type FormValues = {
  firstName: string;
  lastName: string;
  dni: string;
  birthDate: string;
  phone: string;
  email: string;
  address: string;
  emergencyName: string;
  emergencyPhone: string;
  notes: string;
  status: MemberStatus;
  conditions: Condition[];
  injuries: string;
  medications: string;
  medicalClearance: boolean;
  medicalClearanceExpiresOn: string;
  consentSigned: boolean;
  healthNotes: string;
};

const DEFAULT_VALUES: FormValues = {
  firstName: '',
  lastName: '',
  dni: '',
  birthDate: '',
  phone: '',
  email: '',
  address: '',
  emergencyName: '',
  emergencyPhone: '',
  notes: '',
  status: 'active',
  conditions: [],
  injuries: '',
  medications: '',
  medicalClearance: false,
  medicalClearanceExpiresOn: '',
  consentSigned: false,
  healthNotes: '',
};

export function MemberFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const memberQuery = useQuery({
    queryKey: ['member', id],
    queryFn: () => api<MemberDetail>(`/members/${id}`),
    enabled: isEdit,
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: DEFAULT_VALUES });

  useEffect(() => {
    const member = memberQuery.data?.member;
    if (!member) return;
    reset({
      firstName: member.firstName,
      lastName: member.lastName,
      dni: member.dni ?? '',
      birthDate: member.birthDate ?? '',
      phone: member.phone ?? '',
      email: member.email ?? '',
      address: member.address ?? '',
      emergencyName: member.emergencyName ?? '',
      emergencyPhone: member.emergencyPhone ?? '',
      notes: member.notes ?? '',
      status: member.status,
      conditions: member.health?.conditions ?? [],
      injuries: member.health?.injuries ?? '',
      medications: member.health?.medications ?? '',
      medicalClearance: member.health?.medicalClearance ?? false,
      medicalClearanceExpiresOn: member.health?.medicalClearanceExpiresOn ?? '',
      consentSigned: Boolean(member.health?.consentSignedAt),
      healthNotes: member.health?.notes ?? '',
    });
  }, [memberQuery.data, reset]);

  const conditions = watch('conditions');
  const medicalClearance = watch('medicalClearance');

  const toggleCondition = (condition: Condition, checked: boolean) => {
    const next = checked
      ? [...conditions.filter((item) => item !== condition), condition]
      : conditions.filter((item) => item !== condition);
    setValue('conditions', next, { shouldDirty: true });
  };

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload = {
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        dni: values.dni.trim(),
        birthDate: values.birthDate || null,
        phone: values.phone.trim(),
        email: values.email.trim(),
        address: values.address.trim(),
        emergencyName: values.emergencyName.trim(),
        emergencyPhone: values.emergencyPhone.trim(),
        notes: values.notes.trim(),
        status: values.status,
        health: {
          conditions: values.conditions,
          injuries: values.injuries.trim(),
          medications: values.medications.trim(),
          medicalClearance: values.medicalClearance,
          medicalClearanceExpiresOn: values.medicalClearanceExpiresOn || null,
          consentSigned: values.consentSigned,
          notes: values.healthNotes.trim(),
        },
      };

      return isEdit
        ? api<MemberDetail>(`/members/${id}`, { method: 'PATCH', body: payload })
        : api<MemberDetail>('/members', { method: 'POST', body: payload });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.setQueryData(['member', String(data.member.id)], data);
      toast.success(isEdit ? 'Socio actualizado' : 'Socio creado');
      navigate(`/socios/${data.member.id}`, { replace: true });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  if (isEdit && memberQuery.isLoading) {
    return <LoadingBlock label="Cargando socio…" />;
  }

  if (isEdit && (memberQuery.error || !memberQuery.data)) {
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

  return (
    <div className="space-y-6">
      <div>
        <Link
          to={isEdit && id ? `/socios/${id}` : '/socios'}
          className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          {isEdit ? 'Volver al socio' : 'Volver a socios'}
        </Link>
        <PageHeader
          title={isEdit ? 'Editar socio' : 'Nuevo socio'}
          description={
            isEdit
              ? 'Actualizá los datos personales, de contacto y de salud.'
              : 'Completá los datos básicos. Después podés registrar la cuota y generar la rutina.'
          }
        />
      </div>

      <form
        className="space-y-6"
        onSubmit={handleSubmit((values) => mutation.mutate(values))}
        noValidate
      >
        <Card>
          <CardHeader className="flex-row items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <UserRound className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Datos personales</CardTitle>
              <CardDescription>Información básica del socio.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre" htmlFor="firstName" required error={errors.firstName?.message}>
              <Input
                id="firstName"
                autoComplete="given-name"
                {...register('firstName', { required: 'El nombre es obligatorio' })}
              />
            </Field>
            <Field label="Apellido" htmlFor="lastName" required error={errors.lastName?.message}>
              <Input
                id="lastName"
                autoComplete="family-name"
                {...register('lastName', { required: 'El apellido es obligatorio' })}
              />
            </Field>
            <Field label="DNI" htmlFor="dni" hint="Opcional, pero útil para identificarlo.">
              <Input id="dni" inputMode="numeric" {...register('dni')} />
            </Field>
            <Field label="Fecha de nacimiento" htmlFor="birthDate">
              <Input id="birthDate" type="date" {...register('birthDate')} />
            </Field>
            <Field label="Estado" htmlFor="status">
              <Select id="status" {...register('status')}>
                {MEMBER_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {MEMBER_STATUS_LABELS[status]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field
              label="Email"
              htmlFor="email"
              error={errors.email?.message}
            >
              <Input
                id="email"
                type="email"
                autoComplete="email"
                {...register('email', {
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Ingresá un email válido',
                  },
                })}
              />
            </Field>
            <Field label="Teléfono" htmlFor="phone">
              <Input id="phone" type="tel" autoComplete="tel" {...register('phone')} />
            </Field>
            <Field label="Dirección" htmlFor="address">
              <Input id="address" autoComplete="street-address" {...register('address')} />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contacto de emergencia</CardTitle>
            <CardDescription>Persona a contactar ante una urgencia.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre y vínculo" htmlFor="emergencyName">
              <Input id="emergencyName" placeholder="Ej.: María (madre)" {...register('emergencyName')} />
            </Field>
            <Field label="Teléfono de emergencia" htmlFor="emergencyPhone">
              <Input id="emergencyPhone" type="tel" {...register('emergencyPhone')} />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <HeartPulse className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Salud y seguridad</CardTitle>
              <CardDescription>
                Esta información condiciona la generación automática de rutinas.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <Alert variant="warning" title="Datos sensibles">
              Registrá solo lo necesario para entrenar de forma segura. Si declarás dolor de pecho,
              mareos, embarazo, cirugía reciente o enfermedad cardíaca, el generador automático se
              bloquea y solicita evaluación médica.
            </Alert>

            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">Condiciones declaradas</p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {CONDITIONS.map((condition) => (
                  <label
                    key={condition}
                    className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-slate-200 p-3 text-sm transition hover:border-emerald-300 hover:bg-emerald-50/40"
                  >
                    <Checkbox
                      className="mt-0.5"
                      checked={conditions.includes(condition)}
                      onChange={(event) => toggleCondition(condition, event.target.checked)}
                    />
                    <span className="text-slate-700">{CONDITION_LABELS[condition]}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Lesiones o molestias" htmlFor="injuries">
                <Textarea
                  id="injuries"
                  className="min-h-20"
                  placeholder="Ej.: molestia en rodilla derecha al subir escaleras"
                  {...register('injuries')}
                />
              </Field>
              <Field label="Medicamentos relevantes" htmlFor="medications">
                <Textarea
                  id="medications"
                  className="min-h-20"
                  placeholder="Ej.: medicación para hipertensión"
                  {...register('medications')}
                />
              </Field>
            </div>

            <div className="space-y-3 rounded-xl border border-slate-200 p-4">
              <label className="flex cursor-pointer items-start gap-2.5 text-sm">
                <Checkbox className="mt-0.5" {...register('medicalClearance')} />
                <span>
                  <span className="font-medium text-slate-800">Apto médico vigente</span>
                  <span className="block text-xs text-slate-500">
                    El socio presentó autorización médica para realizar actividad física.
                  </span>
                </span>
              </label>

              {medicalClearance && (
                <Field
                  label="Vencimiento del apto médico"
                  htmlFor="medicalClearanceExpiresOn"
                  className="sm:max-w-xs"
                >
                  <Input
                    id="medicalClearanceExpiresOn"
                    type="date"
                    {...register('medicalClearanceExpiresOn')}
                  />
                </Field>
              )}

              <label className="flex cursor-pointer items-start gap-2.5 text-sm">
                <Checkbox className="mt-0.5" {...register('consentSigned')} />
                <span>
                  <span className="font-medium text-slate-800">Consentimiento informado firmado</span>
                  <span className="block text-xs text-slate-500">
                    El socio autoriza el registro de sus datos y la programación del entrenamiento.
                  </span>
                </span>
              </label>
            </div>

            <Field label="Notas de salud" htmlFor="healthNotes">
              <Textarea
                id="healthNotes"
                placeholder="Observaciones para tener en cuenta al entrenar…"
                {...register('healthNotes')}
              />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notas internas</CardTitle>
            <CardDescription>Información administrativa visible solo en el panel.</CardDescription>
          </CardHeader>
          <CardContent>
            <Field label="Notas" htmlFor="notes">
              <Textarea
                id="notes"
                placeholder="Ej.: prefiere entrenar por la mañana, pagó por transferencia…"
                {...register('notes')}
              />
            </Field>
          </CardContent>
        </Card>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <ShieldAlert className="h-4 w-4" />
            Los campos marcados con * son obligatorios.
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <LinkButton
              to={isEdit && id ? `/socios/${id}` : '/socios'}
              variant="outline"
              className="w-full sm:w-auto"
            >
              Cancelar
            </LinkButton>
            <Button type="submit" disabled={mutation.isPending} className="w-full sm:w-auto">
              <Save className="h-4 w-4" />
              {mutation.isPending
                ? 'Guardando…'
                : isEdit
                  ? 'Guardar cambios'
                  : 'Crear socio'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
