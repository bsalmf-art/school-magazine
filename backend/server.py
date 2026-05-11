from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header, UploadFile, File
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import secrets
import bcrypt
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Uploads directory (served via /api/uploads/{filename})
UPLOADS_DIR = ROOT_DIR / 'uploads'
UPLOADS_DIR.mkdir(exist_ok=True)
ALLOWED_IMAGE_EXT = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
ALLOWED_VIDEO_EXT = {".mp4", ".mov", ".webm", ".m4v", ".ogg"}
MAX_IMAGE_BYTES = 5 * 1024 * 1024  # 5 MB
MAX_VIDEO_BYTES = 50 * 1024 * 1024  # 50 MB

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Admin credentials (env values used only as seed on first start)
ADMIN_SEED_USERNAME = os.environ.get('ADMIN_USERNAME', 'admin')
ADMIN_SEED_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'admin1234')

# In-memory admin tokens: token -> {"id": admin_id, "username": str}
ACTIVE_TOKENS: dict = {}


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# ============ MODELS ============
# نحو طريق واعٍ / آخر الأخبار / بصمة تميز / صوتك مسموع
ALLOWED_SECTIONS = {"awareness", "news", "excellence", "voice"}
PUBLIC_POST_SECTIONS = {"voice"}  # sections where the public can create posts


