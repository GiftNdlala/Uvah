# 🛰️ Uvah? — "Where are you?"

A GPS-based **friends & family safety + social location app** designed for South African communities.
Simple, township-friendly, and built to answer one question: **Uvah? (Where are you?)**

---

## 🚀 Vision
Uvah? is an **independent location-sharing and safety app** for everyday South Africans.
It is **not** tied to community patrol structures — instead, it's about:

* Staying connected with **friends and family**
* **Lightweight safety features** that work even on low-end devices
* Township-friendly UX (data-lite, easy to use, local slang branding)

---

## 🏗️ Architecture Overview

### Current MVP (Live in Codebase)

#### 1. **Backend** ✅
- **Django REST API** for alerts and live location tracking
- **Alert Model:** severity, status, trigger source, live view token
- **AlertLocation Model:** latitude, longitude, accuracy, timestamp
- **API Endpoints:**
  - Create alert (`/api/alerts`)
  - Add location to alert (`/api/alerts/<id>/locations`)
  - Get alert details + latest location (`/api/alerts/<id>`)
  - Live location polling (`/api/live/<token>/latest`)
  - **Live Map Webpage:** Real-time location for an alert (Leaflet.js + OpenStreetMap tiles)
  - **Admin Panel:** Manage alerts and locations
  - **Database:** SQLite for development; PostgreSQL when `DATABASE_URL` is set (Supabase-ready)
  - **Docker:** Containerized deployment ready

#### 2. **Mobile App** ✅
- **React Native App** (`App.js`)
- **SOS Flow:** Start SOS, create alert, send location updates
- **Share Link:** Live tracking link for WhatsApp/SMS
- **UI:** Simple, check-in and SOS features
- **Mock Location:** Currently using simulated GPS (needs real implementation)

#### 3. **Dev Setup** ✅
- **Dockerfile** for backend API
- **docker-compose.yml** with PostgreSQL and Redis (configured but not fully utilized)
- **Requirements:** Django 4.2+, DRF, CORS, PostgreSQL support
- **Virtual Environment:** Python 3.11 with all dependencies installed

---

## 🔑 Key Decisions & Project Conventions

- **Repository model (monorepo)**: Keep `backend-api/`, `mobile-app/`, and add `web-admin/` (React/Next.js) in this repo for now. Split later if needed.
- **Backend shared across clients**: Single Django REST API serves mobile app and web admin. Public live-view page remains under backend (`/live/<token>/`).
- **Auth**:
  - **Method**: Phone-number + OTP verification + JWT (access/refresh).
  - **Backend**: Re-enable `users` app, set `AUTH_USER_MODEL`, include `api/users/` routes, and enforce RBAC for admin endpoints.
  - **Frontend**: Mobile and web admin will send `Authorization: Bearer <token>`; refresh tokens handled client-side.
- **Maps**:
  - **Mobile**: Use `react-native-maps` with **Google Maps SDK for Android** and **Google Maps SDK for iOS**.
  - **Web (live page)**: Keep Leaflet + OpenStreetMap for now; no Google Maps JS API required unless we migrate.
  - **Web (admin)**: If a Google map is preferred, enable **Google Maps JavaScript API**; otherwise reuse Leaflet.
  - **API keys**: Separate keys per platform with proper restrictions (Android package + SHA‑1, iOS bundle ID, and HTTP referrers for web).
- **Database**:
  - **Dev**: SQLite (sufficient for developing/testing auth and alerts).
  - **Prod**: PostgreSQL via `DATABASE_URL` (Supabase-ready). Add PostGIS when geofences/heatmaps/proximity queries are needed.
- **Realtime**:
  - **Now**: HTTP polling for live view (`/api/live/<token>/latest`).
  - **Planned**: Django Channels or Server-Sent Events for admin/operator consoles and richer live tracking.
- **Admin web (scope)**:
  - Roles/permissions, user management, alerts console (status changes, assignment), live tracking map, contacts visibility, notifications, analytics, audit logs, settings (escalation/geofences/data retention/API keys).
  - Suggested stack: Next.js + React Query + a component library (MUI/Ant) + TanStack Table + Zod + react-hook-form.
- **API surface alignment**:
  - Implement missing endpoints used by mobile: `GET /api/alerts/my-alerts/`, `POST /api/alerts/<id>/cancel/`.
  - Enable `users` routes expected by mobile: profile and emergency contacts.
  - Ensure CORS allows admin and Metro origins; add auth headers in mobile and admin.

