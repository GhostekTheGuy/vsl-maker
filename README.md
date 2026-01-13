# vsl-maker
nanobana prompt integration tool

na podstawie tej dokumenji przygotuj cała apkę

# 🎬 Reel Generator - Dokumentacja dla Claude Code

## Przegląd projektu

Aplikacja webowa do automatycznego generowania scenariuszy i obrazów AI dla rolek (TikTok, Instagram Reels, YouTube Shorts).

### Stack technologiczny

- **Frontend:** React 18 + TypeScript + Vite
- **Routing:** TanStack Router
- **State/Data fetching:** TanStack Query (React Query)
- **Forms:** TanStack Form + Zod
- **Styling:** Tailwind CSS
- **Backend:** Node.js + Express (lub Hono)
- **Baza danych:** SQLite (Drizzle ORM) lub PostgreSQL

---

## Architektura aplikacji

```
reel-generator/
├── frontend/                    # Aplikacja React
│   ├── src/
│   │   ├── routes/             # TanStack Router - strony
│   │   │   ├── __root.tsx      # Layout główny
│   │   │   ├── index.tsx       # Strona główna
│   │   │   ├── create.tsx      # Tworzenie nowej rolki
│   │   │   ├── projects/
│   │   │   │   ├── index.tsx   # Lista projektów
│   │   │   │   └── $projectId.tsx  # Szczegóły projektu
│   │   │   └── settings.tsx    # Ustawienia (klucze API)
│   │   ├── components/
│   │   │   ├── ui/             # Komponenty UI (Button, Input, Card, etc.)
│   │   │   ├── SceneCard.tsx   # Karta pojedynczej sceny
│   │   │   ├── ScriptEditor.tsx # Edytor scenariusza
│   │   │   ├── ImagePreview.tsx # Podgląd wygenerowanego obrazu
│   │   │   └── CaptionsInput.tsx # Input na captions
│   │   ├── hooks/
│   │   │   ├── useGenerateScript.ts    # Mutacja - generowanie scenariusza
│   │   │   ├── useGenerateImages.ts    # Mutacja - generowanie obrazów
│   │   │   ├── useProjects.ts          # Query - lista projektów
│   │   │   └── useProject.ts           # Query - pojedynczy projekt
│   │   ├── api/
│   │   │   └── client.ts       # Klient API (fetch wrapper)
│   │   ├── types/
│   │   │   └── index.ts        # Typy TypeScript
│   │   ├── lib/
│   │   │   └── utils.ts        # Utility functions
│   │   ├── main.tsx
│   │   └── routeTree.gen.ts    # Auto-generated przez TanStack Router
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── tsconfig.json
│
├── backend/                     # Serwer API
│   ├── src/
│   │   ├── index.ts            # Entry point
│   │   ├── routes/
│   │   │   ├── projects.ts     # CRUD projektów
│   │   │   ├── generate.ts     # Generowanie scenariusza/obrazów
│   │   │   └── settings.ts     # Zarządzanie kluczami API
│   │   ├── services/
│   │   │   ├── claude.ts       # Integracja z Anthropic API
│   │   │   ├── nanobanana.ts   # Integracja z NanoBanana API
│   │   │   └── storage.ts      # Zapis plików
│   │   ├── db/
│   │   │   ├── schema.ts       # Schemat Drizzle
│   │   │   └── index.ts        # Połączenie DB
│   │   └── types/
│   │       └── index.ts
│   ├── package.json
│   └── tsconfig.json
│
├── shared/                      # Współdzielone typy
│   └── types.ts
│
└── docker-compose.yml          # Opcjonalnie
```

---

## Szczegółowa specyfikacja

### 1. Typy danych (shared/types.ts)

