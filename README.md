# Portal de Comunidad para Creadores

## 🎯 Visión del Proyecto

Desarrollar una plataforma digital independiente que sirva como el "Cuartel General" para la audiencia de un canal de YouTube. El objetivo es centralizar recursos técnicos, fomentar la interacción entre usuarios y establecer un canal de comunicación directa que no dependa de algoritmos de terceros.

## 🎯 Objetivos Estratégicos

- **Valor Agregado:** Ofrecer recursos descargables y herramientas que complementen la experiencia de visualización en YouTube
- **Independencia:** Crear una base de datos de miembros propia (Newsletter) para asegurar el alcance de las comunicaciones
- **Organización:** Facilitar la búsqueda de soluciones técnicas específicas que suelen perderse en la sección de comentarios o en el feed de videos

## � Público Objetivo

- **Espectadores Técnicos:** Usuarios que buscan el "cómo se hizo" y necesitan copiar fragmentos de código o configuraciones
- **Aprendices:** Personas que siguen los tutoriales y requieren material de apoyo escrito
- **Comunidad Activa:** Seguidores que desean debatir temas, ayudar a otros y proponer ideas para futuro contenido

## 🚀 Alcance de Funcionalidades

### Zona Pública (Acceso Universal)

- **Catálogo de Videos Inteligente:** Un feed de los videos del canal organizado por temáticas y niveles, facilitando el descubrimiento de contenido antiguo
- **Biblioteca de Snippets:** Buscador de fragmentos de código, comandos de terminal y archivos de configuración mencionados en los videos
- **Blog de Soporte:** Artículos técnicos y guías paso a paso que expanden la información de los tutoriales en video
- **Foro de Consulta (Lectura):** Acceso libre a todas las discusiones y soluciones planteadas por la comunidad para maximizar el alcance en buscadores

### Zona de Miembros (Requiere Registro)

- **Participación en la Comunidad:** Permisos para publicar preguntas, responder a otros usuarios y participar en encuestas o debates dentro del foro
- **Suscripción a Newsletter:** Recepción automatizada de novedades, recursos exclusivos y avisos de nuevos videos directamente en el email
- **Laboratorio de Herramientas (The Lab):** Acceso a utilidades interactivas exclusivas (calculadoras, generadores de código o validadores) que resuelven problemas específicos
- **Feedback Directo:** Espacio para comentar en los posts del blog y dar retroalimentación sobre el contenido del canal

## 🎨 Requisitos de Experiencia de Usuario (UX)

- **Rendimiento:** Carga ultrarrápida de contenidos, especialmente en el buscador de snippets y el blog
- **Diseño Limpio:** Interfaz minimalista que priorice la lectura del código y la visualización de texto técnico
- **Fricción Mínima:** El proceso de registro debe ser simple y rápido (preferiblemente a través de cuentas sociales ya existentes)
- **Optimización Móvil:** Navegación fluida y adaptada para usuarios que consumen contenido o consultan dudas desde su smartphone

## 📊 Criterios de Éxito

- Crecimiento constante en el número de usuarios registrados mensualmente
- Reducción de preguntas repetitivas en los comentarios de YouTube gracias al buscador de snippets
- Aumento en la tasa de apertura de comunicaciones directas vía email

## 🛠️ Comandos de Desarrollo

Todos los comandos se ejecutan desde la raíz del proyecto:

| Comando | Acción |
| :--- | :--- |
| `bun install` | Instala las dependencias |
| `bun dev` | Inicia el servidor de desarrollo local en `localhost:4321` |
| `bun build` | Construye el sitio de producción en `./dist/` |
| `bun preview` | Previsualiza la construcción localmente, antes del despliegue |
| `bun astro ...` | Ejecuta comandos CLI como `astro add`, `astro check` |
| `bun astro -- --help` | Obtiene ayuda usando el Astro CLI |

### Comandos de Base de Datos

| Comando | Acción |
| :--- | :--- |
| `bun run db:generate` | Genera migraciones desde el esquema Drizzle |
| `bun run db:migrate` | Aplica migraciones a la base de datos |
| `bun run db:types` | Genera tipos TypeScript desde Supabase |
| `bun run db:reset` | Reinicia la base de datos local |
| `bun run db:start` | Inicia el servidor de base de datos local |

## 📚 Tecnologías

- **Astro:** Framework principal para el desarrollo del sitio
- **TypeScript:** Tipado estático para mayor robustez
- **Tailwind CSS:** Framework de CSS para estilos modernos
- **React:** Biblioteca para componentes interactivos
- **Supabase:** Plataforma de backend con PostgreSQL, autenticación y almacenamiento
- **Drizzle ORM:** ORM ligero y type-safe para operaciones de base de datos
- **PostgreSQL:** Base de datos relacional robusta y escalable

## � Documentación

Para obtener información detallada sobre la configuración y la implementación, consulta la carpeta `docs/`:

- **[Guía de Configuración de Base de Datos](docs/DATABASE_SETUP.md)** - Configuración completa con Supabase, Drizzle ORM y Stripe
- **[Resumen de Implementación](docs/IMPLEMENTATION_SUMMARY.md)** - Visión general de lo implementado
- **[Índice de Documentación](docs/README.md)** - Guía completa de la documentación

## �🚀 Empezando

### Prerrequisitos

1. **Crea un proyecto en Supabase:**
   - Ve a [supabase.com](https://supabase.com)
   - Crea un nuevo proyecto
   - Obtén tu `DATABASE_URL` desde Settings > Database > Connection String
   - Obtén tu `SUPABASE_URL` y `SUPABASE_ANON_KEY` desde Settings > API

2. **Configura las variables de entorno:**
   ```env
   # .env file
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   DATABASE_URL=postgresql://user:password@host:5432/dbname
   ```

### Instalación y Ejecución

1. Clona este repositorio
2. Ejecuta `bun install` para instalar las dependencias
3. Configura tus variables de entorno en el archivo `.env`
4. Ejecuta `bun dev` para iniciar el servidor de desarrollo
5. Abre `http://localhost:4321` en tu navegador

### Configuración de la Base de Datos

1. **Genera el esquema inicial:**
   ```bash
   bun run db:generate
   ```

2. **Aplica las migraciones:**
   ```bash
   bun run db:migrate
   ```

3. **Genera los tipos TypeScript:**
   ```bash
   bun run db:types
   ```