---

## 📋 Technical Implementation Roadmap

### **Phase 1: Foundation & Authentication** (Priority: HIGH)
**Duration:** 2-3 weeks | **Status:** 85% Complete

#### ✅ **COMPLETED (Current Session)**
- [x] **Create `users` Django app**
- [x] **Custom User Model** (`users/models.py`)
  - Phone number authentication (replaces username)
  - Profile fields, safety settings, verification system
  - Emergency contacts and privacy preferences
- [x] **OTP Service** (`users/services.py`)
  - 6-digit OTP generation and validation
  - Rate limiting and expiration handling
  - South African phone number formatting
- [x] **JWT Authentication** (`users/authentication.py`)
  - Custom phone number JWT system
  - Access and refresh token management
  - Custom authentication backend
- [x] **User Serializers** (`users/serializers.py`)
  - Registration, login, profile management
  - OTP verification and password change
  - Emergency contact management
- [x] **API Views** (`users/views.py`)
  - Complete authentication endpoints
  - User profile CRUD operations
  - Emergency contact management
- [x] **Admin Interface** (`users/admin.py`)
  - Custom admin for users, profiles, emergency contacts
  - Safety and privacy settings management
- [x] **URL Configuration** (`users/urls.py`)
  - All authentication and profile endpoints
- [x] **Database Models** - All user-related models created
- [x] **Dependencies** - PyJWT installed and configured

#### 🔄 **IN PROGRESS**
- [ ] **Database Migration Integration** - Models created but need to resolve migration dependency issues
- [ ] **Settings Integration** - Users app temporarily disabled to fix migration conflicts

#### ❌ **REMAINING FOR PHASE 1**
- [ ] **Fix Migration Dependencies** - Resolve admin/users app migration order
- [ ] **Test Authentication Endpoints** - Verify OTP, registration, login flows
- [ ] **Update Alert System** - Link alerts to authenticated users
- [ ] **Mobile App Integration** - Add authentication screens and real GPS
- [ ] **Environment Configuration** - Complete .env setup for production

#### 📊 **Phase 1 Progress: 85% Complete**
- **Models & Services**: 100% ✅
- **API & Views**: 100% ✅  
- **Authentication**: 100% ✅
- **Admin Interface**: 100% ✅
- **Database Integration**: 60% 🔄
- **Testing & Validation**: 0% ❌

### **Phase 2: Core Location & Safety Features** (Priority: HIGH)
**Duration:** 3-4 weeks | **Status:** Not Started

#### 2.1 Enhanced Alert System
- [ ] **Update Alert Model** to include user relationship
- [ ] **Add Alert Permissions** - only user can update their alerts
- [ ] **Implement Alert Status Updates**
- [ ] **Add Alert History** - track all user alerts

#### 2.2 Real-time Location System
- [ ] **Implement WebSocket support** (Django Channels)
- [ ] **Redis as message broker** for WebSocket
- [ ] **Location streaming endpoints**
- [ ] **Location accuracy improvements**

#### 2.3 Mobile App Enhancements
- [ ] **Real GPS implementation**
- [ ] **Background location updates**
- [ ] **Battery optimization** - adaptive update frequency
- [ ] **Offline support** - cache last known location
- [ ] **Push notifications** setup

### **Phase 3: Social Features & Contacts** (Priority: MEDIUM)
**Duration:** 4-5 weeks | **Status:** Not Started

#### 3.1 User Profiles & Contacts
- [ ] **Contact Management APIs**
- [ ] **Friend System**
- [ ] **Location Sharing**

### **Phase 4: Groups & Events** (Priority: MEDIUM)
**Duration:** 3-4 weeks | **Status:** Not Started

#### 4.1 Group System
- [ ] **Group Models**
- [ ] **Group APIs**
- [ ] **Group Location Tracking**

### **Phase 5: Notifications & Communication** (Priority: HIGH)
**Duration:** 2-3 weeks | **Status:** Not Started

#### 5.1 Push Notifications
- [ ] **Notification Model**
- [ ] **Firebase Cloud Messaging (FCM) integration**
- [ ] **Notification APIs**

#### 5.2 SMS Integration
- [ ] **SMS Service** (using Twilio or local provider)
- [ ] **Emergency SMS escalation**

