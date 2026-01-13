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
  description: string;
  visualPrompt: string;
  durationSeconds: number;
  imageUrl?: string;
  imageStatus: 'pending' | 'generating' | 'completed' | 'error';
  errorMessage?: string;
}

// Scenariusz/Projekt
export interface Project {
  id: string;
  title: string;
  theme: string;
  captions: string;
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
  numScenes?: number;
  styleHints?: string;
  referenceImageUrl?: string;
  model?: 'flash' | 'pro';
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

// API Response types
export interface ApiError {
  error: string;
  details?: string;
}

export interface GenerateImagesResponse {
  status: 'started';
  totalScenes: number;
}

export interface GenerationStatusResponse {
  status: GenerationStatus;
  completedScenes: number;
  totalScenes: number;
}

export interface SettingsResponse {
  hasAnthropicKey: boolean;
  hasNanobananaKey: boolean;
  defaultModel: 'flash' | 'pro';
  defaultNumScenes: number;
}

export interface ValidateKeysResponse {
  anthropic: boolean;
  nanobanana: boolean;
}
