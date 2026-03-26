# ResQNet 2.0 - Enhanced Features Documentation

## Overview
ResQNet 2.0 introduces comprehensive disaster response coordination features including dual-role user access, real-time photo uploads, comments system, and intelligent alert status tracking.

---

## 🎯 Key Features

### 1. **Dual-Role User Access**

#### Public Access (Anonymous)
- **Entry Point**: Click "Public Access" on home page
- **Capabilities**:
  - View all active alerts in real-time
  - Access emergency resources and their locations
  - Submit emergency reports
  - Browse resource information (hospitals, shelters, rescue teams)
- **No Authentication Required**: Immediate access for rapid reporting
- **Use Case**: Citizens reporting disasters without needing credentials

#### Officials Access (Authenticated)
- **Entry Point**: Click "Officials Login" on home page
- **Authentication Options**:
  - Login with email/password if already registered
  - Register as new official with name, email, password
- **Exclusive Capabilities**:
  - Mark alerts as "Solved" or revert to "Active"
  - Delete alerts entirely
  - Add comments to alerts (visible to all)
  - Delete own comments
  - Upload crisis photos from device or camera
  - Filter alerts by status (All, Active, Solved)
  - View all comments and discussion history
- **Use Case**: Disaster management officials coordinating response efforts

---

### 2. **Alert Management with Status Tracking**

#### Alert States
- **Active** (🔴): Alert requires immediate attention and response
- **Solved** (✓): Alert has been addressed and resolved

#### Features
- **Real-time Status Updates**: Officials can change alert status instantly
- **Status Filtering**: Public users see all; officials can filter by status
- **Status Tabs**: Easy toggle between Active/Solved/All alerts
- **Persistent Storage**: Status changes stored in MongoDB
- **Color-Coded Indicators**: Visual status indicators on alert cards

#### Example Workflow
```
1. Citizen reports flood alert (Auto status: Active)
2. Official receives notification, reviews alert
3. Official uploads crisis photos and adds comment: "Evacuation ordered"
4. Official marks alert as "Solved" when situation is under control
5. Alert moves to "Solved" tab; new citizens see it as handled
```

---

### 3. **Photo Upload System**

#### Capabilities
- **Multiple Upload Sources**:
  - **Camera Access**: Direct camera capture (if device permits)
  - **File Upload**: Device photo/media library selection
  - **Automatic Fallback**: Shows file picker if camera unavailable
- **Base64 Encoding**: Photos stored as base64 in MongoDB (no separate file server needed)
- **Captions**: Optional description for each photo
- **Photo Display**: Photos shown in alert detail view with upload timestamp

#### Technical Details
- **File Type**: Accepts `image/*` (all image formats)
- **Storage**: MongoDB document embedded as base64 string
- **No Size Limits**: Backend accepts data URLs of any size
- **Browser Compatibility**: Works on desktop, tablet, mobile

#### Usage Example
```javascript
// Frontend: User clicks upload, selects/captures image
// Image converted to base64 via FileReader
// Sent as JSON: { photo: "data:image/jpeg;base64,...", caption: "Flooded area" }
// Backend stores in comments collection with alert_id reference
```

---

### 4. **Comments & Discussion System**

#### Features
- **Officials-Only**: Only authenticated officials can post comments
- **Public Visibility**: All discussions visible to both public and officials
- **Comment Metadata**: Shows official name and timestamp per comment
- **Delete Authority**: Officials can delete their own comments
- **Real-time Updates**: Comments display updates when viewing alert details

#### Data Structure
```json
{
  "alert_id": 1,
  "type": "comment",
  "text": "Evacuation in progress. 200 people moved to shelter.",
  "official_id": "507f1f77bcf86cd799439011",
  "created_at": "2024-01-15T14:30:00"
}
```

#### Workflow Example
```
1. Alert detail view shows existing comments
2. Official writes comment in text area
3. Click "Post Comment" button
4. Comment appears immediately with official's info
5. Official can delete comment with red "Delete" button
```

---

### 5. **Home Page with Role Selection**

