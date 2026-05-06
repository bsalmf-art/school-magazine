"""Backend API tests for Arabic Magazine app.

Covers: root, articles CRUD + filters, admin auth, suggestions, opinions,
and validation that MongoDB `_id` never leaks.
"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://magazine-studio.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "School2025!"


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
        assert "معاً" in data.get("message", "") or "النجاح" in data.get("message", "")


# ---------- Articles (public GET) ----------
class TestArticlesPublic:
    def test_list_all_seeded(self, client):
        r = client.get(f"{API}/articles")
        assert r.status_code == 200
        arr = r.json()
        assert isinstance(arr, list)
        assert len(arr) >= 6, f"Expected >=6 seeded, got {len(arr)}"
        for a in arr:
            assert "_id" not in a
            assert "id" in a and "title" in a and "section" in a

    @pytest.mark.parametrize("section", ["awareness", "news", "excellence"])
    def test_filter_by_section(self, client, section):
        r = client.get(f"{API}/articles", params={"section": section})
        assert r.status_code == 200
        arr = r.json()
        assert len(arr) >= 1
        assert all(a["section"] == section for a in arr)

    def test_invalid_section(self, client):
        r = client.get(f"{API}/articles", params={"section": "bad"})
        assert r.status_code == 400

    def test_filter_featured(self, client):
        r = client.get(f"{API}/articles", params={"featured": "true"})
        assert r.status_code == 200
        arr = r.json()
        assert len(arr) >= 1
        assert all(a["featured"] is True for a in arr)

    def test_get_single_and_404(self, client):
        lst = client.get(f"{API}/articles").json()
        aid = lst[0]["id"]
        r = client.get(f"{API}/articles/{aid}")
        assert r.status_code == 200
        assert r.json()["id"] == aid
        assert "_id" not in r.json()

        r2 = client.get(f"{API}/articles/does-not-exist-xyz")
        assert r2.status_code == 404


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

        # Verify persistence via GET
        g = client.get(f"{API}/articles/{aid}")
        assert g.status_code == 200
        assert g.json()["title"] == payload["title"]

        # Update
        u = client.put(f"{API}/articles/{aid}", json={"title": "TEST_updated", "featured": True}, headers=auth_headers)
        assert u.status_code == 200
        assert u.json()["title"] == "TEST_updated"
        assert u.json()["featured"] is True

        # Verify update
        g2 = client.get(f"{API}/articles/{aid}").json()
        assert g2["title"] == "TEST_updated"
        assert g2["featured"] is True

        # Invalid section update
        bad = client.put(f"{API}/articles/{aid}", json={"section": "bad"}, headers=auth_headers)
        assert bad.status_code == 400

        # Delete
        d = client.delete(f"{API}/articles/{aid}", headers=auth_headers)
        assert d.status_code == 200

        # Verify 404
        g3 = client.get(f"{API}/articles/{aid}")
        assert g3.status_code == 404

    def test_create_invalid_section(self, client, auth_headers):
        r = client.post(f"{API}/articles", json={
            "title": "t", "excerpt": "e", "content": "c",
            "section": "invalid", "image_url": "http://x"
        }, headers=auth_headers)
        assert r.status_code == 400


# ---------- Suggestions ----------
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

    def test_list_admin(self, client, auth_headers):
        r = client.get(f"{API}/suggestions", headers=auth_headers)
        assert r.status_code == 200
        arr = r.json()
        assert isinstance(arr, list)
        assert all("_id" not in s for s in arr)
        # Cleanup TEST_ entries
        for s in arr:
            if s.get("parent_name", "").startswith("TEST_"):
                client.delete(f"{API}/suggestions/{s['id']}", headers=auth_headers)


# ---------- Opinions ----------
class TestOpinions:
    def test_create_valid(self, client):
        r = client.post(f"{API}/opinions", json={
            "name": "TEST_أم",
            "rating": 5,
            "message": "TEST opinion"
        })
        assert r.status_code == 200
        assert r.json()["rating"] == 5
        assert "_id" not in r.json()

    @pytest.mark.parametrize("rating", [0, 6, -1, 10])
    def test_rating_out_of_range(self, client, rating):
        r = client.post(f"{API}/opinions", json={
            "name": "x", "rating": rating, "message": "m"
        })
        assert r.status_code == 400

    def test_list_requires_admin(self, client):
        r = client.get(f"{API}/opinions")
        assert r.status_code == 401

    def test_list_admin_and_cleanup(self, client, auth_headers):
        r = client.get(f"{API}/opinions", headers=auth_headers)
        assert r.status_code == 200
        arr = r.json()
        assert all("_id" not in o for o in arr)
        for o in arr:
            if o.get("name", "").startswith("TEST_"):
                client.delete(f"{API}/opinions/{o['id']}", headers=auth_headers)