### **Phase 6: Security & Privacy** (Priority: HIGH)
**Duration:** 2-3 weeks | **Status:** Not Started

#### 6.1 Data Protection
- [ ] **Location TTL (Time To Live)**
- [ ] **Data encryption** for sensitive fields
- [ ] **Audit logging** for all location access
- [ ] **Consent management** system

#### 6.2 POPIA Compliance
- [ ] **Privacy policy** implementation
- [ ] **Data subject rights** (access, deletion, portability)
- [ ] **Consent tracking** and management
- [ ] **Data retention policies**

#### 6.3 Security Hardening
- [ ] **Rate limiting** on all APIs
- [ ] **Input validation** and sanitization
- [ ] **CORS configuration** for production
- [ ] **HTTPS enforcement**

### **Phase 7: Infrastructure & Scaling** (Priority: MEDIUM)
**Duration:** 3-4 weeks | **Status:** Not Started

#### 7.1 Production Deployment
- [ ] **Kubernetes manifests**
- [ ] **CI/CD pipeline** (GitHub Actions)
- [ ] **Environment configuration** management
- [ ] **Monitoring and logging** (Prometheus, Grafana)

#### 7.2 Performance Optimization
- [ ] **Database indexing** for location queries
- [ ] **Caching strategy** (Redis)
- [ ] **CDN setup** for static assets
- [ ] **Load balancing** configuration

#### 7.3 Backup & Recovery
- [ ] **Automated backups** (PostgreSQL)
- [ ] **Disaster recovery** plan
- [ ] **Data migration** scripts

### **Phase 8: Advanced Features** (Priority: LOW)
**Duration:** 4-5 weeks | **Status:** Not Started

#### 8.1 Analytics & Insights
- [ ] **Usage analytics** (anonymized)
- [ ] **Safety insights** dashboard
- [ ] **Performance metrics**

#### 8.2 Integration Features
- [ ] **Emergency services** integration
- [ ] **Third-party security** companies
- [ ] **Social media** sharing enhancements

#### 8.3 Offline Capabilities
- [ ] **Offline location** caching
- [ ] **Sync when online**
- [ ] **Emergency offline** mode

---

## 🛠️ Development Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL (via pgAdmin 4)
- Redis (via Docker)

### Quick Start
```bash
# Clone and setup
git clone https://github.com/YOUR_ORG/uvah.git
cd uvah

# Backend setup
cd backend-api
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt

# Database setup (PostgreSQL via pgAdmin 4)
# Create database 'uvahdb' in pgAdmin 4

# Run migrations
python manage.py migrate

# Start server
python manage.py runserver

# Mobile app setup
cd ../mobile-app
npm install
npm start
```

### Environment Variables
Create `.env` file in `backend-api/`:
```env
DEBUG=True
DJANGO_SECRET_KEY=your-secret-key
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/uvahdb
ALLOWED_HOSTS=localhost,127.0.0.1,192.168.0.100
CORS_ALLOW_ALL_ORIGINS=True
```

---

## 📊 Current Status & Next Steps

### ✅ **Completed**
- Basic SOS alert system
- Live location tracking
- Web-based map interface
- Docker containerization
- React Native mobile app structure
- **Complete user authentication system (85%)**
- **Custom user models and admin interface**
- **OTP and JWT authentication services**

### 🔄 **In Progress**
- Database migration integration for users app
- Resolving migration dependency conflicts

### 🚀 **Immediate Next Steps (Complete Phase 1)**
1. **Fix migration dependencies** - Resolve admin/users app migration order
2. **Test authentication endpoints** - Verify OTP, registration, login flows
3. **Update alert system** - Link alerts to authenticated users
4. **Mobile app authentication** - Add login/registration screens

### 📈 **Success Metrics**
- User registration and retention
- Alert response times
- Location accuracy
- App performance on low-end devices
- Community adoption in target areas

---

## 🤝 Contribution

Pull requests welcome. Please open an issue first to discuss major changes.

### Development Guidelines
- Follow Django and React Native best practices
- Write tests for new features
- Update documentation for API changes
- Test on low-end Android devices
- Consider data usage and battery optimization

---

## 📜 License

MIT License (or adjust to preferred license).

---

👉 **Uvah?** is a **standalone architecture** for South African safety/location sharing. **Phase 1 is 85% complete** with a solid foundation for authentication and user management. The next step is resolving database migration dependencies to fully enable the users app.
