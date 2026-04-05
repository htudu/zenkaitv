import random

from fastapi import APIRouter

from ..notes import NOTES
from ..schemas import RandomNoteResponse

router = APIRouter(prefix="/notes", tags=["notes"])


@router.get("/random", response_model=RandomNoteResponse)
def get_random_note():
    return RandomNoteResponse(note=random.choice(NOTES))
