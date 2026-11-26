---
name: Motor de rutinas
description: Reglas del generador determinístico de rutinas y del versionado inmutable; usar al tocar engine.ts, exercises.ts o el ciclo de vida de rutinas
---

# Motor de rutinas

Archivos: `src/server/domain/routines/engine.ts`, `exercises.ts` (59 ejercicios), `src/server/modules/routines/*`, `RoutineWizardPage.tsx`, `RoutinePlanView.tsx`, `infra/pdf/RoutineDocument.tsx`.

## Seguridad primero

Si hay `chest_pain`, `dizziness`, `heart_condition`, `recent_surgery` o `pregnancy`, se lanza `RoutineSafetyError` → HTTP 422 `ROUTINE_SAFETY`. **No se genera nada**. Nunca relajes estas señales de alarma.

## Determinismo

- Misma entrada + misma semilla = mismo plan; hay un test que lo verifica.
- Sin `seed`, se elige una aleatoria. Con `seed`, se usa `mulberry32(seed + índiceDelDía * 1000)` para barajar y elegir ejercicios.
- Resultado: `{ plan, warnings, rulesVersion: '1.0.0', seed }`.

## Reglas de generación

1. Split: 3 días = cuerpo completo ×3; 4 = superior/inferior alternados; 5 = empuje, tracción, piernas, superior, inferior.
2. Filtros (`isAvailable()`): todo el equipamiento del ejercicio debe estar disponible (siempre se cuenta `bodyweight`), dificultad ≤ nivel y sin tags contraindicados por las condiciones declaradas (p. ej., dolor de rodilla bloquea `knee_flexion` e `impact`).
3. Si un patrón no tiene candidato, se prueban `FALLBACK_PATTERNS` y se registra una advertencia; no se inventa un ejercicio.
4. Prescripción: fuerza 4×3-6/150 s; hipertrofia 4×6-10/120 s; grasa 3×10-15/60 s; resistencia 3×12-20/45 s; salud general 3×8-12/90 s. Se ajusta por nivel, accesoario y temporada de fútbol (una serie menos en piernas si `in_season`).
5. Extras: calentamiento y vuelta a la calma; 2 accesorios preventivos para fútbol; acondicionamiento en los primeros dos días para grasa/resistencia.
6. Advertencias: falta de apto médico, condiciones, solo peso corporal, 5 días con sesiones de 45 min, edad ≥ 65, hipertensión, temporada de fútbol, reemplazos y huecos sin ejercicio compatible. Siempre incluir el `disclaimer` médico.

## Ciclo de vida (inmutable)

| Acción | Endpoint | Efecto |
| --- | --- | --- |
| Previsualizar | `POST /api/members/:id/routines/preview` | Genera sin guardar. |
| Guardar | `POST /api/members/:id/routines` | `source: 'auto'`, versión nueva. |
| Ver | `GET /api/routines/:id` | Devuelve la versión guardada. |
| Editar | `PATCH /api/routines/:id` | Nueva versión `source: 'manual'`, `seed: 0` y advertencia extra. |
| Regenerar | `POST /api/routines/:id/regenerate` | Nueva versión con `seed + 1`, mismos inputs. |

Nunca hagas `UPDATE` sobre una rutina: siempre `INSERT` con `version = MAX(version) + 1` (`UNIQUE(member_id, version)`). Los datos de salud jamás se loguean.

## Verificación

`npm run typecheck` y `npm test`; los tests cubren determinismo, contraindicaciones y advertencias. Si cambiás el esquema, además `npm run build` y confirmar el SQL generado.
