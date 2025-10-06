# Documentación: Despliegue de Study Hub en GitHub Pages

## 1. Introducción

Esta guía detalla los pasos necesarios para instalar, configurar y desplegar la aplicación **Study Hub** en GitHub Pages. GitHub Pages es un servicio de alojamiento gratuito que permite publicar un sitio web directamente desde un repositorio de GitHub.

## 2. Prerrequisitos

Antes de comenzar, asegúrate de tener instalado el siguiente software en tu computadora:

*   **Node.js y npm:** Node.js es el entorno que permite ejecutar JavaScript. npm es el gestor de paquetes que viene incluido y se usa para instalar las dependencias del proyecto. Puedes descargarlos desde [nodejs.org](https://nodejs.org/).
*   **Git:** Es el sistema de control de versiones necesario para interactuar con tu repositorio de GitHub. Puedes descargarlo desde [git-scm.com](https://git-scm.com/).
*   **Un repositorio en GitHub:** Tu proyecto debe estar alojado en un repositorio de GitHub.

## 3. Configuración Local

Si es la primera vez que configuras el proyecto, sigue estos pasos para ejecutarlo en tu máquina.

### Paso 1: Clonar el Repositorio

Clona tu repositorio de GitHub a tu computadora.

### Paso 2: Instalar Dependencias

Abre una consola o terminal en la carpeta raíz de tu proyecto y ejecuta el siguiente comando. Esto descargará todas las librerías necesarias (React, Tailwind, etc.) en una carpeta `node_modules`.

```bash
npm install
```

### Paso 3: Configurar la Clave de API de Gemini

El asistente de chat requiere una clave de API de Google Gemini para funcionar.

1.  Abre el archivo `src/config.ts`.
2.  Pega tu clave de API dentro de las comillas de la variable `DEVELOPER_API_KEY`.

    ```typescript
    // src/config.ts
    export const DEVELOPER_API_KEY = 'AQUI_VA_TU_CLAVE_DE_API';
    ```

    **Nota Importante:** Aunque esta clave funcionará para el desarrollo, **no es recomendable subirla a un repositorio público**. La aplicación está diseñada para que cada usuario pueda introducir su propia clave a través del menú de configuración, que se guarda de forma segura en su navegador.

### Paso 4: Ejecutar en Modo Desarrollo

Para ver la aplicación localmente, ejecuta:

```bash
npm run dev
```

Abre la URL que aparece en la consola (generalmente `http://localhost:5173`) en tu navegador.

## 4. Proceso de Despliegue en GitHub Pages

Una vez que la aplicación funciona localmente, sigue estos pasos para publicarla en la web.

### Paso 1: Configurar la Ruta Base en Vite

Este es el paso **más importante** para que el despliegue funcione correctamente. GitHub Pages publica tu sitio en una subcarpeta con el nombre de tu repositorio. Debes indicarle a Vite esta ruta.

1.  Abre el archivo `vite.config.ts`.
2.  Localiza la línea `base: '/your-repo-name/'`.
3.  **Reemplaza `'your-repo-name'` con el nombre exacto de tu repositorio de GitHub.**

    Por ejemplo, si la URL de tu repositorio es `https://github.com/tu-usuario/study-hub-app`, el archivo debe quedar así:

    ```typescript
    // vite.config.ts
    import { defineConfig } from 'vite'
    import react from '@vitejs/plugin-react'

    export default defineConfig({
      plugins: [react()],
      // ¡Configuración CRÍTICA para GitHub Pages!
      base: '/study-hub-app/',
    })
    ```

### Paso 2: Ejecutar el Script de Despliegue

El proyecto ya está configurado con una herramienta llamada `gh-pages` que automatiza el proceso. Simplemente ejecuta el siguiente comando en tu terminal:

```bash
npm run deploy
```

Este comando realiza dos acciones automáticamente:

1.  **`npm run predeploy`**: Se ejecuta primero, compilando tu aplicación para producción. Crea una carpeta `dist` con todos los archivos optimizados (HTML, CSS, JS).
2.  **`npm run deploy`**: Toma el contenido de la carpeta `dist` y lo sube a una rama especial en tu repositorio de GitHub llamada `gh-pages`. Esta es la rama que GitHub Pages usará para servir tu sitio.

### Paso 3: Configurar el Repositorio de GitHub

La primera vez que despliegues, o si nunca has usado GitHub Pages en este repositorio, debes activarlo.

1.  Ve a tu repositorio en el sitio web de GitHub.
2.  Haz clic en la pestaña **"Settings"** (Configuración).
3.  En el menú de la izquierda, selecciona **"Pages"**.
4.  En la sección "Build and deployment", bajo "Source", selecciona **"Deploy from a branch"**.
5.  Asegúrate de que la configuración de la rama ("Branch") sea la siguiente:
    *   **Branch**: `gh-pages`
    *   **Folder**: `/ (root)`
6.  Haz clic en **"Save"**.

![Configuración de GitHub Pages](https://docs.github.com/assets/cb-132715/images/help/pages/deploy-from-branch-gh-pages-folder-root.png)

### Paso 4: ¡Listo!

GitHub tardará uno o dos minutos en procesar los archivos y publicar tu sitio. Una vez que esté listo, verás un mensaje en la parte superior de la sección de "Pages" con la URL pública de tu aplicación.

La URL tendrá el formato: `https://<tu-nombre-de-usuario>.github.io/<el-nombre-de-tu-repositorio>/`.
