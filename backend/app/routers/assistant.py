from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import settings
from app.schemas.assistant import AssistantQueryRequest, AssistantQueryResponse
from app.services.ai_service import answer_ask_mitra_query

router = APIRouter(prefix="/api/assistant", tags=["assistant"])

@router.post("/ask", response_model=AssistantQueryResponse)
def ask_assistant(payload: AssistantQueryRequest, db: Session = Depends(get_db)):
    return answer_ask_mitra_query(
        db=db,
        merchant_id=settings.DEMO_MERCHANT_ID,
        query=payload.message,
        language=payload.language
    )