#### Landing Interface
```
┌─────────────────────────────────────────┐
│         🚨 RESQNET               │
│  Disaster Response Coordination Platform  │
├─────────────────────────────────────────┤
│                                           │
│  ┌──────────────┐    ┌──────────────┐    │
│  │ 👤 PUBLIC    │    │ 🔐 OFFICIALS │    │
│  │ ACESS        │    │ LOGIN        │    │
│  │ (No login)   │    │ (Registered) │    │
│  └──────────────┘    └──────────────┘    │
│                                           │
└─────────────────────────────────────────┘
```

#### Features
- **Immediate Selection**: Two clear buttons for different user types
- **No Account Required for Public**: Direct access to emergency features
- **Registration**: Officials can register inline during login
- **Session Persistence**: Login stored in localStorage; users stay logged in across page refreshes

---

### 6. **Authentication System**

#### Login Flow
```
Login Form → Email + Password → Backend Validation → Session Token Created → Stored in Browser
```

#### Registration Flow
```
Register Form → Email + Password + Name → Password Hashing → Official Created → Stored in MongoDB
```

#### Technical Details
- **Password Security**: Hashed using `werkzeug.security.generate_password_hash` (Argon2)
- **Session Tokens**: 32-byte secure random tokens
- **Token Expiry**: 24-hour expiration for security
- **Storage**: Tokens stored in `sessions` MongoDB collection
- **Header Authentication**: Token passed as `Authorization: Bearer {token}`

#### Endpoints
- `POST /auth/register`: Register new official (email, name, password)
- `POST /auth/login`: Login with credentials (email, password)
- `POST /auth/logout`: Revoke session token (requires header auth)

---

### 7. **Database Schema Enhancements**

#### New Collections

**officials** (Officials User Accounts)
```javascript
{
  _id: ObjectId,
  email: "official@resqnet.org",
  password: "$2b$12$hashed...",
  name: "John Officer",
  created_at: "2024-01-15T10:00:00"
}
```

**comments** (Alerts Discussion + Photos)
```javascript
{
  _id: ObjectId,
  alert_id: 1,
  type: "comment" or "photo",
  text: "Evacuation in progress",           // For comments
  data: "data:image/jpeg;base64,...",     // For photos
  caption: "Flooded residential area",      // For photos
  official_id: "507f1f77bcf86cd799439011",
  created_at: "2024-01-15T14:30:00",
  uploaded_at: "2024-01-15T14:30:00"        // For photos
}
```

**sessions** (Official Session Management)
```javascript
{
  token: "secure_random_token_32bytes",
  official_id: "507f1f77bcf86cd799439011",
  email: "official@resqnet.org",
  created_at: "2024-01-15T14:30:00",
  expires: "2024-01-16T14:30:00"
}
```

#### Enhanced alerts Collection
```javascript
{
  id: 1,                          // Legacy ID field
  type: "Flood",
  location: "Agra South Zone",
  message: "Move to higher ground",
  severity: "High",
  status: "active",               // NEW: active|solved
  timestamp: "2024-01-15T10:00:00",
  updated_at: "2024-01-15T14:30:00", // NEW: Last status change
  photos: ["507f1f77bcf86cd799439011", ...], // NEW: Photo ObjectIds
  comments_count: 5               // Cached for UI
}
```

---

## 🚀 API Endpoints

### Authentication (Public)
| Method | Endpoint | Body | Returns |
|--------|----------|------|---------|
| POST | `/auth/register` | `{email, password, name}` | `{official, message}` |
| POST | `/auth/login` | `{email, password}` | `{token, official}` |
| POST | `/auth/logout` | - | `{message}` |

### Alerts (Public Read, Official Write)
| Method | Endpoint | Auth Required | Functionality |
|--------|----------|---------------|---------------|
| GET | `/api/alerts` | No | List all alerts; supports `?status=active` filter |
| GET | `/api/alerts/:id` | No | Get single alert with all data |
| POST | `/api/alerts` | No | Create public alert (no auth needed) |
| PATCH | `/api/alerts/:id/status` | Yes | Update alert status (Active/Solved) |
| DELETE | `/api/alerts/:id` | Yes | Delete alert and all associated comments |

### Photos (Official Only)
| Method | Endpoint | Auth Required | Body |
|--------|----------|---------------|------|
| POST | `/api/alerts/:id/photos` | Yes | `{photo: "base64...", caption: string}` |

