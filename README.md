# 🌍 Mapa de Oportunidades con IA

> Aplicación web Full-Stack que permite publicar y descubrir oportunidades de negocio detectadas en ciudades de todo el mundo, usando Inteligencia Artificial como solución.

---

## 📌 ¿Qué es esta app?

Es una plataforma pública y colaborativa donde cualquier persona puede:

- **Publicar** una oportunidad de negocio detectada en su ciudad
- **Ver** todas las oportunidades publicadas por otros usuarios
- **Filtrar** por ciudad, país y categoría
- **Dar like** a las oportunidades que más le gustan

Todo se guarda en una base de datos en la nube (**Supabase**), lo que significa que los datos son compartidos entre todos los usuarios en tiempo real, sin necesidad de crear una cuenta.

---

## 🛠️ Tecnologías usadas

| Tecnología | Para qué se usa |
|---|---|
| **HTML** | Estructura de la página |
| **CSS** (Vanilla) | Diseño visual, animaciones, diseño responsivo |
| **JavaScript** (Vanilla) | Lógica de la app, llamadas a la API |
| **Supabase** | Base de datos en la nube (PostgreSQL) |
| **Google Fonts (Inter)** | Tipografía moderna |

> ⚠️ No se usa ningún framework ni librería externa. Todo está hecho con HTML, CSS y JavaScript puros.

---

## 📁 Estructura de archivos

```
mapa-oportunidades-ia/
│
├── index.html   → Estructura de la app (header, filtros, grid de tarjetas, modal)
├── style.css    → Estilos: dark mode, animaciones, diseño responsivo
├── app.js       → Lógica: conexión con Supabase, filtros, likes, publicar
└── README.md    → Este archivo
```

---

## 🗄️ Base de datos en Supabase

### ¿Qué es Supabase?

Supabase es una plataforma de base de datos en la nube basada en **PostgreSQL**. Ofrece una API REST automática que permite leer y escribir datos directamente desde el navegador, sin necesidad de crear un servidor propio.

### Tabla: `opportunities`

La app usa una sola tabla llamada `opportunities` con esta estructura:

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | Identificador único (generado automáticamente) |
| `name` | text | Nombre de la oportunidad |
| `city` | text | Ciudad donde se detectó |
| `country` | text | País |
| `problem` | text | Problema detectado en esa ciudad |
| `ai_solution` | text | Cómo la IA puede resolver ese problema |
| `category` | text | Categoría (Salud, Educación, Tecnología...) |
| `potential` | text | Potencial de mercado (Alto, Medio, Emergente) |
| `likes` | integer | Número de likes recibidos |
| `created_at` | timestamptz | Fecha de publicación (automática) |

### SQL para crear la tabla

```sql
CREATE TABLE IF NOT EXISTS opportunities (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  city text NOT NULL,
  country text NOT NULL,
  problem text NOT NULL,
  ai_solution text NOT NULL,
  category text NOT NULL,
  potential text NOT NULL,
  likes integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_public_select" ON opportunities FOR SELECT USING (true);
CREATE POLICY "allow_public_insert" ON opportunities FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_public_update" ON opportunities FOR UPDATE USING (true);
```

### ¿Qué son las políticas RLS?

RLS (Row Level Security) es el sistema de seguridad de Supabase. Las tres políticas que creamos permiten:

- `allow_public_select` → Cualquiera puede **leer** las oportunidades
- `allow_public_insert` → Cualquiera puede **publicar** una oportunidad
- `allow_public_update` → Cualquiera puede **actualizar** los likes

Esto hace que la app sea completamente **pública**, sin necesidad de login.

---

## ⚙️ Cómo funciona la conexión con Supabase

En lugar de usar la librería oficial de Supabase, la app se conecta directamente mediante **fetch nativo** de JavaScript a la API REST que Supabase genera automáticamente.

### Configuración (en `app.js`)

```javascript
const SUPABASE_URL = 'https://modvmfcrggclhmdxsyyy.supabase.co';
const SUPABASE_KEY = 'tu-anon-key-aqui';
```

- **SUPABASE_URL**: La URL del proyecto en Supabase
- **SUPABASE_KEY**: La clave pública `anon` que permite acceso de lectura/escritura

### Las 3 operaciones principales

