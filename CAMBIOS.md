# Registro de cambios

Cada vez que se suben cambios al repositorio se agrega una entrada **arriba de
todo**, en el mismo commit que los cambios. La idea es que quien se sume al
proyecto pueda ver qué se hizo, por qué, y qué quedó pendiente, sin tener que
leer el historial de git.

Formato de cada entrada:

```
## AAAA-MM-DD — Título corto

**Autor:** nombre (y "con ayuda de <LLM>" si se usó una)

- Qué cambió y por qué, agrupado por parte (web, api, gateway, vision, db, docs).

**Acción requerida:** lo que alguien tiene que hacer a mano (variables de
entorno, migraciones, configuración en Render/Netlify/Supabase). Omitir si no hay.
```

Nunca anotar secretos (tokens, claves, contenido de `.env` o `config.json`)
ni matrículas.

---

## 2026-10-29 — Guía del flujo de trabajo con ramas (FLUJO.md)

**Autor:** Lucio Facchin, con ayuda de Claude

- docs: se agregó `FLUJO.md`, una guía de cómo trabajar en el repositorio:
  crear una rama desde `main` actualizada, anotar el cambio en `CAMBIOS.md`,
  commitear, publicar la rama con `git push -u` y abrir el Pull Request. Hace
  falta porque `AGENTS.md` ahora exige trabajar siempre fuera de `main` y que
  otra persona revise el PR.
- docs: la guía cubre también qué hacer si se empezó a trabajar en `main` por
  error (cambios sin commitear, commits sin push, o push ya hecho) y dos formas
  de abrir el PR (web de GitHub o `gh pr create`). Aclara que el merge lo hace
  quien revisa, no quien abre el PR.
- docs: esta entrada reemplaza una anterior sobre `FLUJO.md` que había quedado
  al final del archivo y sin autor.

## 2026-10-28 — Repositorio cerrado a terceros y limpieza de código

**Autor:** Lucio Facchin, con ayuda de Claude

El repositorio tenía partes pensadas para que cualquier interesado pudiera
probar el sistema. El proyecto es privado, así que se eliminaron, junto con el
código que no se usa en la etapa actual.

**Eliminado**
- web: modo demo (`MODO`, `web/datos/plazas-demo.json`) y las "referencias" del
  plano, que solo existían en ese modo.
- Guías y plantillas de puesta en marcha: sección "Probarlo" del README, §11 de
  `docs/DISENO.md` (se renumeraron las siguientes), `vision/README.md`,
  `firmware/README.md`, `api/.env.example`, `gateway/.env.example`,
  `vision/config.example.json`, `db/datos_prueba.sql` y
  `scripts/iniciar-local.sh`.
- gateway: `scripts/prueba-sin-arduino.js` y `scripts/listar-puertos.js`.
- vision: modos `image`, `camera` y `hash` (solo queda `service`), `DEBUG_DIR`,
  soporte de chapas españolas (`ALLOW_SPAIN_PLATES`) e imágenes de prueba.
- api: endpoints sin uso — `GET /api/plazas/:id`, `GET /api/eventos`,
  `GET /api/lecturas`, el filtro `?revisada` de alertas y el cambio de
  `autorizacion` por `PATCH /api/plazas/:id`.

**Seguridad**
- api: `adminAuth` ya no acepta cualquier sesión válida de Supabase; exige que
  el correo esté en `ADMIN_EMAILS`. Sin la variable, todo endpoint de
  administración responde 403. Afecta también a la reserva desde el plano.

**Optimizaciones**
- web: el plano y el panel cargan todas las plazas en un solo pedido, en
  paralelo con los niveles (antes, un pedido por piso).
- api: `GET /api/niveles` ya no relee la tabla de plazas para contar libres.
- web: el panel recarga las alertas solo cuando una plaza pasa a
  `no_autorizado`, no en cada cambio.
- vision: el detector libera las imágenes intermedias de cada cuadro y la
  expresión regular del escudo se compila una sola vez.

**Acción requerida**
- Cargar `ADMIN_EMAILS=operador@conectalab.uy` en las variables de entorno de
  la API en Render **antes** de desplegar este cambio.
- Los archivos borrados siguen en el historial de git: para que el repositorio
  sea privado de verdad hay que pasarlo a privado en GitHub.
- Conviene desactivar el registro público de cuentas en Supabase
  (Authentication → Sign In / Providers).
