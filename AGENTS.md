# Instrucciones para asistentes de IA

Este archivo es para cualquier LLM o agente que trabaje sobre el repositorio
(Claude, ChatGPT/Codex, Copilot, Cursor, etc.). Leelo entero antes de cambiar
algo.

## Registro de cambios: obligatorio

**Todo commit que cambie código, configuración o documentación tiene que
agregar una entrada en [`CAMBIOS.md`](CAMBIOS.md), en ese mismo commit.**

1. Antes de commitear, leé `CAMBIOS.md` para respetar el formato.
2. Agregá la entrada nueva **arriba de todo**, debajo de la línea `---` que
   cierra la explicación del formato. No edites ni borres entradas viejas.
3. Usá la fecha del día (`AAAA-MM-DD`), un título corto y el autor: la persona
   que te pidió el cambio, "con ayuda de <nombre del modelo>".
4. Explicá **qué** cambió y **por qué**, agrupado por parte (web, api, gateway,
   vision, db, docs). Que lo entienda alguien que no vio la conversación.
5. Si alguien tiene que hacer algo a mano —una variable de entorno nueva, una
   migración SQL, un cambio en Render, Netlify o Supabase— ponelo en
   **Acción requerida**.
6. Nunca escribas secretos (tokens, claves, contenido de `.env` o
   `config.json`) ni matrículas en el registro.

Si un cambio no pasa por un commit (por ejemplo, solo se editó un `.env`
local), no va en el registro.

## Reglas del proyecto

- **El proyecto es privado.** No agregues modos demo, datos de prueba, guías de
  instalación, archivos `.example` ni scripts para que terceros levanten el
  sistema. Se eliminaron a propósito (ver `CAMBIOS.md`, 2026-10-28).
- **Secretos fuera del repo:** `api/.env`, `gateway/.env` y
  `vision/config.json` están en `.gitignore`. No los commitees ni copies su
  contenido a otros archivos.
- **Administradores:** la API solo deja pasar a los correos de `ADMIN_EMAILS`.
  No relajes `api/src/middleware/adminAuth.js`.
- **Privacidad:** la matrícula nunca se guarda ni se loguea en texto plano; de
  la máquina del parking sale solo su HMAC. Las imágenes no se guardan.
- **Diseño:** las decisiones están en [`docs/DISENO.md`](docs/DISENO.md). Los
  comentarios del código lo citan por número de sección («README 7.5»).
- **Estilo:** todo en español —código, comentarios, commits—. Imitá el código
  de alrededor: nombres en español, comentarios que explican el *porqué*.
- **Tests:** si tocás `vision/`, corré `mvn clean package` (compila y corre
  los tests) antes de commitear.
- No hagas `push` ni cambies configuración de servicios externos sin que la
  persona lo pida.
