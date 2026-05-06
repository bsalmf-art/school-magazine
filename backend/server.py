from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import secrets
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Admin credentials (from env)
ADMIN_USERNAME = os.environ.get('ADMIN_USERNAME', 'admin')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'admin1234')

# In-memory admin tokens (ephemeral, adequate for magazine admin)
ACTIVE_TOKENS: set = set()


app = FastAPI()
api_router = APIRouter(prefix="/api")


# ============ MODELS ============
ALLOWED_SECTIONS = {"awareness", "news", "excellence"}  # نحو طريق واعٍ / آخر الأخبار / بصمة تميز


class Article(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    excerpt: str
    content: str
    section: str  # awareness | news | excellence
    image_url: str
    author: str = "هيئة التحرير"
    featured: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ArticleCreate(BaseModel):
    title: str
    excerpt: str
    content: str
    section: str
    image_url: str
    author: Optional[str] = "هيئة التحرير"
    featured: Optional[bool] = False


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


async def require_admin(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    token = authorization.split(" ", 1)[1].strip()
    if token not in ACTIVE_TOKENS:
        raise HTTPException(status_code=401, detail="Invalid token")
    return True


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
    if payload.username != ADMIN_USERNAME or payload.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="بيانات الدخول غير صحيحة")
    token = secrets.token_urlsafe(32)
    ACTIVE_TOKENS.add(token)
    return {"token": token, "username": ADMIN_USERNAME}


@api_router.post("/admin/logout")
async def admin_logout(authorization: Optional[str] = Header(None)):
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ", 1)[1].strip()
        ACTIVE_TOKENS.discard(token)
    return {"ok": True}


@api_router.get("/admin/me")
async def admin_me(_: bool = Depends(require_admin)):
    return {"username": ADMIN_USERNAME, "authenticated": True}


# ============ STARTUP SEEDING ============
SEED_ARTICLES = [
    {
        "title": "خطوات عملية نحو طريق واعٍ في تربية أبنائنا",
        "excerpt": "كيف نُوجّه بناتنا نحو وعي حقيقي يجمع بين العلم والقيم والمسؤولية في زمن التحديات المتسارعة.",
        "content": "في عالم يتسابق فيه التقنيات والمعلومات، تبرز الحاجة إلى بناء وعي متوازن لدى طالباتنا؛ وعيٌ لا يكتفي بالمعرفة النظرية بل يربطها بالقيم والسلوك اليومي.\n\nتبدأ الخطوة الأولى بالحوار المنفتح داخل البيت؛ حوارٌ يمنح الطالبة مساحة للتعبير دون خوف من الحكم، ويُرسّخ فيها ثقة بالنفس قادرة على التمييز بين الصحيح والخاطئ.\n\nالخطوة الثانية: غرس عادة القراءة الهادفة، واختيار محتوى رقمي يليق بعقل الطالبة ويثري تفكيرها.\n\nختاماً، الشراكة بين البيت والمدرسة هي الجسر الأصيل نحو طريق واعٍ؛ فحين يتكامل دور المعلمة مع ولي الأمر، تتكوّن شخصية متزنة قادرة على صناعة مستقبلها بثقة.",
        "section": "awareness",
        "image_url": "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80",
        "author": "أ. هدى العتيبي",
        "featured": True,
    },
    {
        "title": "فن الإصغاء: مهارة نمنحها لبناتنا قبل كل شيء",
        "excerpt": "الإصغاء ليس صمتاً، بل حضورٌ كامل يُشعر الطالبة بأنها مسموعة ومقدّرة.",
        "content": "تُشير الدراسات التربوية الحديثة إلى أن الطالبة التي تنشأ في بيئة تُصغي إليها تكون أكثر ثقةً واتزاناً في قراراتها المستقبلية.\n\nالإصغاء الفعّال يتطلّب أن نضع الهاتف جانباً، وننظر في عيني ابنتنا، ونمنحها وقتاً كافياً للتعبير. هذه اللحظات القصيرة تبني جسوراً دائمة من الثقة.\n\nفي المدرسة، نحرص على تدريب المعلمات على مهارات الإصغاء التفاعلي، لأننا نؤمن أن كل طالبة تحمل قصة تستحق أن تُروى، وصوتاً يستحق أن يُسمع.",
        "section": "awareness",
        "image_url": "https://images.unsplash.com/photo-1455390582262-044cdead27d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
        "author": "أ. منى القحطاني",
        "featured": False,
    },
    {
        "title": "انطلاق فعاليات الأسبوع الثقافي بحضور مميّز",
        "excerpt": "شهدت المدرسة انطلاق فعاليات الأسبوع الثقافي بمشاركة واسعة من الطالبات وأولياء الأمور.",
        "content": "في أجواء مفعمة بالحيوية، انطلقت صباح اليوم فعاليات الأسبوع الثقافي تحت شعار \"معرفة تُصنع، وهويّة تُصان\".\n\nتضمّن البرنامج ركناً تراثياً، وركناً للعلوم والابتكار، إضافة إلى أمسية شعرية قدّمتها طالبات الصف الثالث الثانوي.\n\nوقد أشادت إدارة المدرسة بالجهود المبذولة من اللجان الطلابية، وأكدت أن هذه الفعاليات تمثّل امتداداً طبيعياً لرسالة المدرسة في بناء شخصية متكاملة.",
        "section": "news",
        "image_url": "https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
        "author": "هيئة التحرير",
        "featured": True,
    },
    {
        "title": "اجتماع مجلس الأمهات يناقش خطط الفصل القادم",
        "excerpt": "عقد مجلس الأمهات اجتماعه الدوري لمناقشة الخطط التطويرية والبرامج المشتركة.",
        "content": "في لقاء ودّي ومثمر، اجتمع مجلس الأمهات مع إدارة المدرسة لاستعراض خطط الفصل الدراسي القادم، ومناقشة المبادرات المجتمعية التي يمكن تنفيذها بشراكة حقيقية بين البيت والمدرسة.\n\nتم خلال اللقاء عرض عدد من المقترحات القيّمة التي قدّمتها الأمهات، وتم الاتفاق على تشكيل لجنة متابعة تضمن تحويل هذه الأفكار إلى واقع ملموس.\n\nنشكر لأولياء الأمور حضورهم وتفاعلهم، فحضوركم هو ما يصنع الفرق.",
        "section": "news",
        "image_url": "https://images.unsplash.com/photo-1543269865-cbf427effbad?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
        "author": "هيئة التحرير",
        "featured": False,
    },
    {
        "title": "بصمة تميّز: الطالبة لُجين تُمثّل المدرسة في الأولمبياد الوطني",
        "excerpt": "إنجاز جديد يُضاف إلى سجل المدرسة بفوز الطالبة لُجين بالمركز الأول في أولمبياد الرياضيات.",
        "content": "بخطوات واثقة وعقل نيّر، حصدت الطالبة لُجين محمد المركز الأول على مستوى المنطقة في أولمبياد الرياضيات الوطني، لتُضيف بذلك بصمة جديدة إلى سجل تميّز المدرسة.\n\nتقول لُجين: \"كانت الرحلة مليئة بالتحديات، لكن دعم معلماتي وأسرتي كان الوقود الذي أوصلني إلى هذا الإنجاز\".\n\nنبارك للطالبة ولأسرتها، ونسأل الله لها دوام التوفيق، فأنتِ قدوة لكل زميلاتك.",
        "section": "excellence",
        "image_url": "https://images.unsplash.com/photo-1532012197267-da84d127e765?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
        "author": "هيئة التحرير",
        "featured": True,
    },
    {
        "title": "بصمة تميّز: فريق \"إبداع\" يحصد جائزة المبادرات المجتمعية",
        "excerpt": "فريق طالبات المدرسة يُتوَّج بجائزة أفضل مبادرة مجتمعية على مستوى المدارس.",
        "content": "تمكّن فريق \"إبداع\" المكوّن من ثماني طالبات من مختلف الصفوف من الفوز بجائزة أفضل مبادرة مجتمعية لهذا العام، وذلك عن مشروعهن \"حديقة الأجيال\" الذي يربط بين كبار السن والطالبات في أنشطة أسبوعية مشتركة.\n\nالمبادرة تنقل رسالة عميقة: أن التعليم لا يتوقف عند حدود الفصل، بل يمتدّ إلى المجتمع ليزرع فيه أثراً دائماً.\n\nنحتفي بهذا الإنجاز، وندعو جميع الطالبات إلى الاقتداء بهذه الروح الإيجابية الخلّاقة.",
        "section": "excellence",
        "image_url": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
        "author": "هيئة التحرير",
        "featured": False,
    },
]


@app.on_event("startup")
async def seed_data():
    existing = await db.articles.count_documents({})
    if existing == 0:
        logger.info("Seeding initial articles...")
        for a in SEED_ARTICLES:
            art = Article(**a)
            await db.articles.insert_one(serialize_dt(art.model_dump()))
        logger.info(f"Seeded {len(SEED_ARTICLES)} articles")


# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
