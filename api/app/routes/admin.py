from fastapi import APIRouter

from ..admin.routes.catalog_sync import router as catalog_sync_router
from ..admin.routes.movies import router as movies_router
from ..admin.routes.reactions import router as reactions_router
from ..admin.routes.uploads import router as uploads_router
from ..admin.routes.users import router as users_router


router = APIRouter(prefix="/admin", tags=["admin"])

router.include_router(users_router)
router.include_router(movies_router)
router.include_router(catalog_sync_router)
router.include_router(uploads_router)
router.include_router(reactions_router)