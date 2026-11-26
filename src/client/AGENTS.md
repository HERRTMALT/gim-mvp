# Contexto del cliente

- Stack: React 19 + Vite 8 + Tailwind 4 + React Router 7, TanStack Query (`staleTime` 20 s con retry), `react-hook-form`, `sonner` y `lucide-react`.
- `src/client/lib/api.ts` usa `fetch('/api/...', { credentials: 'same-origin' })`. En desarrollo Vite redirige `/api` a `:3000`, por eso el navegador solo habla con `:5173` y no hay CORS.
- Errores de API con forma `{ error: { code, message, details } }`. Un 401 dispara el evento `auth:unauthorized`, limpia la caché de TanStack Query y redirige a `/login` (`AuthProvider` con estados `loading | authenticated | unauthenticated`).
- Rutas protegidas y providers en `App.tsx`. No expongas páginas del panel sin pasar por la protección de sesión.
- Reutilizá `RoutinePlanView.tsx`: es la misma vista para preview y para la rutina guardada. El asistente (`RoutineWizardPage.tsx`) precarga datos de salud y deshabilita "Generar" ante señales de alarma o sin equipamiento.
- Búsqueda de socios: debounce de 300 ms (`useDebounced`), `keepPreviousData` y límite de 300 filas impuesto por el servidor. No dupliques paginación en el cliente.
- Estilos: Tailwind 4 con `@import "tailwindcss"` en `index.css`; componé clases con `cn()` (`lib/utils.ts`, clsx + tailwind-merge). No edites `public/`: es salida del build de Vite.
- Verificá con `npm run typecheck` y `npm test` antes de terminar.
