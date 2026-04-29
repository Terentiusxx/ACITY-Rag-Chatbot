// frontend/lib/api.ts
// Typed fetch wrappers for the FastAPI backend.

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChunkResult {
  source: string;
  text: string;
  final_score: number;
  vector_score: number;
  keyword_score: number;
  domain_score: number;
  metadata: Record<string, unknown>;
}

export interface QueryRequest {
  question: string;
  chunking_strategy?: "fixed" | "section";
  top_k?: number;
  max_context_tokens?: number;
  w_vector?: number;
  w_keyword?: number;
  w_domain?: number;
  show_pure_llm?: boolean;
  model?: string;
}

export interface QueryResponse {
  answer: string;
  pure_llm_answer: string | null;
  chunks: ChunkResult[];
  prompt: string;
  model_used: string;
}

export interface StatusResponse {
  ready: boolean;
  doc_count: number;
  error: string | null;
}

export interface LogsResponse {
  logs: Record<string, unknown>[];
}

// ---------------------------------------------------------------------------
// Fetch helpers
// ---------------------------------------------------------------------------

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const detail = (body as { detail?: string }).detail ?? res.statusText;
    throw new Error(detail);
  }

  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------

export function getStatus(): Promise<StatusResponse> {
  return apiFetch<StatusResponse>("/api/status");
}

export function queryRAG(params: QueryRequest): Promise<QueryResponse> {
  return apiFetch<QueryResponse>("/api/query", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export function getLogs(n = 5): Promise<LogsResponse> {
  return apiFetch<LogsResponse>(`/api/logs?n=${n}`);
}
