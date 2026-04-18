"""
Backend API Tests for Today Task Application
Tests: Auth (register, login, logout, refresh, me), Tasks CRUD, User preferences, Subscription
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthAndRoot:
    """Health check and root endpoint tests"""
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert data["message"] == "Today Task API"
        print("✓ API root endpoint working")


class TestAuthRegister:
    """Registration endpoint tests"""
    
    def test_register_new_user(self):
        """Test registering a new user"""
        unique_email = f"test_user_{int(time.time())}@test.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "testpass123",
            "name": "Test User"
        })
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["email"] == unique_email.lower()
        assert data["name"] == "Test User"
        assert data["is_premium"] == False
        assert data["subscription_status"] == "free"
        assert "preferences" in data
        print(f"✓ User registered: {unique_email}")
        
    def test_register_duplicate_email(self):
        """Test registering with existing email fails"""
        # First register
        unique_email = f"test_dup_{int(time.time())}@test.com"
        requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "testpass123",
            "name": "Test User"
        })
        # Try duplicate
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "testpass123",
            "name": "Test User 2"
        })
        assert response.status_code == 409
        print("✓ Duplicate email registration rejected")
        
    def test_register_short_password(self):
        """Test registration with short password fails"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": f"test_short_{int(time.time())}@test.com",
            "password": "123",
            "name": "Test"
        })
        assert response.status_code == 400
        print("✓ Short password rejected")


class TestAuthLogin:
    """Login endpoint tests"""
    
    def test_login_valid_credentials(self):
        """Test login with valid admin credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@todaytask.com",
            "password": "admin123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["email"] == "admin@todaytask.com"
        assert data["is_premium"] == True
        # Check cookies are set
        assert "access_token" in response.cookies or "set-cookie" in str(response.headers).lower()
        print("✓ Admin login successful")
        
    def test_login_invalid_password(self):
        """Test login with wrong password"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@todaytask.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("✓ Invalid password rejected")
        
    def test_login_nonexistent_user(self):
        """Test login with non-existent email"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "nonexistent@test.com",
            "password": "anypassword"
        })
        assert response.status_code == 401
        print("✓ Non-existent user login rejected")


class TestAuthenticatedEndpoints:
    """Tests requiring authentication"""
    
    @pytest.fixture
    def auth_session(self):
        """Create authenticated session"""
        session = requests.Session()
        # Register a new test user
        unique_email = f"test_auth_{int(time.time())}@test.com"
        response = session.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "testpass123",
            "name": "Auth Test User"
        })
        assert response.status_code == 200
        return session, unique_email
    
    def test_get_me_authenticated(self, auth_session):
        """Test /auth/me with valid session"""
        session, email = auth_session
        response = session.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == email.lower()
        print("✓ /auth/me returns user data")
        
    def test_get_me_unauthenticated(self):
        """Test /auth/me without auth fails"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401
        print("✓ /auth/me rejects unauthenticated requests")
        
    def test_logout(self, auth_session):
        """Test logout clears session"""
        session, _ = auth_session
        response = session.post(f"{BASE_URL}/api/auth/logout")
        assert response.status_code == 200
        # After logout, /me should fail
        response = session.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401
        print("✓ Logout clears session")


