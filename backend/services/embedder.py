"""OpenAI embedding wrapper with retry and batch support."""
import time
import os
from openai import OpenAI

_client: OpenAI | None = None


def get_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    return _client

EMBED_MODEL = "text-embedding-3-small"
EMBED_DIM = 1536


def embed_text(text: str, retries: int = 3) -> list[float]:
    """Embed a single text string. Returns 1536-dim vector."""
    for attempt in range(retries):
        try:
            response = get_client().embeddings.create(
                model=EMBED_MODEL,
                input=text.replace("\n", " "),
            )
            return response.data[0].embedding
        except Exception as e:
            if attempt == retries - 1:
                raise
            time.sleep(2 ** attempt)
    return []


def embed_batch(texts: list[str], batch_size: int = 100) -> list[list[float]]:
    """Embed a list of texts in batches. Returns list of 1536-dim vectors."""
    all_embeddings = []
    for i in range(0, len(texts), batch_size):
        batch = [t.replace("\n", " ") for t in texts[i : i + batch_size]]
        for attempt in range(3):
            try:
                response = get_client().embeddings.create(model=EMBED_MODEL, input=batch)
                batch_embeddings = [item.embedding for item in sorted(response.data, key=lambda x: x.index)]
                all_embeddings.extend(batch_embeddings)
                break
            except Exception as e:
                if attempt == 2:
                    raise
                time.sleep(2 ** attempt)
    return all_embeddings