### Comments (Public Read, Official Write)
| Method | Endpoint | Auth Required | Body |
|--------|----------|---------------|------|
| GET | `/api/alerts/:id/comments` | No | - |
| POST | `/api/alerts/:id/comments` | Yes | `{text: string}` |
| DELETE | `/api/comments/:id` | Yes | - |

### Resources & Reports (Public)
| Method | Endpoint | Functionality |
|--------|----------|---------------|
| GET | `/api/resources` | List hospitals, shelters, rescue teams |
| GET | `/api/reports` | Get submitted citizen reports |
| POST | `/api/reports` | Submit emergency report with location, description |

---

## 🎮 User Interface Walkthrough

### 1. Home Page
- User selects "Public Access" or "Officials Login"
- Clear distinction between anonymous and authenticated workflows

### 2. Public Flow (Anonymous)
```
Home → Public Access → Dashboard
├─ Alerts Tab (View all, check status, read comments)
├─ Resources Tab (Find hospitals, shelters, distances)
└─ Reports Tab (Submit incident report)
```

### 3. Officials Flow (Authenticated)
```
Home → Officials Login/Register → Dashboard
├─ Alerts Tab (View all, filter by status, view/add comments)
│   └─ Alert Detail (Upload photos, change status, delete)
├─ Resources Tab (Same as public)
└─ Reports Tab (Submit additional reports as official)
```

### 4. Alert Card (Dashboard)
```
┌─────────────────────────────────┐
│ Flood (Red Status Bar)           │
│ 📍 Agra South Zone               │
│ Status: 🔴 Active / ✓ Solved     │
│ Severity: High                   │
│ Message: "Move to higher ground" │
│ 📷 3 photos                       │
│ Time: Jan 15, 10:30 AM          │
│                                  │
│ [View Details Button]            │
└─────────────────────────────────┘
```

### 5. Alert Detail Modal (Click "View Details")
```
┌─────────────────────────────────────────┐
│ X (Close)                               │
├─────────────────────────────────────────┤
│ Flood - Agra South Zone                 │
│ Status: 🔴 Active / ✓ Solved            │
│ Severity: High                          │
│                                         │
│ 📷 PHOTOS (3)                           │
│ ├─ Flooded street [View Details] [Date] │
│ ├─ Submerged vehicles [Delete]          │
│ └─ Missing persons sign [Delete]        │
│                                         │
│ 💬 COMMENTS (2)                         │
│ ├─ "Evacuation in progress" [Delete]    │
│ └─ "Shelter opened at..." [Delete]      │
│                                         │
│ [✏️ OFFICIALS SECTION - Hidden if Public]│
│ ├─ [✓ Mark as Solved] [Revert-Active]   │
│ ├─ [🗑️ Delete Alert]                    │
│ ├─ Add Comment [Text Area] [Post]       │
│ ├─ Upload Photo [File] [Caption] [Upload]│
│ └─                                      │
└─────────────────────────────────────────┘
```

---

## 🔐 Security Features

1. **Password Hashing**: Argon2 (via werkzeug)
2. **Token Authentication**: Secure random 32-byte tokens
3. **Expiring Sessions**: 24-hour token validity
4. **Authorization Guards**: `@require_official` decorator on all official-only endpoints
5. **No Plain Passwords**: All stored hashed in database
6. **CORS Enabled**: Frontend and backend communication allowed

---

## 📊 Data Flow Diagram

```
PUBLIC USER                              OFFICIAL USER
    │                                         │
    ├─→ [Home Page]                          ├─→ [Home Page]
    │       ↓                                  │       ↓
    ├─→ [Public Access] ←─┐         [Officials Login] ←─┐
    │       ↓              │              ↓              │
    ├─→ [Get All Alerts] ──┤        [Register/Login]      │
    │       ↓              │              ↓              │
    ├─→ [View Resources] ──┤        [Create Session]      │
    │       ↓              │              ↓              │
    ├─→ [Submit Report] ───┤        [Token Stored] ──────┤
    │       ↓              │              ↓              │
    └─→ [View Comments] ──┴─        [View All Data]       │
                              +      [Manage Status]       │
                              +      [Upload Photos]       │
                              +      [Post Comments]       │
                              +      [Delete Content]      │
                              +      [Logout & Clear]      │
                              └───────────────────────────→
```