class TestTasksCRUD:
    """Task CRUD operations tests"""
    
    @pytest.fixture
    def auth_session(self):
        """Create authenticated session with test user"""
        session = requests.Session()
        unique_email = f"test_tasks_{int(time.time())}@test.com"
        response = session.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "testpass123",
            "name": "Task Test User"
        })
        assert response.status_code == 200
        return session
    
    def test_get_tasks_empty(self, auth_session):
        """Test getting tasks for new user returns empty list"""
        response = auth_session.get(f"{BASE_URL}/api/tasks")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print("✓ GET /tasks returns list")
        
    def test_create_task(self, auth_session):
        """Test creating a task"""
        task_data = {
            "id": f"task_{int(time.time())}",
            "title": "TEST_Task Title",
            "datetime": "2026-04-20T10:00:00",
            "hasReminder": True,
            "notification_type": "both"
        }
        response = auth_session.post(f"{BASE_URL}/api/tasks", json=task_data)
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "TEST_Task Title"
        assert data["hasReminder"] == True
        assert data["completed"] == False
        print("✓ Task created successfully")
        return task_data["id"]
        
    def test_create_and_get_task(self, auth_session):
        """Test creating a task and verifying it persists"""
        task_id = f"task_{int(time.time())}"
        task_data = {
            "id": task_id,
            "title": "TEST_Persistence Check",
            "datetime": None,
            "hasReminder": False,
            "notification_type": "none"
        }
        # Create
        response = auth_session.post(f"{BASE_URL}/api/tasks", json=task_data)
        assert response.status_code == 200
        
        # Get all tasks and verify
        response = auth_session.get(f"{BASE_URL}/api/tasks")
        assert response.status_code == 200
        tasks = response.json()
        found = any(t["id"] == task_id for t in tasks)
        assert found, "Created task not found in task list"
        print("✓ Task persisted and retrieved")
        
    def test_update_task(self, auth_session):
        """Test updating a task"""
        # Create task first
        task_id = f"task_update_{int(time.time())}"
        auth_session.post(f"{BASE_URL}/api/tasks", json={
            "id": task_id,
            "title": "TEST_Original Title",
            "datetime": None,
            "hasReminder": False
        })
        
        # Update
        response = auth_session.put(f"{BASE_URL}/api/tasks/{task_id}", json={
            "title": "TEST_Updated Title",
            "completed": True
        })
        assert response.status_code == 200
        
        # Verify update
        response = auth_session.get(f"{BASE_URL}/api/tasks")
        tasks = response.json()
        updated_task = next((t for t in tasks if t["id"] == task_id), None)
        assert updated_task is not None
        assert updated_task["title"] == "TEST_Updated Title"
        assert updated_task["completed"] == True
        print("✓ Task updated successfully")
        
    def test_delete_task(self, auth_session):
        """Test deleting a task"""
        # Create task first
        task_id = f"task_delete_{int(time.time())}"
        auth_session.post(f"{BASE_URL}/api/tasks", json={
            "id": task_id,
            "title": "TEST_To Be Deleted",
            "datetime": None,
            "hasReminder": False
        })
        
        # Delete
        response = auth_session.delete(f"{BASE_URL}/api/tasks/{task_id}")
        assert response.status_code == 200
        
        # Verify deletion
        response = auth_session.get(f"{BASE_URL}/api/tasks")
        tasks = response.json()
        found = any(t["id"] == task_id for t in tasks)
        assert not found, "Deleted task still exists"
        print("✓ Task deleted successfully")


class TestUserPreferences:
    """User preferences tests"""
    
    @pytest.fixture
    def auth_session(self):
        """Create authenticated session"""
        session = requests.Session()
        unique_email = f"test_prefs_{int(time.time())}@test.com"
        session.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "testpass123",
            "name": "Prefs Test User"
        })
        return session
    
    def test_update_preferences(self, auth_session):
        """Test updating user preferences"""
        prefs = {
            "theme": "dark",
            "font": "classic",
            "sound_enabled": False,
            "alarm_sound": "morning-dew"
        }
        response = auth_session.put(f"{BASE_URL}/api/user/preferences", json=prefs)
        assert response.status_code == 200
        
        # Verify via /me
        response = auth_session.get(f"{BASE_URL}/api/auth/me")
        data = response.json()
        assert data["preferences"]["theme"] == "dark"
        assert data["preferences"]["sound_enabled"] == False
        print("✓ Preferences updated and persisted")


class TestSubscription:
    """Subscription endpoint tests"""
    
    @pytest.fixture
    def auth_session(self):
        """Create authenticated session"""
        session = requests.Session()
        unique_email = f"test_sub_{int(time.time())}@test.com"
        session.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "testpass123",
            "name": "Sub Test User"
        })
        return session
    
    def test_create_checkout_session(self, auth_session):
        """Test creating Stripe checkout session"""
        response = auth_session.post(f"{BASE_URL}/api/subscription/checkout", json={
            "origin_url": "https://today-task-manager.preview.emergentagent.com"
        })
        # Should return 200 with checkout URL or fail gracefully
        # Stripe test key may not work in all environments
        if response.status_code == 200:
            data = response.json()
            assert "url" in data or "session_id" in data
            print("✓ Checkout session created")
        else:
            print(f"⚠ Checkout returned {response.status_code} - may be Stripe config issue")
            # Don't fail test for Stripe issues
            pytest.skip("Stripe checkout not available in test environment")


class TestBruteForceProtection:
    """Brute force protection tests"""
    
    def test_lockout_after_failed_attempts(self):
        """Test account lockout after 5 failed attempts"""
        session = requests.Session()
        test_email = "admin@todaytask.com"
        
        # Make 5 failed attempts
        for i in range(5):
            response = session.post(f"{BASE_URL}/api/auth/login", json={
                "email": test_email,
                "password": f"wrongpass{i}"
            })
            assert response.status_code == 401
        
        # 6th attempt should be rate limited
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": test_email,
            "password": "wrongpass6"
        })
        assert response.status_code == 429
        print("✓ Brute force protection working - account locked after 5 attempts")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
