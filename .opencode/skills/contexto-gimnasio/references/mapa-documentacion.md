# Mapa de documentación

Rutas relativas a la raíz del repo. Leé solo las secciones necesarias.

## `docs/GUIA_DE_OPERACION_Y_ARQUITECTURA.md` — estado real (MVP)

| Necesitás… | Secciones |
| --- | --- |
| Qué incluye y qué no incluye el MVP | 1 |
| Mapa de archivos y por qué está separado así | 2 |
| Ciclo de una petición, middlewares y arranque | 3 |
| Tablas, invariantes y zonas horarias | 4 |
| Login, panel, socios, salud, planes/cuotas, generador, PDF | 5.1–5.7 |
| Endpoints y códigos de error | 6 |
| Seguridad implementada y limitación de un solo rol | 7 |
| Dependencias y para qué sirve cada una | 8 |
| Variables de entorno actuales | 9 |
| Scripts de npm | 10 |
| Dev, build local, Docker, Vercel, tests | 11.1–11.5 |
| Cómo detener cada entorno | 12 |
| Backups, cambios de contraseña y problemas frecuentes | 13 |

## `docs/DOCUMENTACION_TECNICA.md` — diseño objetivo (no implementado)

| Necesitás… | Secciones |
| --- | --- |
| Resumen del negocio y decisión arquitectónica | 1 |
| Estado actual de ambos proyectos | 2–3 |
| Brechas entre MVP y requerimientos | 5 |
| Capas, despliegue y modelo de datos objetivo | 6.1–6.3 |
| Flujos de auth e inscripción, máquina de estados de eventos | 6.4–6.6 |
| Cambios por módulo (auth, portal, events, datos, borde) | 7.1–7.5 |
| Dependencias nueva/eliminadas y justificación de infra | 8 |
| Patrones de diseño | 9 |
| ETL, cutover, retención y rollback | 10 |
| Seguridad objetivo y backups | 11–12 |
| Fuera de alcance y variables objetivo | 14–15 |

## Regla de oro

La guía de operación describe **lo que corre hoy**. La documentación técnica describe **lo que se planea**. Ante un conflicto, gana la guía de operación salvo que el usuario pida explícitamente trabajar en la migración.
