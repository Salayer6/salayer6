<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1ab6gGoQwrWrGDIL3KaMqWXo0GQHISPyQ

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

Documentación: Despliegue de Study Hub en GitHub Pages
1. Introducción
Esta guía detalla los pasos necesarios para instalar, configurar y desplegar la aplicación Study Hub en GitHub Pages. GitHub Pages es un servicio de alojamiento gratuito que permite publicar un sitio web directamente desde un repositorio de GitHub.
2. Prerrequisitos
Antes de comenzar, asegúrate de tener instalado el siguiente software en tu computadora:
Node.js y npm: Node.js es el entorno que permite ejecutar JavaScript. npm es el gestor de paquetes que viene incluido y se usa para instalar las dependencias del proyecto. Puedes descargarlos desde nodejs.org.
Git: Es el sistema de control de versiones necesario para interactuar con tu repositorio de GitHub. Puedes descargarlo desde git-scm.com.
Un repositorio en GitHub: Tu proyecto debe estar alojado en un repositorio de GitHub.
3. Configuración Local
Si es la primera vez que configuras el proyecto, sigue estos pasos para ejecutarlo en tu máquina.
Paso 1: Clonar el Repositorio
Clona tu repositorio de GitHub a tu computadora.
Paso 2: Instalar Dependencias
Abre una consola o terminal en la carpeta raíz de tu proyecto y ejecuta el siguiente comando. Esto descargará todas las librerías necesarias (React, Tailwind, etc.) en una carpeta node_modules.
code
Bash
npm install
Paso 3: Configurar la Clave de API de Gemini
El asistente de chat requiere una clave de API de Google Gemini para funcionar.
Abre el archivo src/config.ts.
Pega tu clave de API dentro de las comillas de la variable DEVELOPER_API_KEY.
code
TypeScript
// src/config.ts
export const DEVELOPER_API_KEY = 'AQUI_VA_TU_CLAVE_DE_API';
Nota Importante: Aunque esta clave funcionará para el desarrollo, no es recomendable subirla a un repositorio público. La aplicación está diseñada para que cada usuario pueda introducir su propia clave a través del menú de configuración, que se guarda de forma segura en su navegador.
Paso 4: Ejecutar en Modo Desarrollo
Para ver la aplicación localmente, ejecuta:
code
Bash
npm run dev
Abre la URL que aparece en la consola (generalmente http://localhost:5173) en tu navegador.
4. Proceso de Despliegue en GitHub Pages
Una vez que la aplicación funciona localmente, sigue estos pasos para publicarla en la web.
Paso 1: Configurar la Ruta Base en Vite
Este es el paso más importante para que el despliegue funcione correctamente. GitHub Pages publica tu sitio en una subcarpeta con el nombre de tu repositorio. Debes indicarle a Vite esta ruta.
Abre el archivo vite.config.ts.
Localiza la línea base: '/your-repo-name/'.
Reemplaza 'your-repo-name' con el nombre exacto de tu repositorio de GitHub.
Por ejemplo, si la URL de tu repositorio es https://github.com/tu-usuario/study-hub-app, el archivo debe quedar así:
code
TypeScript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // ¡Configuración CRÍTICA para GitHub Pages!
  base: '/study-hub-app/',
})
Paso 2: Ejecutar el Script de Despliegue
El proyecto ya está configurado con una herramienta llamada gh-pages que automatiza el proceso. Simplemente ejecuta el siguiente comando en tu terminal:
code
Bash
npm run deploy
Este comando realiza dos acciones automáticamente:
npm run predeploy: Se ejecuta primero, compilando tu aplicación para producción. Crea una carpeta dist con todos los archivos optimizados (HTML, CSS, JS).
npm run deploy: Toma el contenido de la carpeta dist y lo sube a una rama especial en tu repositorio de GitHub llamada gh-pages. Esta es la rama que GitHub Pages usará para servir tu sitio.
Paso 3: Configurar el Repositorio de GitHub
La primera vez que despliegues, o si nunca has usado GitHub Pages en este repositorio, debes activarlo.
Ve a tu repositorio en el sitio web de GitHub.
Haz clic en la pestaña "Settings" (Configuración).
En el menú de la izquierda, selecciona "Pages".
En la sección "Build and deployment", bajo "Source", selecciona "Deploy from a branch".
Asegúrate de que la configuración de la rama ("Branch") sea la siguiente:
Branch: gh-pages
Folder: / (root)
Haz clic en "Save".
![alt text](https://docs.github.com/assets/cb-132715/images/help/pages/deploy-from-branch-gh-pages-folder-root.png)
Paso 4: ¡Listo!
GitHub tardará uno o dos minutos en procesar los archivos y publicar tu sitio. Una vez que esté listo, verás un mensaje en la parte superior de la sección de "Pages" con la URL pública de tu aplicación.
La URL tendrá el formato: https://<tu-nombre-de-usuario>.github.io/<el-nombre-de-tu-repositorio>/
