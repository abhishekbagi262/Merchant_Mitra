from typing import Any, Dict, List, Optional
from pydantic import BaseModel

class AssistantQueryRequest(BaseModel):
    message: str
    language: str = "en" # en, hi, kn

class SuggestedQuestion(BaseModel):
    id: str
    label: str
    query: str

class AssistantQueryResponse(BaseModel):
    reply: str
    intent: str
    language: str
    structured_data: Optional[Dict[str, Any]] = None
    suggested_questions: List[SuggestedQuestion] = []