```typescript
// Status generowania
export type GenerationStatus = 
  | 'idle' 
  | 'generating_script' 
  | 'script_ready' 
  | 'generating_images' 
  | 'completed' 
  | 'error';

// Pojedyncza scena
export interface Scene {
  id: string;
  number: number;
  title: string;
  description: string;        // Opis po polsku
  visualPrompt: string;       // Prompt EN dla AI
  durationSeconds: number;
  imageUrl?: string;          // URL wygenerowanego obrazu
  imageStatus: 'pending' | 'generating' | 'completed' | 'error';
  errorMessage?: string;
}

// Scenariusz/Projekt
export interface Project {
  id: string;
  title: string;
  theme: string;
  captions: string;           // Oryginalny tekst wejściowy
  styleHints?: string;
  referenceImageUrl?: string;
  totalDuration: number;
  scenes: Scene[];
  status: GenerationStatus;
  createdAt: string;
  updatedAt: string;
}

// Request - tworzenie projektu
export interface CreateProjectRequest {
  captions: string;
  numScenes?: number;         // 10-15, default 12
  styleHints?: string;
  referenceImageUrl?: string;
  model?: 'flash' | 'pro';    // NanoBanana model
}

// Response - generowanie scenariusza
export interface GenerateScriptResponse {
  projectId: string;
  title: string;
  theme: string;
  totalDuration: number;
  scenes: Scene[];
}

// Ustawienia użytkownika
export interface UserSettings {
  anthropicApiKey?: string;
  nanobananaApiKey?: string;
  defaultModel: 'flash' | 'pro';
  defaultNumScenes: number;
}
```

### 2. Endpointy API (backend)

```typescript
// ============================================
// PROJECTS
// ============================================

// GET /api/projects
// Lista wszystkich projektów
// Response: Project[]

// GET /api/projects/:id
// Szczegóły projektu
// Response: Project

// POST /api/projects
// Tworzenie nowego projektu + generowanie scenariusza
// Body: CreateProjectRequest
// Response: Project (ze scenami, bez obrazów)

// DELETE /api/projects/:id
// Usunięcie projektu

// ============================================
// GENERATION
// ============================================

// POST /api/projects/:id/generate-script
// Regenerowanie scenariusza dla istniejącego projektu
// Body: { styleHints?: string, numScenes?: number }
// Response: Project

// POST /api/projects/:id/generate-images
// Rozpoczęcie generowania obrazów dla wszystkich scen
// Body: { model?: 'flash' | 'pro', referenceImageUrl?: string }
// Response: { status: 'started', totalScenes: number }

// POST /api/projects/:id/scenes/:sceneId/generate-image
// Generowanie obrazu dla pojedynczej sceny
// Body: { model?: 'flash' | 'pro' }
// Response: Scene

// GET /api/projects/:id/generation-status
// Status generowania (SSE lub polling)
// Response: { status: GenerationStatus, completedScenes: number, totalScenes: number }

// ============================================
// SCENES
// ============================================

// PATCH /api/projects/:id/scenes/:sceneId
// Edycja sceny (prompt, opis, czas)
// Body: Partial<Scene>
// Response: Scene

// ============================================
// SETTINGS
// ============================================

// GET /api/settings
// Pobranie ustawień (bez kluczy API w pełnej formie)
// Response: { hasAnthropicKey: boolean, hasNanobananaKey: boolean, defaultModel: string }

// PUT /api/settings
// Zapisanie ustawień
// Body: UserSettings
// Response: { success: boolean }

// POST /api/settings/validate-keys
// Walidacja kluczy API
// Body: { anthropicApiKey?: string, nanobananaApiKey?: string }
// Response: { anthropic: boolean, nanobanana: boolean }
```

### 3. Frontend - Routing (TanStack Router)

