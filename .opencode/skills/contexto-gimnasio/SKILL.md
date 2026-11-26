---
name: Contexto gimnasio
description: Mapa de la documentación de gimnasio-mvp; usar antes de explorar o decidir si una tarea corresponde al MVP actual o a la migración futura
---

# Contexto gimnasio

## Objetivo

Elegir la documentación correcta y evitar que el MVP y el producto final se mezclen en la misma respuesta o en el mismo cambio de código.

## Regla de decisión

1. Si el pedido menciona cuentas de socio, roles, portal del socio, eventos, PostgreSQL, Drizzle, NGINX/VPS o backups cifrados, es **migración futura**: hoy no existe en el repo. Avisalo y cargá la skill `migracion-producto-final`.
2. Si habla de login con contraseña única, socios, cuotas, rutinas o PDF, es **MVP actual**: seguí `docs/GUIA_DE_OPERACION_Y_ARQUITECTURA.md`.
3. Si el alcance es ambiguo, preguntá antes de escribir código.

## Cómo leer los documentos

Abrí `references/mapa-documentacion.md` y leé solo las secciones indicadas para la tarea. No cargues los dos documentos completos de una vez: suman ~1500 líneas y la mayoría no aplica.

## Salida esperada

Al empezar, decí en una línea qué documento usás y si el trabajo es **MVP** o **migración**.
