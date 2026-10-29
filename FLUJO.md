# Guía del Flujo de Trabajo con Ramas en Git

Esta guía explica la manera recomendada para trabajar con ramas en Git, cubriendo tanto el flujo ideal como las soluciones cuando ya comenzaste a hacer cambios antes de crear la rama.

---

## 1. Flujo Recomendado (Crear la rama ANTES de hacer cambios)

Esta es la buena práctica estándar para mantener un historial limpio y ordenado.

### Paso 1: Actualizar la rama principal
Antes de empezar a trabajar, asegurate de tener la última versión del proyecto.
```bash
git checkout main
git pull origin main
```

### Paso 2: Crear y cambiar a la nueva rama
Crea la rama partiendo de `main` y te posiciona directamente en ella.
```bash
# Método tradicional:
git checkout -b feature/nombre-de-tu-rama

# O usando la sintaxis moderna de Git:
git switch -c feature/nombre-de-tu-rama
```

### Paso 3: Realizar modificaciones
Edita y trabaja en tus archivos de manera habitual.

### Paso 4: Guardar los cambios (Commit)
Agrega tus modificaciones al área de preparación y confirma los cambios.
```bash
git add .
git commit -m "feat: descripción clara del trabajo realizado"
```

### Paso 5: Publicar la rama en el repositorio remoto
Sube la rama al servidor remoto (GitHub, GitLab, Bitbucket, etc.).
```bash
git push -u origin feature/nombre-de-tu-rama
```
> **Nota:** El parámetro `-u` (o `--set-upstream`) vincula la rama local con la remota. Para futuros envíos dentro de esta misma rama, solo necesitarás ejecutar `git push`.

---

## 3. ¿Cómo finalizar e integrar tu trabajo?

Una vez completadas tus tareas y publicados los cambios en la rama remota, tienes dos alternativas para integrar el código:

###  A través de un Pull Request (PR) (Recomendado)
1. Ve a la plataforma web de tu proveedor (GitHub, GitLab, etc.).
2. Abre un **Pull Request** definiendo tu rama como *origen* (head) y `main` como *destino* (base).
3. Solicita revisión de código a tus compañeros de equipo.
4. Completa la integración (Merge) desde la interfaz web.

