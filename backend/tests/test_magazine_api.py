"""Backend API tests for Arabic Magazine app (Iteration 2).

Covers:
- root, articles CRUD + filters (DB is empty by default, no seed)
- admin auth, suggestions (opinions legacy endpoint still present)
- NEW: subscriptions (POST public, GET/DELETE admin, dup email, invalid email)
- NEW: reactions (GET list of 5, POST increment, POST decrement with floor 0, 400 on invalid key)
- Validation that MongoDB `_id` never leaks.
"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://magazine-studio.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "School2025!"

REACTION_KEYS = ["love", "inspired", "useful", "partnership", "innovative"]


@pytest.fixture(scope="session")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def admin_token(client):
    r = client.post(f"{API}/admin/login", json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD})
    if r.status_code != 200:
        pytest.skip(f"Admin login failed: {r.status_code} {r.text}")
    return r.json()["token"]


@pytest.fixture
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


# ---------- Root ----------
class TestRoot:
    def test_root_arabic(self, client):
        r = client.get(f"{API}/")
        assert r.status_code == 200
        data = r.json()
        assert data.get("status") == "ok"


# ---------- Articles public (DB empty by default) ----------
class TestArticlesPublic:
    def test_list_all(self, client):
        r = client.get(f"{API}/articles")
        assert r.status_code == 200
        arr = r.json()
        assert isinstance(arr, list)
        for a in arr:
            assert "_id" not in a

    def test_invalid_section(self, client):
        r = client.get(f"{API}/articles", params={"section": "bad"})
        assert r.status_code == 400

    def test_get_single_404(self, client):
        r = client.get(f"{API}/articles/does-not-exist-xyz")
        assert r.status_code == 404


# ---------- Admin Auth ----------
class TestAdminAuth:
    def test_login_success(self, client):
        r = client.post(f"{API}/admin/login", json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD})
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data.get("token"), str) and len(data["token"]) > 10

    def test_login_wrong(self, client):
        r = client.post(f"{API}/admin/login", json={"username": "admin", "password": "wrong"})
        assert r.status_code == 401

    def test_me_requires_token(self, client):
        r = client.get(f"{API}/admin/me")
        assert r.status_code == 401

    def test_me_with_token(self, client, auth_headers):
        r = client.get(f"{API}/admin/me", headers=auth_headers)
        assert r.status_code == 200
        assert r.json().get("authenticated") is True

    def test_post_article_requires_auth(self, client):
        r = client.post(f"{API}/articles", json={
            "title": "x", "excerpt": "x", "content": "x",
            "section": "news", "image_url": "http://x"
        })
        assert r.status_code == 401


# ---------- Articles admin CRUD ----------
class TestArticlesAdmin:
    def test_create_update_delete_flow(self, client, auth_headers):
        payload = {
            "title": "TEST_مقال تجريبي",
            "excerpt": "TEST excerpt",
            "content": "TEST content long enough",
            "section": "news",
            "image_url": "https://example.com/i.jpg",
            "author": "TEST Author",
            "featured": False,
        }
        r = client.post(f"{API}/articles", json=payload, headers=auth_headers)
        assert r.status_code == 200, r.text
        art = r.json()
        assert art["title"] == payload["title"]
        assert "_id" not in art
        aid = art["id"]

        g = client.get(f"{API}/articles/{aid}")
        assert g.status_code == 200
        assert g.json()["title"] == payload["title"]

        u = client.put(f"{API}/articles/{aid}", json={"title": "TEST_updated", "featured": True}, headers=auth_headers)
        assert u.status_code == 200
        assert u.json()["title"] == "TEST_updated"
        assert u.json()["featured"] is True

        g2 = client.get(f"{API}/articles/{aid}").json()
        assert g2["title"] == "TEST_updated"
        assert g2["featured"] is True

        bad = client.put(f"{API}/articles/{aid}", json={"section": "bad"}, headers=auth_headers)
        assert bad.status_code == 400

        d = client.delete(f"{API}/articles/{aid}", headers=auth_headers)
        assert d.status_code == 200

        g3 = client.get(f"{API}/articles/{aid}")
        assert g3.status_code == 404

    def test_create_invalid_section(self, client, auth_headers):
        r = client.post(f"{API}/articles", json={
            "title": "t", "excerpt": "e", "content": "c",
            "section": "invalid", "image_url": "http://x"
        }, headers=auth_headers)
        assert r.status_code == 400


# ---------- Suggestions (public POST, admin GET/DELETE) ----------
class TestSuggestions:
    def test_create_public(self, client):
        r = client.post(f"{API}/suggestions", json={
            "parent_name": "TEST_ولي أمر",
            "subject": "TEST_مقترح",
            "message": "TEST message"
        })
        assert r.status_code == 200
        data = r.json()
        assert "_id" not in data
        assert data["parent_name"] == "TEST_ولي أمر"

    def test_list_requires_admin(self, client):
        r = client.get(f"{API}/suggestions")
        assert r.status_code == 401

    def test_list_admin_and_cleanup(self, client, auth_headers):
        r = client.get(f"{API}/suggestions", headers=auth_headers)
        assert r.status_code == 200
        arr = r.json()
        assert isinstance(arr, list)
        assert all("_id" not in s for s in arr)
        for s in arr:
            if s.get("parent_name", "").startswith("TEST_"):
                client.delete(f"{API}/suggestions/{s['id']}", headers=auth_headers)


# ---------- Subscriptions ----------
class TestSubscriptions:
    def test_create_valid(self, client):
        r = client.post(f"{API}/subscriptions", json={
            "name": "TEST_أم",
            "email": "test_subscriber_001@example.com"
        })
        assert r.status_code == 200, r.text
        data = r.json()
        assert "_id" not in data
        assert data["email"] == "test_subscriber_001@example.com"
        assert data["name"] == "TEST_أم"
        assert "id" in data

    def test_duplicate_email_returns_existing(self, client):
        email = "test_dup_subscriber@example.com"
        r1 = client.post(f"{API}/subscriptions", json={"name": "TEST_first", "email": email})
        assert r1.status_code == 200
        id1 = r1.json()["id"]

        r2 = client.post(f"{API}/subscriptions", json={"name": "TEST_second", "email": email})
        assert r2.status_code == 200
        # Should return the existing record (same id)
        assert r2.json()["id"] == id1
        assert r2.json()["email"] == email

    def test_email_case_insensitive(self, client):
        r1 = client.post(f"{API}/subscriptions", json={"email": "TEST_Case@Example.COM"})
        assert r1.status_code == 200
        # Email should be lowercased
        assert r1.json()["email"] == "test_case@example.com"

    @pytest.mark.parametrize("bad_email", ["", "notanemail", "a@b", "no-at-sign.com"])
    def test_invalid_email(self, client, bad_email):
        r = client.post(f"{API}/subscriptions", json={"email": bad_email})
        assert r.status_code == 400, f"Expected 400 for {bad_email!r}, got {r.status_code}"

    def test_list_requires_admin(self, client):
        r = client.get(f"{API}/subscriptions")
        assert r.status_code == 401

    def test_list_admin_no_id_leak(self, client, auth_headers):
        r = client.get(f"{API}/subscriptions", headers=auth_headers)
        assert r.status_code == 200
        arr = r.json()
        assert isinstance(arr, list)
        assert all("_id" not in s for s in arr)
        assert all("id" in s and "email" in s for s in arr)

    def test_delete_requires_admin(self, client):
        r = client.delete(f"{API}/subscriptions/some-id")
        assert r.status_code == 401

    def test_delete_invalid_id_404(self, client, auth_headers):
        r = client.delete(f"{API}/subscriptions/does-not-exist-xyz", headers=auth_headers)
        assert r.status_code == 404

    def test_delete_and_cleanup(self, client, auth_headers):
        # Cleanup all TEST_ subscriptions created by test suite
        lst = client.get(f"{API}/subscriptions", headers=auth_headers).json()
        deleted_any = False
        for s in lst:
            email = s.get("email", "")
            if email.startswith("test_") or "test_" in email:
                r = client.delete(f"{API}/subscriptions/{s['id']}", headers=auth_headers)
                assert r.status_code == 200
                deleted_any = True
        # At least one of our test subs should have been deletable
        assert deleted_any, "Expected to delete at least one test subscription"


# ---------- Reactions ----------
class TestReactions:
    def test_list_returns_five(self, client):
        r = client.get(f"{API}/reactions")
        assert r.status_code == 200
        arr = r.json()
        assert isinstance(arr, list)
        keys = [item["key"] for item in arr]
        assert sorted(keys) == sorted(REACTION_KEYS)
        for item in arr:
            assert "label" in item and isinstance(item["label"], str) and item["label"]
            assert "count" in item and isinstance(item["count"], int)
            assert item["count"] >= 0

    def test_increment_love(self, client):
        before = client.get(f"{API}/reactions").json()
        before_love = next(x["count"] for x in before if x["key"] == "love")

        r = client.post(f"{API}/reactions/love")
        assert r.status_code == 200
        data = r.json()
        assert data["key"] == "love"
        assert data["count"] == before_love + 1

        # Verify via GET
        after = client.get(f"{API}/reactions").json()
        after_love = next(x["count"] for x in after if x["key"] == "love")
        assert after_love == before_love + 1

    def test_decrement_love(self, client):
        # First ensure count >= 1 by incrementing
        client.post(f"{API}/reactions/love")
        before = client.get(f"{API}/reactions").json()
        before_love = next(x["count"] for x in before if x["key"] == "love")
        assert before_love >= 1

        r = client.post(f"{API}/reactions/love/decrement")
        assert r.status_code == 200
        assert r.json()["count"] == before_love - 1

    def test_decrement_never_below_zero(self, client, auth_headers):
        # Use a reaction key and decrement many times — never below 0
        # We can't reset directly; just call decrement repeatedly and confirm never negative
        for _ in range(50):
            r = client.post(f"{API}/reactions/innovative/decrement")
            assert r.status_code == 200
            assert r.json()["count"] >= 0

        # Final check via GET
        arr = client.get(f"{API}/reactions").json()
        innov = next(x["count"] for x in arr if x["key"] == "innovative")
        assert innov >= 0

    def test_invalid_key_increment(self, client):
        r = client.post(f"{API}/reactions/invalidkey")
        assert r.status_code == 400

    def test_invalid_key_decrement(self, client):
        r = client.post(f"{API}/reactions/invalidkey/decrement")
        assert r.status_code == 400

    def test_no_id_leak(self, client):
        r = client.get(f"{API}/reactions")
        assert r.status_code == 200
        for item in r.json():
            assert "_id" not in item


# ---------- Opinions (legacy — endpoints still present, verify they don't break) ----------
class TestOpinionsLegacy:
    def test_create_legacy_still_works(self, client):
        r = client.post(f"{API}/opinions", json={
            "name": "TEST_legacy",
            "rating": 5,
            "message": "TEST legacy opinion"
        })
        assert r.status_code == 200

    def test_list_requires_admin(self, client):
        r = client.get(f"{API}/opinions")
        assert r.status_code == 401

    def test_cleanup_legacy(self, client, auth_headers):
        r = client.get(f"{API}/opinions", headers=auth_headers)
        assert r.status_code == 200
        for o in r.json():
            if o.get("name", "").startswith("TEST_"):
                client.delete(f"{API}/opinions/{o['id']}", headers=auth_headers)