class Article(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    excerpt: str
    content: str
    section: str  # awareness | news | excellence | voice
    image_url: str = ""
    video_url: str = ""
    link_url: str = ""
    author: str = "هيئة التحرير"
    featured: bool = False
    likes: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ArticleCreate(BaseModel):
    title: str
    excerpt: str
    content: str
    section: str
    image_url: Optional[str] = ""
    video_url: Optional[str] = ""
    link_url: Optional[str] = ""
    author: Optional[str] = "هيئة التحرير"
    featured: Optional[bool] = False


class PublicPostCreate(BaseModel):
    """Public submission for any section (parents writing topics)."""
    title: str
    content: str
    author: Optional[str] = "ولي أمر"
    image_url: Optional[str] = ""
    video_url: Optional[str] = ""
    link_url: Optional[str] = ""


class ArticleUpdate(BaseModel):
    title: Optional[str] = None
    excerpt: Optional[str] = None
    content: Optional[str] = None
    section: Optional[str] = None
    image_url: Optional[str] = None
    author: Optional[str] = None
    featured: Optional[bool] = None


class Suggestion(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    parent_name: str
    student_name: Optional[str] = ""
    subject: str
    message: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class SuggestionCreate(BaseModel):
    parent_name: str
    student_name: Optional[str] = ""
    subject: str
    message: str


class Opinion(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    rating: int = 5
    message: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class OpinionCreate(BaseModel):
    name: str
    rating: int = 5
    message: str


class AdminLogin(BaseModel):
    username: str
    password: str


# ============ HELPERS ============
def serialize_dt(doc: dict) -> dict:
    """Convert datetime -> isoformat string for MongoDB storage."""
    if 'created_at' in doc and isinstance(doc['created_at'], datetime):
        doc['created_at'] = doc['created_at'].isoformat()
    return doc


def parse_dt(doc: dict) -> dict:
    """Convert isoformat string -> datetime after Mongo fetch."""
    if 'created_at' in doc and isinstance(doc['created_at'], str):
        try:
            doc['created_at'] = datetime.fromisoformat(doc['created_at'])
        except Exception:
            pass
    return doc


async def require_admin(authorization: Optional[str] = Header(None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    token = authorization.split(" ", 1)[1].strip()
    session = ACTIVE_TOKENS.get(token)
    if not session:
        raise HTTPException(status_code=401, detail="Invalid token")
    return {"token": token, **session}


# ============ ROUTES ============
@api_router.get("/")
async def root():
    return {"message": "معاً نبني جسوراً نحو النجاح - API", "status": "ok"}


# --- Articles ---
@api_router.get("/articles", response_model=List[Article])
async def list_articles(section: Optional[str] = None, featured: Optional[bool] = None, limit: int = 100):
    query = {}
    if section:
        if section not in ALLOWED_SECTIONS:
            raise HTTPException(status_code=400, detail="قسم غير صالح")
        query['section'] = section
    if featured is not None:
        query['featured'] = featured
    docs = await db.articles.find(query, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return [Article(**parse_dt(d)) for d in docs]


@api_router.get("/articles/{article_id}", response_model=Article)
async def get_article(article_id: str):
    doc = await db.articles.find_one({"id": article_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="المقال غير موجود")
    return Article(**parse_dt(doc))


@api_router.post("/articles", response_model=Article)
async def create_article(payload: ArticleCreate, _: bool = Depends(require_admin)):
    if payload.section not in ALLOWED_SECTIONS:
        raise HTTPException(status_code=400, detail="قسم غير صالح")
    article = Article(**payload.model_dump())
    doc = serialize_dt(article.model_dump())
    await db.articles.insert_one(doc)
    return article


@api_router.put("/articles/{article_id}", response_model=Article)
async def update_article(article_id: str, payload: ArticleUpdate, _: bool = Depends(require_admin)):
    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    if 'section' in update_data and update_data['section'] not in ALLOWED_SECTIONS:
        raise HTTPException(status_code=400, detail="قسم غير صالح")
    if not update_data:
        raise HTTPException(status_code=400, detail="لا يوجد بيانات للتحديث")
    result = await db.articles.update_one({"id": article_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="المقال غير موجود")
    doc = await db.articles.find_one({"id": article_id}, {"_id": 0})
    return Article(**parse_dt(doc))


@api_router.delete("/articles/{article_id}")
async def delete_article(article_id: str, _: bool = Depends(require_admin)):
    result = await db.articles.delete_one({"id": article_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="المقال غير موجود")
    return {"ok": True}


# --- Article likes (per-article reactions) ---
class LikeResponse(BaseModel):
    id: str
    likes: int


@api_router.post("/articles/{article_id}/like", response_model=LikeResponse)
async def like_article(article_id: str):
    doc = await db.articles.find_one({"id": article_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="المقال غير موجود")
    await db.articles.update_one({"id": article_id}, {"$inc": {"likes": 1}})
    new_count = (doc.get("likes", 0) or 0) + 1
    return LikeResponse(id=article_id, likes=new_count)


@api_router.post("/articles/{article_id}/unlike", response_model=LikeResponse)
async def unlike_article(article_id: str):
    doc = await db.articles.find_one({"id": article_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="المقال غير موجود")
    current = doc.get("likes", 0) or 0
    if current > 0:
        await db.articles.update_one({"id": article_id}, {"$inc": {"likes": -1}})
        current -= 1
    return LikeResponse(id=article_id, likes=current)


# --- Public posts (open submission for ANY section) ---
@api_router.post("/sections/{section}/posts", response_model=Article)
async def create_section_post(section: str, payload: PublicPostCreate):
    if section not in ALLOWED_SECTIONS:
        raise HTTPException(status_code=400, detail="قسم غير صالح")
    title = payload.title.strip()
    content = payload.content.strip()
    if len(title) < 3 or len(content) < 5:
        raise HTTPException(status_code=400, detail="العنوان والمحتوى مطلوبان")
    excerpt = (content[:160] + "...") if len(content) > 160 else content
    article = Article(
        title=title,
        excerpt=excerpt,
        content=content,
        section=section,
        image_url=(payload.image_url or "").strip(),
        video_url=(payload.video_url or "").strip(),
        link_url=(payload.link_url or "").strip(),
        author=(payload.author or "ولي أمر").strip() or "ولي أمر",
        featured=False,
    )
    await db.articles.insert_one(serialize_dt(article.model_dump()))
    return article


# Backwards-compat alias
@api_router.post("/voice/posts", response_model=Article)
async def create_voice_post(payload: PublicPostCreate):
    return await create_section_post("voice", payload)


# --- Image uploads (public) ---
class UploadResponse(BaseModel):
    url: str
    filename: str


@api_router.post("/uploads", response_model=UploadResponse)
async def upload_image(file: UploadFile = File(...)):
    suffix = Path(file.filename or "").suffix.lower()
    is_image = suffix in ALLOWED_IMAGE_EXT
    is_video = suffix in ALLOWED_VIDEO_EXT
    if not (is_image or is_video):
        raise HTTPException(status_code=400, detail="نوع الملف غير مدعوم")
    contents = await file.read()
    max_bytes = MAX_VIDEO_BYTES if is_video else MAX_IMAGE_BYTES
    if len(contents) > max_bytes:
        limit_mb = max_bytes // (1024 * 1024)
        raise HTTPException(
            status_code=400,
            detail=f"حجم الملف يتجاوز {limit_mb} ميغابايت",
        )
    fname = f"{uuid.uuid4().hex}{suffix}"
    fpath = UPLOADS_DIR / fname
    with open(fpath, "wb") as f:
        f.write(contents)
    return UploadResponse(url=f"/api/uploads/{fname}", filename=fname)


@api_router.get("/uploads/{filename}")
async def get_upload(filename: str):
    safe = Path(filename).name
    fpath = UPLOADS_DIR / safe
    if not fpath.exists() or not fpath.is_file():
        raise HTTPException(status_code=404, detail="غير موجود")
    return FileResponse(fpath)


# --- Suggestions (مقترحات أولياء الأمور) ---
@api_router.post("/suggestions", response_model=Suggestion)
async def create_suggestion(payload: SuggestionCreate):
    s = Suggestion(**payload.model_dump())
    await db.suggestions.insert_one(serialize_dt(s.model_dump()))
    return s


@api_router.get("/suggestions", response_model=List[Suggestion])
async def list_suggestions(_: bool = Depends(require_admin)):
    docs = await db.suggestions.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return [Suggestion(**parse_dt(d)) for d in docs]


@api_router.delete("/suggestions/{sid}")
async def delete_suggestion(sid: str, _: bool = Depends(require_admin)):
    result = await db.suggestions.delete_one({"id": sid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="غير موجود")
    return {"ok": True}


# --- Opinions (رأيك يهمنا) ---
@api_router.post("/opinions", response_model=Opinion)
async def create_opinion(payload: OpinionCreate):
    if payload.rating < 1 or payload.rating > 5:
        raise HTTPException(status_code=400, detail="التقييم يجب أن يكون بين 1 و 5")
    o = Opinion(**payload.model_dump())
    await db.opinions.insert_one(serialize_dt(o.model_dump()))
    return o


@api_router.get("/opinions", response_model=List[Opinion])
async def list_opinions(_: bool = Depends(require_admin)):
    docs = await db.opinions.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return [Opinion(**parse_dt(d)) for d in docs]


@api_router.delete("/opinions/{oid}")
async def delete_opinion(oid: str, _: bool = Depends(require_admin)):
    result = await db.opinions.delete_one({"id": oid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="غير موجود")
    return {"ok": True}


# --- Admin auth ---
@api_router.post("/admin/login")
async def admin_login(payload: AdminLogin):
    admin_doc = await db.admin.find_one(
        {"username": payload.username.strip()}, {"_id": 0}
    )
    if not admin_doc or not verify_password(
        payload.password, admin_doc.get("password_hash", "")
    ):
        raise HTTPException(status_code=401, detail="بيانات الدخول غير صحيحة")
    token = secrets.token_urlsafe(32)
    ACTIVE_TOKENS[token] = {
        "id": admin_doc["id"],
        "username": admin_doc["username"],
    }
    return {"token": token, "username": admin_doc["username"]}


@api_router.post("/admin/logout")
async def admin_logout(authorization: Optional[str] = Header(None)):
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ", 1)[1].strip()
        ACTIVE_TOKENS.pop(token, None)
    return {"ok": True}


@api_router.get("/admin/me")
async def admin_me(session: dict = Depends(require_admin)):
    return {"username": session["username"], "id": session["id"], "authenticated": True}


class AdminCredentialsUpdate(BaseModel):
    current_password: str
    new_username: Optional[str] = None
    new_password: Optional[str] = None


@api_router.post("/admin/credentials")
async def update_admin_credentials(
    payload: AdminCredentialsUpdate, session: dict = Depends(require_admin)
):
    """Update CURRENT admin's own username/password."""
    admin_doc = await db.admin.find_one({"id": session["id"]}, {"_id": 0})
    if not admin_doc:
        raise HTTPException(status_code=404, detail="حساب المدير غير موجود")

    if not verify_password(payload.current_password, admin_doc.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="كلمة المرور الحالية غير صحيحة")

    updates = {}

    if payload.new_username is not None:
        new_username = payload.new_username.strip()
        if len(new_username) < 3:
            raise HTTPException(
                status_code=400, detail="اسم المستخدم يجب أن يكون 3 أحرف على الأقل"
            )
        # ensure unique
        existing = await db.admin.find_one(
            {"username": new_username, "id": {"$ne": session["id"]}}, {"_id": 0}
        )
        if existing:
            raise HTTPException(status_code=400, detail="اسم المستخدم محجوز")
        updates["username"] = new_username

    if payload.new_password is not None:
        if len(payload.new_password) < 6:
            raise HTTPException(
                status_code=400, detail="كلمة المرور يجب أن تكون 6 أحرف على الأقل"
            )
        updates["password_hash"] = hash_password(payload.new_password)

    if not updates:
        raise HTTPException(status_code=400, detail="لا يوجد بيانات للتحديث")

    await db.admin.update_one({"id": session["id"]}, {"$set": updates})

    # Invalidate sessions for this admin (force re-login on this account)
    for t, s in list(ACTIVE_TOKENS.items()):
        if s["id"] == session["id"]:
            ACTIVE_TOKENS.pop(t, None)
    new_username = updates.get("username", admin_doc["username"])
    return {"ok": True, "username": new_username}


# --- Multi-admin management ---
class AdminPublic(BaseModel):
    id: str
    username: str
    created_at: datetime


class AdminCreate(BaseModel):
    username: str
    password: str


class AdminUpdate(BaseModel):
    username: Optional[str] = None
    password: Optional[str] = None


@api_router.get("/admins", response_model=List[AdminPublic])
async def list_admins(_: dict = Depends(require_admin)):
    docs = await db.admin.find({}, {"_id": 0, "password_hash": 0}).sort("created_at", 1).to_list(100)
    out = []
    for d in docs:
        out.append(AdminPublic(**parse_dt(d)))
    return out


@api_router.post("/admins", response_model=AdminPublic)
async def create_admin(payload: AdminCreate, _: dict = Depends(require_admin)):
    username = payload.username.strip()
    if len(username) < 3:
        raise HTTPException(status_code=400, detail="اسم المستخدم يجب أن يكون 3 أحرف على الأقل")
    if len(payload.password) < 6:
        raise HTTPException(status_code=400, detail="كلمة المرور يجب أن تكون 6 أحرف على الأقل")
    existing = await db.admin.find_one({"username": username}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="اسم المستخدم محجوز")
    new_doc = {
        "id": str(uuid.uuid4()),
        "username": username,
        "password_hash": hash_password(payload.password),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.admin.insert_one(new_doc)
    return AdminPublic(
        id=new_doc["id"],
        username=new_doc["username"],
        created_at=datetime.fromisoformat(new_doc["created_at"]),
    )


@api_router.put("/admins/{admin_id}", response_model=AdminPublic)
async def update_admin(
    admin_id: str, payload: AdminUpdate, _: dict = Depends(require_admin)
):
    doc = await db.admin.find_one({"id": admin_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="غير موجود")
    updates = {}
    if payload.username is not None:
        username = payload.username.strip()
        if len(username) < 3:
            raise HTTPException(status_code=400, detail="اسم المستخدم يجب أن يكون 3 أحرف على الأقل")
        existing = await db.admin.find_one(
            {"username": username, "id": {"$ne": admin_id}}, {"_id": 0}
        )
        if existing:
            raise HTTPException(status_code=400, detail="اسم المستخدم محجوز")
        updates["username"] = username
    if payload.password is not None:
        if len(payload.password) < 6:
            raise HTTPException(status_code=400, detail="كلمة المرور يجب أن تكون 6 أحرف على الأقل")
        updates["password_hash"] = hash_password(payload.password)
    if not updates:
        raise HTTPException(status_code=400, detail="لا يوجد بيانات للتحديث")
    await db.admin.update_one({"id": admin_id}, {"$set": updates})
    # Invalidate sessions for this admin
    for t, s in list(ACTIVE_TOKENS.items()):
        if s["id"] == admin_id:
            ACTIVE_TOKENS.pop(t, None)
    fresh = await db.admin.find_one({"id": admin_id}, {"_id": 0, "password_hash": 0})
    return AdminPublic(**parse_dt(fresh))


@api_router.delete("/admins/{admin_id}")
async def delete_admin(admin_id: str, session: dict = Depends(require_admin)):
    if admin_id == session["id"]:
        raise HTTPException(status_code=400, detail="لا يمكن حذف حسابك الحالي")
    total = await db.admin.count_documents({})
    if total <= 1:
        raise HTTPException(status_code=400, detail="يجب أن يبقى مدير واحد على الأقل")
    result = await db.admin.delete_one({"id": admin_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="غير موجود")
    # Invalidate sessions for deleted admin
    for t, s in list(ACTIVE_TOKENS.items()):
        if s["id"] == admin_id:
            ACTIVE_TOKENS.pop(t, None)
    return {"ok": True}


# --- Subscriptions (الاشتراك في المجلة) ---
class Subscription(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: Optional[str] = ""
    email: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class SubscriptionCreate(BaseModel):
    name: Optional[str] = ""
    email: str


@api_router.post("/subscriptions", response_model=Subscription)
async def create_subscription(payload: SubscriptionCreate):
    email = payload.email.strip().lower()
    if "@" not in email or "." not in email or len(email) < 5:
        raise HTTPException(status_code=400, detail="بريد إلكتروني غير صالح")
    existing = await db.subscriptions.find_one({"email": email}, {"_id": 0})
    if existing:
        return Subscription(**parse_dt(existing))
    sub = Subscription(name=payload.name or "", email=email)
    await db.subscriptions.insert_one(serialize_dt(sub.model_dump()))
    return sub


@api_router.get("/subscriptions", response_model=List[Subscription])
async def list_subscriptions(_: bool = Depends(require_admin)):
    docs = await db.subscriptions.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return [Subscription(**parse_dt(d)) for d in docs]


@api_router.delete("/subscriptions/{sid}")
async def delete_subscription(sid: str, _: bool = Depends(require_admin)):
    result = await db.subscriptions.delete_one({"id": sid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="غير موجود")
    return {"ok": True}


# --- Reactions (رأيك يهمنا — أيقونات تفاعل) ---
ALLOWED_REACTIONS = {
    "love": "معجبة بالمحتوى",
    "inspired": "ملهمة",
    "useful": "مفيدة",
    "partnership": "شراكة فعّالة",
    "innovative": "فكرة جديدة",
}


class ReactionCount(BaseModel):
    key: str
    label: str
    count: int


@api_router.get("/reactions", response_model=List[ReactionCount])
async def list_reactions():
    docs = await db.reactions.find({}, {"_id": 0}).to_list(50)
    counts_map = {d["key"]: d.get("count", 0) for d in docs}
    return [
        ReactionCount(key=k, label=v, count=counts_map.get(k, 0))
        for k, v in ALLOWED_REACTIONS.items()
    ]


@api_router.post("/reactions/{key}", response_model=ReactionCount)
async def add_reaction(key: str):
    if key not in ALLOWED_REACTIONS:
        raise HTTPException(status_code=400, detail="نوع تفاعل غير مدعوم")
    await db.reactions.update_one(
        {"key": key},
        {"$inc": {"count": 1}, "$setOnInsert": {"label": ALLOWED_REACTIONS[key]}},
        upsert=True,
    )
    doc = await db.reactions.find_one({"key": key}, {"_id": 0})
    return ReactionCount(key=key, label=ALLOWED_REACTIONS[key], count=doc.get("count", 0))


@api_router.post("/reactions/{key}/decrement", response_model=ReactionCount)
async def remove_reaction(key: str):
    """Allow user to undo their reaction (called when they click again client-side)."""
    if key not in ALLOWED_REACTIONS:
        raise HTTPException(status_code=400, detail="نوع تفاعل غير مدعوم")
    doc = await db.reactions.find_one({"key": key}, {"_id": 0})
    current = doc.get("count", 0) if doc else 0
    if current > 0:
        await db.reactions.update_one({"key": key}, {"$inc": {"count": -1}})
        current -= 1
    return ReactionCount(key=key, label=ALLOWED_REACTIONS[key], count=current)


# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def seed_admin():
    """Ensure at least one admin exists. Seed from env on first start.
    Also migrate any legacy admin doc (without id/created_at) to new schema.
    """
    # Migrate legacy docs missing id
    async for legacy in db.admin.find({"id": {"$exists": False}}, {"_id": 1}):
        await db.admin.update_one(
            {"_id": legacy["_id"]},
            {"$set": {
                "id": str(uuid.uuid4()),
                "created_at": datetime.now(timezone.utc).isoformat(),
            }},
        )

    count = await db.admin.count_documents({})
    if count == 0:
        await db.admin.insert_one({
            "id": str(uuid.uuid4()),
            "username": ADMIN_SEED_USERNAME,
            "password_hash": hash_password(ADMIN_SEED_PASSWORD),
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        logging.info(f"Admin seeded with username '{ADMIN_SEED_USERNAME}'")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