```typescript
// src/routes/__root.tsx
// Layout główny z nawigacją i Toaster

// src/routes/index.tsx
// Strona główna:
// - Hero section z opisem
// - Przycisk "Stwórz nową rolkę"
// - Lista ostatnich projektów (3-5)

// src/routes/create.tsx
// Formularz tworzenia:
// - Textarea na captions
// - Slider: liczba scen (10-15)
// - Input: wskazówki stylistyczne
// - Input: URL referencji (opcjonalny)
// - Select: model (Flash/Pro)
// - Button: "Generuj scenariusz"
// Po wygenerowaniu -> redirect do /projects/:id

// src/routes/projects/index.tsx
// Lista wszystkich projektów:
// - Karty z miniaturką, tytułem, datą
// - Filtrowanie po statusie
// - Sortowanie

// src/routes/projects/$projectId.tsx
// Szczegóły projektu:
// - Nagłówek: tytuł, temat, status
// - Przycisk: "Generuj obrazy" (jeśli brak)
// - Przycisk: "Regeneruj scenariusz"
// - Grid scen (SceneCard)
// - Każda scena: podgląd obrazu, opis, prompt, edycja
// - Export: pobierz wszystkie obrazy jako ZIP
// - Export: pobierz scenariusz jako TXT/JSON
```

### 4. Frontend - Komponenty

```typescript
// ============================================
// CaptionsInput.tsx
// ============================================
// Textarea z licznikiem znaków
// Podpowiedzi/przykłady
// Walidacja (min 50 znaków)

// ============================================
// SceneCard.tsx
// ============================================
interface SceneCardProps {
  scene: Scene;
  onEdit: (scene: Partial<Scene>) => void;
  onRegenerateImage: () => void;
  isGenerating: boolean;
}
// Wyświetla:
// - Numer sceny + tytuł
// - Obraz (lub placeholder/skeleton podczas generowania)
// - Opis (PL)
// - Prompt wizualny (EN) - rozwijany
// - Czas trwania
// - Przyciski: Edytuj, Regeneruj obraz

// ============================================
// ScriptEditor.tsx
// ============================================
// Edytor scenariusza w formie listy
// Drag & drop do zmiany kolejności scen
// Inline editing opisów i promptów

// ============================================
// ImagePreview.tsx
// ============================================
// Lightbox do podglądu obrazu w pełnym rozmiarze
// Pobieranie pojedynczego obrazu

// ============================================
// GenerationProgress.tsx
// ============================================
// Pasek postępu generowania obrazów
// Licznik: X / Y scen
// Animowany spinner dla aktualnej sceny
```

### 5. Frontend - Hooks (TanStack Query)

```typescript
// ============================================
// useProjects.ts
// ============================================
export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get<Project[]>('/projects'),
  });
}

// ============================================
// useProject.ts
// ============================================
export function useProject(projectId: string) {
  return useQuery({
    queryKey: ['projects', projectId],
    queryFn: () => api.get<Project>(`/projects/${projectId}`),
    refetchInterval: (data) => 
      data?.status === 'generating_images' ? 2000 : false,
  });
}

// ============================================
// useCreateProject.ts
// ============================================
export function useCreateProject() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  return useMutation({
    mutationFn: (data: CreateProjectRequest) => 
      api.post<Project>('/projects', data),
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      navigate({ to: '/projects/$projectId', params: { projectId: project.id } });
    },
  });
}

// ============================================
// useGenerateImages.ts
// ============================================
export function useGenerateImages(projectId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { model?: 'flash' | 'pro' }) =>
      api.post(`/projects/${projectId}/generate-images`, data),
    onSuccess: () => {
      // Rozpocznij polling statusu
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
    },
  });
}

// ============================================
// useUpdateScene.ts
// ============================================
export function useUpdateScene(projectId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ sceneId, data }: { sceneId: string; data: Partial<Scene> }) =>
      api.patch(`/projects/${projectId}/scenes/${sceneId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
    },
  });
}
```

### 6. Backend - Serwisy

```typescript
// ============================================
// services/claude.ts
// ============================================
export class ClaudeService {
  constructor(private apiKey: string) {}

  async generateScript(params: {
    captions: string;
    numScenes: number;
    styleHints?: string;
  }): Promise<{
    title: string;
    theme: string;
    totalDuration: number;
    scenes: Omit<Scene, 'id' | 'imageUrl' | 'imageStatus'>[];
  }> {
    // Wywołanie Anthropic API
    // Prompt jak w oryginalnym skrypcie Python
    // Parsowanie JSON z odpowiedzi
  }
}

