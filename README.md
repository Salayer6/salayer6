# Gems Agent: Study Hub

Un agente de IA especializado en asistir y potenciar el proceso de estudio.

## Sobre el Proyecto

**Study Hub** es una herramienta de código abierto diseñada para servir como un asistente de estudio interactivo. Combina un agente de chat impulsado por IA con un tablero de notas visual, permitiendo a los usuarios explorar temas complejos, desglosar ideas y organizar su conocimiento de manera gráfica.

Este proyecto nace con la vocación de ser una pieza fundamental para integrar en ambientes educativos donde el uso de la inteligencia artificial para la educación es aún incipiente. Su naturaleza abierta facilita su adaptación y despliegue en diversas plataformas de aprendizaje, democratizando el acceso a herramientas de estudio avanzadas.

## Motivación e Inspiración

El desarrollo de **Study Hub** fue motivado por mi cursación del diplomado **"Estrategias metodológicas y evaluativas en la Formación para el trabajo"** (Universidad de Chile, 2025). Las metodologías y enfoques pedagógicos explorados durante el programa inspiraron la creación de una herramienta que no solo entrega información, sino que fomenta la organización y conexión de ideas, un pilar clave en el aprendizaje significativo.

---

### Sobre el Diplomado de Referencia

> **Impulsa la calidad de la capacitación en Chile con estrategias para transformar el aprendizaje.**
>
> El Diplomado en Estrategias Metodológicas y Evaluativas para la Formación Laboral, impartido en modalidad e-learning asincrónica, representa un esfuerzo colaborativo entre el Servicio Nacional de Capacitación y Empleo (SENCE), el OTIC de la Cámara Chilena de la Construcción y la Universidad de Chile, a través de su Facultad de Ciencias Físicas y Matemáticas —mediante la Subdirección de Educación Continua— y el proyecto MEDICHI de la Facultad de Medicina. Esta alianza impulsa un modelo de formación de formadores orientado a fortalecer las competencias técnicas, metodológicas y actitudinales de quienes desempeñan un rol protagónico en la calidad de los procesos de capacitación, eje estratégico del SENCE.
>
> **Consultas**
>
> Escuela de Postgrado y Educación Continua
>
> Contacto: Alejandra Muñoz
> Correo: amunoz@econtinuafcfm.cl


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