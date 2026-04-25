"""src/generator.py

Name: Terence Anquandah
Index Number: 10022200077

LLM generation step (Vertex AI).

Important (exam constraint):
- Only generation uses an external LLM API.
- Retrieval, chunking, reranking, and prompt building are implemented manually.
"""

from __future__ import annotations

import json
import os
import tempfile
from typing import Optional

import vertexai
from vertexai.generative_models import GenerativeModel

from .config import LOCATION, PROJECT_ID

FALLBACK_MESSAGE = (
    "I could not generate a response at the moment. "
    "Please try again in a few seconds."
)
AUTH_MESSAGE = (
    "Vertex AI authentication is not configured. "
    "Set GOOGLE_APPLICATION_CREDENTIALS_JSON (service account JSON string) "
    "or GOOGLE_APPLICATION_CREDENTIALS (path to JSON key file)."
)


def _ensure_google_credentials() -> None:
    """Configure Google credentials from env vars for cloud deployments.

    Priority:
    1. GOOGLE_APPLICATION_CREDENTIALS (file path) — already handled by google-auth
    2. GOOGLE_APPLICATION_CREDENTIALS_JSON (JSON string) — write to a temp file
       and set GOOGLE_APPLICATION_CREDENTIALS so all google-auth clients pick it up.
    """
    # Already set (either by the OS env or a previous call to this function)
    if os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"):
        return

    json_str = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS_JSON", "").strip()
    if not json_str:
        return  # Let google-auth fall through to ADC (works locally)

    try:
        creds_dict = json.loads(json_str)
    except json.JSONDecodeError as exc:
        raise RuntimeError(
            "GOOGLE_APPLICATION_CREDENTIALS_JSON is not valid JSON."
        ) from exc

    # Write to a named temp file that persists for the lifetime of the process.
    tmp = tempfile.NamedTemporaryFile(
        mode="w", suffix=".json", delete=False, prefix="gcp_sa_"
    )
    json.dump(creds_dict, tmp)
    tmp.flush()
    tmp.close()
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = tmp.name


class LLMGenerator:
    """Safe Vertex AI text generator."""

    def __init__(self, project_id: str, location: str = LOCATION, model_name: str = "gemini-1.5-pro"):
        self.project_id = (project_id or "").strip()
        self.location = (location or LOCATION).strip()
        self.model_name = (model_name or "gemini-1.5-pro").strip()
        self._model: Optional[GenerativeModel] = None
        self._init_error: Optional[str] = None
        self._initialize()

    def _initialize(self) -> None:
        try:
            if not self.project_id:
                raise ValueError("PROJECT_ID is empty.")
            _ensure_google_credentials()
            vertexai.init(project=self.project_id, location=self.location)
            self._model = GenerativeModel(self.model_name)
        except Exception as exc:
            self._init_error = str(exc)
            self._model = None

    def generate(self, prompt: str) -> str:
        """Generate text safely. Never raises to caller."""
        safe_prompt = (prompt or "").strip()
        if not safe_prompt:
            return "Please provide a non-empty prompt."

        if self._model is None:
            if self._init_error and (
                "default credentials" in self._init_error.lower()
                or "credential" in self._init_error.lower()
                or "auth" in self._init_error.lower()
            ):
                return AUTH_MESSAGE
            return FALLBACK_MESSAGE

        try:
            response = self._model.generate_content(safe_prompt)
            # --- Diagnostic: print the raw response ---
            import sys
            print(f"[VERTEX DEBUG] response type: {type(response)}", flush=True, file=sys.stderr)
            print(f"[VERTEX DEBUG] response: {response}", flush=True, file=sys.stderr)
            text = (getattr(response, "text", "") or "").strip()
            print(f"[VERTEX DEBUG] text extracted: {repr(text[:200])}", flush=True, file=sys.stderr)
            if text:
                return text
            return FALLBACK_MESSAGE
        except Exception as exc:
            import sys
            print(f"[VERTEX ERROR] {type(exc).__name__}: {exc}", flush=True, file=sys.stderr)
            err = str(exc).lower()
            if "default credentials" in err or "credential" in err or "auth" in err:
                return AUTH_MESSAGE
            if "publisher model" in err and ("not found" in err or "does not have access" in err):
                fallback_candidates = ["gemini-2.5-flash", "gemini-2.5-pro"]
                for fallback_model in fallback_candidates:
                    if fallback_model == self.model_name:
                        continue
                    try:
                        self._model = GenerativeModel(fallback_model)
                        self.model_name = fallback_model
                        retry_response = self._model.generate_content(safe_prompt)
                        retry_text = (getattr(retry_response, "text", "") or "").strip()
                        if retry_text:
                            return retry_text
                    except Exception:
                        continue
            return FALLBACK_MESSAGE


def generate_answer(
    provider: str,
    model: str,
    prompt: str,
    temperature: float = 0.2,
    max_output_tokens: Optional[int] = None,
) -> str:
    """Compatibility wrapper for existing call sites.

    `provider`, `model`, `temperature`, and `max_output_tokens` are accepted to avoid
    touching the rest of the app, but Vertex AI is used for generation.
    """
    _ = (provider, model, temperature, max_output_tokens)

    project_id = os.getenv("PROJECT_ID", PROJECT_ID).strip() or PROJECT_ID
    location = os.getenv("LOCATION", LOCATION).strip() or LOCATION
    configured_model = (model or "").strip() or os.getenv("GEMINI_MODEL", "gemini-1.5-pro").strip()
    generator = LLMGenerator(
        project_id=project_id,
        location=location,
        model_name=configured_model or "gemini-1.5-pro",
    )
    return generator.generate(prompt=prompt)