// ============================================
// services/nanobanana.ts
// ============================================
export class NanoBananaService {
  private baseUrl = 'https://api.nanobananaapi.ai/api/v1/nanobanana';
  
  constructor(private apiKey: string) {}

  async submitGeneration(params: {
    prompt: string;
    model: 'flash' | 'pro';
    referenceImageUrls?: string[];
    aspectRatio?: string;
  }): Promise<string> {
    // Zwraca taskId
  }

  async checkTaskStatus(taskId: string): Promise<{
    status: 'pending' | 'processing' | 'completed' | 'failed';
    imageUrl?: string;
    error?: string;
  }> {
    // Sprawdza status zadania
  }

  async waitForImage(taskId: string, timeoutMs?: number): Promise<string> {
    // Polling z timeoutem
    // Zwraca URL obrazu
  }
}
```

### 7. Schemat bazy danych (Drizzle)

```typescript
// db/schema.ts
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  theme: text('theme').notNull(),
  captions: text('captions').notNull(),
  styleHints: text('style_hints'),
  referenceImageUrl: text('reference_image_url'),
  totalDuration: real('total_duration').notNull(),
  status: text('status').notNull().default('idle'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const scenes = sqliteTable('scenes', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  number: integer('number').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  visualPrompt: text('visual_prompt').notNull(),
  durationSeconds: real('duration_seconds').notNull(),
  imageUrl: text('image_url'),
  imageStatus: text('image_status').notNull().default('pending'),
  errorMessage: text('error_message'),
});

export const settings = sqliteTable('settings', {
  id: text('id').primaryKey().default('default'),
  anthropicApiKey: text('anthropic_api_key'),
  nanobananaApiKey: text('nanobanana_api_key'),
  defaultModel: text('default_model').default('flash'),
  defaultNumScenes: integer('default_num_scenes').default(12),
});
```

---

## Przepływ użytkownika (User Flow)

### Flow 1: Nowy użytkownik

```
1. Wchodzi na stronę główną (/)
2. Klika "Stwórz rolkę"
3. System sprawdza czy są klucze API
   - Jeśli nie → redirect do /settings z komunikatem
4. Użytkownik podaje klucze API
5. Redirect z powrotem do /create
```

### Flow 2: Tworzenie rolki

```
1. /create - użytkownik wpisuje captions
2. Opcjonalnie: styl, referencja, model
3. Klika "Generuj scenariusz"
4. Loading state (10-30 sekund)
5. Redirect do /projects/:id
6. Widzi scenariusz z 12 scenami (bez obrazów)
7. Może edytować opisy/prompty
8. Klika "Generuj wszystkie obrazy"
9. Progress bar: 1/12, 2/12, ...
10. Po zakończeniu - wszystkie obrazy widoczne
11. Może pobrać ZIP lub scenariusz
```

### Flow 3: Edycja i regeneracja

```
1. /projects/:id - widzi istniejący projekt
2. Klika "Edytuj" na scenie
3. Zmienia prompt wizualny
4. Klika "Regeneruj obraz" dla tej sceny
5. Tylko ta scena się regeneruje
6. Opcja: "Regeneruj cały scenariusz" (nowe sceny z Claude)
```

---

## Komendy do uruchomienia

```bash
# Instalacja
cd frontend && npm install
cd ../backend && npm install

# Development
# Terminal 1:
cd backend && npm run dev

# Terminal 2:
cd frontend && npm run dev

# Build
cd frontend && npm run build
cd backend && npm run build

# Produkcja
cd backend && npm start
```

---

## Zmienne środowiskowe

```env
# backend/.env
PORT=3001
DATABASE_URL=./data/reel-generator.db
CORS_ORIGIN=http://localhost:5173

# Opcjonalnie - globalne klucze (alternatywa do per-user)
ANTHROPIC_API_KEY=sk-ant-...
NANOBANANA_API_KEY=nb-...