---

## 🛠️ Technical Implementation

### Backend (Flask + MongoDB)
- **Framework**: Flask 3.0.0
- **Database**: MongoDB (PyMongo 4.10.1)
- **Authentication**: werkzeug password hashing + custom token system
- **Deployment**: Gunicorn (production WSGI server)
- **API Format**: RESTful JSON

### Frontend (Vanilla JavaScript)
- **Session Storage**: localStorage for auth tokens
- **File Handling**: FileReader API for photo upload (base64 conversion)
- **Camera Access**: getUserMedia API (graceful fallback)
- **DOM Updates**: Vanilla JavaScript (no framework)
- **Styling**: CSS3 with responsive design

### Infrastructure
- **Containerization**: Docker with multi-stage builds
- **Orchestration**: Kubernetes (2 replicas, rolling updates)
- **CI/CD**: GitHub Actions (build, test, docker-build, deploy)
- **IaC**: Terraform for AWS infrastructure + K8s namespace

---

## 📱 Responsive Design

- **Desktop** (1200px+): Full multi-column layout, all features visible
- **Tablet** (768px-1199px): 2-column alerts grid, stacked forms
- **Mobile** (< 768px): Single column, full-width inputs, touch-friendly buttons

---

## ✅ Testing Scenarios

### Scenario 1: Public User Alert Viewing
```
1. Open ResQNet in browser
2. Click "Public Access"
3. View "Alerts" tab → See all active alerts
4. Click "View Details" on any alert
5. Read comments from multiple officials
6. See photos uploaded by officials
```

### Scenario 2: Official Login & Management
```
1. Click "Officials Login"
2. Click "Register here" (first time)
3. Enter name, email, password, confirm
4. Auto-redirected to login form
5. Login with email/password
6. See status filter tabs (All, Active, Solved)
7. Click alert → See photos, comments
8. Upload photo (click file, select image)
9. Add comment in text area
10. Mark as "Solved"
11. Comment shows "By Official" • timestamp
12. Click logout → Return to home page
```

### Scenario 3: Alert Lifecycle
```
1. Citizen reports "Flood" alert (status auto: active)
2. System stores alert in MongoDB
3. Official logs in, sees alert in "Active" tab
4. Official uploads 3 crisis photos
5. Official comments: "Evacuation ordered"
6. Official comments: "Shelter opened at City Hall"
7. Official changes status to "Solved"
8. Alert moves to "Solved" tab
9. Public users see status indicator changed to ✓
10. Future disasters use this data for analysis
```

---

## 🚀 Deployment Checklist

- [ ] MongoDB URI configured in GitHub Secrets
- [ ] Secret key for password hashing set
- [ ] Docker image built and pushed to Docker Hub
- [ ] Kubernetes cluster running with resqnet namespace
- [ ] Frontend API_BASE_URL matches backend endpoint
- [ ] Health check endpoint `/health` responding
- [ ] SSL/TLS certificates installed (if production)
- [ ] Backup MongoDB before major operations

---

## 📝 Future Enhancements

1. **JWT Integration**: Migrate from token storage to JWT with refresh tokens
2. **Photo Optimization**: Image compression, CDN storage
3. **Real-time Updates**: WebSocket for live alert notifications
4. **SMS Alerts**: Twillio integration for critical alerts
5. **Map Integration**: Google Maps for resource location visualization
6. **Analytics Dashboard**: Alert response metrics, official performance
7. **Multi-language Support**: Localization for different regions
8. **Disaster Prediction**: ML model to predict disaster hotspots
9. **API Rate Limiting**: Prevent abuse with token bucket algorithm
10. **Audit Logging**: Track all critical actions by officials

---

## 📞 Support & Documentation

- **API Docs**: Open ResQNet in browser, visit `/` for endpoint list
- **Health Check**: `GET /health` returns system status and DB connection
- **Database**: MongoDB Atlas or self-hosted (`MONGO_URI` env variable)
- **Containers**: Docker Compose for local dev, Kubernetes for production

---

**ResQNet 2.0** - Coordinating disaster response, one alert at a time. 🚨
