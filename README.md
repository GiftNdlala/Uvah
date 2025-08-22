# 🛰️ Uvah? — “Where are you?”

A GPS-based **friends & family safety + social location app** designed for South African communities.
Simple, township-friendly, and built to answer one question: **Uvah? (Where are you?)**

---

## 🚀 Vision
Uvah? is an **independent location-sharing and safety app** for everyday South Africans.
It is **not** tied to community patrol structures — instead, it’s about:

* Staying connected with **friends and family**
* **Lightweight safety features** that work even on low-end devices
* Township-friendly UX (data-lite, easy to use, local slang branding)

---

## 🏗️ Architecture Overview

### Current MVP (Live in Codebase)

#### 1. **Backend**
- **Django REST API** for alerts and live location tracking
- **Alert Model:** severity, status, trigger source, live view token
- **AlertLocation Model:** latitude, longitude, accuracy, timestamp
- **API Endpoints:**
  - Create alert (`/api/alerts`)
    - Add location to alert (`/api/alerts/<id>/locations`)
      - Get alert details + latest location (`/api/alerts/<id>`)
        - Live location polling (`/api/live/<token>/latest`)
        - **Live Map Webpage:** Real-time location for an alert (Leaflet.js)
        - **Admin Panel:** Manage alerts and locations
        - **Database:** SQLite (Postgres planned)

        #### 2. **Mobile App**
        - **React Native App** (`App.js`)
        - **SOS Flow:** Start SOS, create alert, send location updates
        - **Share Link:** Live tracking link for WhatsApp/SMS
        - **UI:** Simple, check-in and SOS features

        #### 3. **Dev Setup**
        - **Dockerfile** for backend API
        - **docker-compose.yml** (referenced, not fully implemented)

        ---

        ### Planned Features & Transition Roadmap

        #### Backend Services (Planned)
        - **Auth Service:** Phone number + OTP, JWT, device binding
        - **User & Contacts Service:** Profiles, friend requests, groups, emergency contacts
        - **Location Service:** Last-known location, live streaming, location history
        - **Notification Service:** Push (FCM/APNs), SMS fallback, in-app alerts
        - **SOS / Alerts Service:** Panic button event pipeline, broadcast, escalation
        - **Analytics Service:** Anonymized stats, no long-term personal location storage

        #### Data Layer (Planned)
        - **PostgreSQL** — relational DB for users, groups, consents
        - **Redis** — live location cache, session store, rate limits
        - **S3 / MinIO** — profile pictures and media attachments

        #### Infrastructure (Planned)
        - **API Gateway:** FastAPI or Node.js REST + WebSocket endpoints
        - **Containerization:** Docker + Kubernetes
        - **Message Queue:** RabbitMQ or Kafka
        - **Hosting:** Cloud-agnostic

        #### Security & Privacy (Planned)
        - End-to-end TLS encryption
        - Granular consent for location sharing
        - Panic SOS bypasses privacy filters
        - Location TTLs + auto-purge
        - POPIA-compliant data handling

        ---

        ## 📲 Core User Flows

        ### Implemented
        - **SOS Alert:** Start SOS, send location, share live tracking link
        - **Live Map:** View real-time location for an alert

        ### Planned
        - **Sign Up / Login:** Phone number, OTP, profile creation
        - **Add Friends / Family:** Invite via phonebook, QR, referral link
        - **Live Location Sharing:** Toggle, select viewers, data-lite mode
        - **Check-In:** One-tap “I’ve arrived”
        - **Groups:** Temporary group maps, auto-expire

        ---

        ## 🛠️ Development Setup

        1. **Clone the repo**
           ```bash
              git clone https://github.com/YOUR_ORG/uvah.git
                 cd uvah
                    ```

                    2. **Backend Setup**
                       ```bash
                          cd backend-api
                             docker-compose up
                                # Runs API (SQLite for now)
                                   ```

                                   3. **Frontend Setup**
                                      ```bash
                                         cd mobile-app
                                            npm install
                                               npm start
                                                  ```

                                                  ---

                                                  ## 🧪 Testing

                                                  - (Planned) Unit tests with Jest (frontend) and PyTest/Jest (backend)
                                                  - (Planned) End-to-end tests with Cypress or Detox
                                                  - (Planned) Load testing for socket scaling (Locust / K6)

                                                  ---

                                                  ## 📈 Roadmap

                                                  ## 📈 Technical Roadmap

                                                  ### Phase 1: MVP (Live)
                                                  - SOS alert creation and live location sharing (mobile + backend)
                                                  - Simple check-in and live map (web)
                                                  - SQLite database, Dockerized backend
                                                  - Basic React Native mobile app

                                                  ### Phase 2: Core Features & Auth
                                                  - Phone number + OTP authentication (backend & mobile)
                                                  - User profiles, contacts, and groups
                                                  - Switch backend to PostgreSQL
                                                  - Add Redis for live location caching
                                                  - Basic push notification and SMS fallback
                                                  - Data-lite mode (reduced GPS update frequency)

                                                  ### Phase 3: Social & Safety Expansion
                                                  - Group tracking (family, events, trips)
                                                  - Temporary group maps, auto-expire after event
                                                  - Emergency contacts and escalation pipeline
                                                  - Location history (opt-in, TTL-based purge)
                                                  - Analytics service (anonymized stats)
                                                  - Add S3/MinIO for media/profile storage

                                                  ### Phase 4: Infrastructure & Scale
                                                  - API Gateway (FastAPI or Node.js)
                                                  - WebSocket endpoints for live streaming
                                                  - Containerization with Kubernetes
                                                  - Message queue (RabbitMQ/Kafka) for notifications/SMS
                                                  - Cloud-agnostic hosting (AWS, GCP, Azure, local)

                                                  ### Phase 5: Security, Privacy & Compliance
                                                  - End-to-end TLS encryption
                                                  - Granular consent for location sharing
                                                  - Location TTLs + auto-purge (default 24h)
                                                  - POPIA-compliant data handling
                                                  - Panic SOS bypasses privacy filters

                                                  ### Phase 6: Partnerships & Advanced Features
                                                  - External responder integration (security companies, taxi associations)
                                                  - Offline last-known location caching
                                                  - Expiring location links for sharing
                                                  - Advanced battery and data usage analytics

                                                  ---

                                                  ## 📈 Roadmap (Summary)

                                                  * [x] Phase 1: MVP — SOS, live location, check-in
                                                  * [ ] Phase 2: Auth, profiles, groups, push/SMS, PostgreSQL/Redis
                                                  * [ ] Phase 3: Group tracking, analytics, S3/MinIO, escalation
                                                  * [ ] Phase 4: API Gateway, WebSockets, Kubernetes, MQ, cloud hosting
                                                  * [ ] Phase 5: Security, privacy, POPIA compliance
                                                  * [ ] Phase 6: Partnerships, offline features, advanced analytics

                                                  ---

                                                  ## 🤝 Contribution

                                                  Pull requests welcome. Please open an issue first to discuss major changes.

                                                  ---

                                                  ## 📜 License

                                                  MIT License (or adjust to preferred license).

                                                  ---

                                                  👉 Uvah? is a **standalone architecture** for South African safety/location sharing. See roadmap for transition plans.