# frontend/.env
VITE_API_URL=http://localhost:3001/api
```

---

## Priorytety implementacji

### Faza 1: MVP (Core)
1. ✅ Setup projektu (Vite + TanStack Router)
2. ✅ Strona główna + routing
3. ✅ Formularz tworzenia projektu
4. ✅ Integracja Claude API (generowanie scenariusza)
5. ✅ Wyświetlanie scenariusza

### Faza 2: Obrazy
6. ✅ Integracja NanoBanana API
7. ✅ Generowanie obrazów (wszystkie naraz)
8. ✅ Progress bar + status
9. ✅ Wyświetlanie obrazów w scenach

### Faza 3: Edycja
10. ✅ Edycja scen (inline)
11. ✅ Regeneracja pojedynczej sceny
12. ✅ Regeneracja całego scenariusza

### Faza 4: Export & Polish
13. ✅ Pobieranie ZIP z obrazami
14. ✅ Pobieranie scenariusza (JSON/TXT)
15. ✅ Ustawienia użytkownika
16. ✅ Walidacja kluczy API
17. ✅ Error handling + toast notifications

---

## Dodatkowe uwagi dla Claude Code

### TanStack Router - ważne

```typescript
// Użyj file-based routing
// Zainstaluj: @tanstack/router-plugin dla Vite
// Konfiguracja w vite.config.ts:
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'

export default defineConfig({
  plugins: [react(), TanStackRouterVite()],
})
```

### TanStack Query - Provider

```typescript
// main.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minuta
      retry: 1,
    },
  },
})

// W renderze:
<QueryClientProvider client={queryClient}>
  <RouterProvider router={router} />
</QueryClientProvider>
```

### Obsługa błędów

```typescript
// Użyj react-hot-toast lub sonner dla notifications
// Każda mutacja powinna mieć onError z toast.error()
// API powinno zwracać { error: string } przy błędach
```

### Responsywność

```
- Mobile-first design
- Grid scen: 1 kolumna (mobile), 2 (tablet), 3-4 (desktop)
- Formularz tworzenia: pełna szerokość na mobile
```

### Bezpieczeństwo

```
- Klucze API przechowuj w bazie (zaszyfrowane) lub w localStorage
- Nie wysyłaj kluczy w URL
- Waliduj input przed wysłaniem do API
- Sanityzuj captions przed wysłaniem do Claude
```

---

## Przykładowy prompt do Claude dla generowania scenariusza

```typescript
const SCRIPT_GENERATION_PROMPT = `Jesteś ekspertem od tworzenia scenariuszy do krótkich filmów (reels/TikTok).

Na podstawie poniższego tekstu/captions stwórz szczegółowy scenariusz składający się z {numScenes} scen.

TEKST WEJŚCIOWY:
{captions}

{styleHints ? `STYL/WSKAZÓWKI: ${styleHints}` : ''}

Dla każdej sceny podaj:
1. Numer sceny
2. Tytuł sceny (krótki, opisowy)
3. Opis narracyjny (co się dzieje, jaki jest przekaz)
4. BARDZO SZCZEGÓŁOWY prompt wizualny do wygenerowania obrazu AI (w języku angielskim, 2-3 zdania opisujące kompozycję, kolory, styl, nastrój, elementy wizualne)
5. Sugerowany czas trwania w sekundach (całość powinna trwać 30-60 sekund)

Odpowiedz TYLKO w formacie JSON:
{
    "title": "Tytuł rolki",
    "theme": "Główny temat/przesłanie",
    "total_duration": liczba_sekund,
    "scenes": [
        {
            "number": 1,
            "title": "Tytuł sceny",
            "description": "Opis narracyjny po polsku",
            "visual_prompt": "Detailed English prompt for AI image generation...",
            "duration_seconds": 3.5
        }
    ]
}

Pamiętaj:
- Visual prompt MUSI być po angielsku i bardzo szczegółowy
- Sceny powinny tworzyć spójną narrację wizualną
- Unikaj tekstu na obrazach (AI słabo go generuje)
- Każda scena powinna być możliwa do wizualizacji`;
```

---

To jest pełna dokumentacja. Rozpocznij od Fazy 1 i implementuj krok po kroku.