#### 1. Leer oportunidades (GET)
```javascript
const res = await fetch(`${SUPABASE_URL}/rest/v1/opportunities?select=*&order=created_at.desc`, {
  headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
});
const data = await res.json();
```

#### 2. Publicar una oportunidad (POST)
```javascript
const res = await fetch(`${SUPABASE_URL}/rest/v1/opportunities`, {
  method: 'POST',
  headers: { 'apikey': SUPABASE_KEY, 'Content-Type': 'application/json' },
  body: JSON.stringify({ name, city, country, problem, ai_solution, category, potential, likes: 0 })
});
```

#### 3. Actualizar likes (PATCH)
```javascript
const res = await fetch(`${SUPABASE_URL}/rest/v1/opportunities?id=eq.${id}`, {
  method: 'PATCH',
  headers: { 'apikey': SUPABASE_KEY, 'Content-Type': 'application/json' },
  body: JSON.stringify({ likes: nuevosLikes })
});
```

---

## 🚀 Cómo ejecutar el proyecto en local

### Requisitos
- Tener [Node.js](https://nodejs.org) instalado
- Haber creado la tabla en Supabase (ver SQL arriba)

### Pasos

```bash
# 1. Clona el repositorio
git clone https://github.com/patriciaescudero31/mapa-oportunidades-ia.git

# 2. Entra en la carpeta
cd mapa-oportunidades-ia

# 3. Inicia un servidor local
npx serve . -p 3000

# 4. Abre en el navegador
# http://localhost:3000
```

> ⚠️ No abras `index.html` directamente haciendo doble clic, porque las llamadas a la API necesitan un servidor HTTP para funcionar correctamente.

---

## 🌐 Cómo probar que la app es pública (multi-usuario)

1. **Usuario A** abre `http://localhost:3000` y publica una oportunidad
2. **Usuario B** abre el mismo enlace en **otro navegador o dispositivo**
3. La oportunidad publicada por A **aparece automáticamente** para B

Esto funciona porque todos los datos se leen desde Supabase, no desde el navegador local.

---

## ✨ Funcionalidades de la app

### 📝 Publicar oportunidad
- Formulario con todos los campos requeridos
- Validación de campos vacíos
- Al publicar, la lista se recarga automáticamente desde Supabase

### 🔍 Filtros
- **Búsqueda por texto**: busca en nombre, problema, solución, ciudad y país
- **Filtro por ciudad**: solo ciudades que ya tienen oportunidades
- **Filtro por país**: solo países que ya tienen oportunidades
- **Filtro por categoría**: predefinidas (Salud, Educación, Tecnología, etc.)

### 💜 Sistema de likes
- Cualquiera puede dar like a una oportunidad
- Los likes se guardan en Supabase (persistentes y compartidos)
- Cada navegador recuerda a qué oportunidades ya le dio like (localStorage)
- No se puede dar like dos veces a la misma oportunidad

### 📊 Estadísticas en tiempo real
- Total de oportunidades publicadas
- Número de ciudades representadas
- Número de países representados
- Total de likes en todas las oportunidades

---

## 🎨 Diseño

- **Modo oscuro** como tema principal
- **Paleta de colores**: púrpura (#8b5cf6) y cian (#06b6d4)
- **Glassmorphism** en la barra de navegación
- **Animaciones**: fade-in en las tarjetas, hover effects, spinner de carga
- **Diseño responsivo**: adaptado para móvil, tablet y escritorio
- **Tipografía**: Inter (Google Fonts)

---

## 📚 Conceptos aprendidos en este ejercicio

| Concepto | Dónde se aplica |
|---|---|
| **API REST** | Comunicación con Supabase vía fetch |
| **CRUD** | Create (publicar), Read (ver), Update (likes) |
| **Base de datos relacional** | Tabla PostgreSQL en Supabase |
| **Row Level Security (RLS)** | Permisos públicos en Supabase |
| **Fetch API** | Peticiones HTTP desde JavaScript |
| **Async/Await** | Manejo de operaciones asíncronas |
| **DOM Manipulation** | Renderizado dinámico de tarjetas |
| **LocalStorage** | Guardar likes locales por navegador |
| **CSS Variables** | Sistema de diseño consistente |
| **Git + GitHub** | Control de versiones y repositorio |

---

## 👩‍💻 Autora

**Patricia Escudero**  
Ejercicio de clase — Full-Stack con Supabase  
Octubre 2026