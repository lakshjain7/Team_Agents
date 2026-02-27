"""GPT-4o-mini structured response helpers."""
import os
import json
from openai import OpenAI

_client: OpenAI | None = None
MODEL = "gpt-4o-mini"


def get_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    return _client


def chat_json(system: str, user: str, temperature: float = 0.1) -> dict:
    """Call GPT-4o-mini and parse JSON response. Returns empty dict on failure."""
    response = get_client().chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        temperature=temperature,
        response_format={"type": "json_object"},
    )
    content = response.choices[0].message.content or "{}"
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        return {}


def chat_text(system: str, user: str, temperature: float = 0.3) -> str:
    """Call GPT-4o-mini and return plain text response."""
    response = get_client().chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        temperature=temperature,
    )
    return response.choices[0].message.content or ""
