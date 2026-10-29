# Guía del flujo de trabajo con ramas en Git

Esta guía explica cómo trabajar con ramas en este repositorio: el flujo ideal,
qué hacer si ya empezaste a hacer cambios antes de crear la rama, y cómo
integrar tu trabajo con un Pull Request. Las reglas de fondo están en
[`AGENTS.md`](AGENTS.md): nunca se trabaja directo en `main`, todo commit
agrega su entrada en [`CAMBIOS.md`](CAMBIOS.md) y el PR lo revisa otra persona
del equipo.

---

## 1. Flujo recomendado (crear la rama ANTES de hacer cambios)

### Paso 1: Actualizar la rama principal
Antes de empezar, asegurate de tener la última versión del proyecto.
```bash
git switch main
git pull origin main
```

### Paso 2: Crear la rama nueva y pasarte a ella
La rama sale de `main` y quedás posicionado en ella.
```bash
git switch -c nombre-de-tu-rama

# Equivalente con la sintaxis vieja:
git checkout -b nombre-de-tu-rama
```
Usá un nombre corto que diga qué vas a hacer, por ejemplo `docu-flujo` o
`arreglo-login`.

### Paso 3: Hacer las modificaciones
Editá y trabajá en tus archivos de manera habitual.

### Paso 4: Anotar el cambio en `CAMBIOS.md`
Agregá una entrada **arriba de todo**, debajo de la línea `---` que cierra la
explicación del formato, con la fecha, un título corto, el autor y qué cambió y
por qué. Va en el **mismo commit** que los cambios, no en uno aparte. Nunca
escribas secretos ni matrículas.

### Paso 5: Guardar los cambios (commit)
Revisá qué se va a commitear, agregalo y confirmá.
```bash
git status
git add .
git commit -m "Descripción clara del trabajo realizado"
```
Los mensajes de commit van en español, con prefijos si se prefiere como `feat:`.

### Paso 6: Publicar la rama en GitHub
```bash
git push -u origin nombre-de-tu-rama
```
> **Nota:** el `-u` (o `--set-upstream`) vincula la rama local con la remota.
> Solo hace falta la primera vez; después alcanza con `git push`. Si hacés
> `git push` sin `-u` en una rama nueva, Git falla con
> `fatal: The current branch ... has no upstream branch`.
>
> Para no tener que acordarte del `-u`, podés configurarlo una sola vez:
> `git config --global push.autoSetupRemote true`

---

## 2. Si ya empezaste a hacer cambios en `main`

Pasa seguido: arrancaste a trabajar y te diste cuenta de que estabas en `main`.
La solución depende de hasta dónde llegaste.

### Caso A: hiciste cambios pero todavía no commiteaste
Los cambios sin commitear viajan con vos al cambiar de rama, así que alcanza
con crear la rama ahora:
```bash
git switch -c nombre-de-tu-rama
```
Después seguí desde el Paso 4 del flujo recomendado. `main` queda intacta.

Si además querés que la rama salga del `main` actualizado, guardá los cambios
aparte antes de actualizar:
```bash
git stash
git pull origin main
git switch -c nombre-de-tu-rama
git stash pop
```
Si `git stash pop` muestra conflictos, resolvelos en los archivos marcados y
después hacé `git add` de esos archivos.

### Caso B: ya commiteaste en `main`, pero NO hiciste push
Creá la rama donde estás parado (se lleva tus commits) y después devolvé `main`
a como está en GitHub:
```bash
git branch nombre-de-tu-rama
git fetch origin
git reset --hard origin/main
git switch nombre-de-tu-rama
```
> **Ojo:** `git reset --hard` borra de `main` todo lo que no esté commiteado.
> Antes de correrlo, fijate con `git status` que no quede nada pendiente.
> Tus commits no se pierden: quedan en la rama nueva.

Después seguí desde el Paso 6.

### Caso C: ya hiciste push a `main`
No lo intentes deshacer por tu cuenta. Reescribir la historia de `main` en
GitHub le rompe el repositorio a quien ya haya bajado esos cambios. Avisale al
equipo y decidan juntos si se deja así o se revierte con `git revert`.

---

## 3. Cómo integrar tu trabajo: el Pull Request

Una vez publicada la rama, abrí un Pull Request (PR) contra `main` y dejalo
para que **otra persona del equipo** lo revise. Quien abre el PR no lo
integra. Hay dos formas de abrirlo:

### Opción A: desde la web de GitHub
1. Entrá al repositorio en GitHub. Después de un push suele aparecer un aviso
   con el botón **Compare & pull request**.
2. Elegí tu rama como *origen* (compare) y `main` como *destino* (base).
3. Escribí un título y una descripción: qué cambió y por qué.
4. Pedí revisión a un compañero.

### Opción B: desde la terminal con `gh`
Si tenés instalada la [CLI de GitHub](https://cli.github.com/) y hiciste
`gh auth login`:
```bash
gh pr create --base main --title "Título del cambio" --body "Qué cambió y por qué"
```
Sin `--title` ni `--body`, `gh` te los pregunta.

### Después de abrir el PR
- Si te piden correcciones, hacelas **en la misma rama** y hacé `git push`:
  el PR se actualiza solo.
- El merge lo hace quien revisa, desde GitHub.
- Una vez integrado, volvé a `main` y actualizala antes de empezar otra tarea:
  ```bash
  git switch main
  git pull origin main
  ```
