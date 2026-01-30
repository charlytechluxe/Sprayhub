# SprayHub Project Progress Tracker

## Ecosystem Overview
- **Client App (PWA)**: Mobile-first React app for climbers.
- **Admin Hub (Native Mac)**: Desktop app for coaches (Tauri).
- **Backend**: Supabase (DB, Auth, Storage).

## Feature Pipeline

| Feature | Platform | Status | Notes |
| :--- | :--- | :--- | :--- |
| **Architecture** | Ecosystem | ✅ Done | Reorganized into `apps/client-pwa` and `apps/admin-hub` |
| **Database Schema** | Backend | ✅ Done | Polygonal Pro structure (JSONB) implemented |
| **Instance Segmentation** | Backend | ✅ SAM 2 | Automatic grid scan with high-fidelity polygons |
| **Supabase Integration** | Ecosystem | ✅ Active | Credentials configured and .env files set |
| **Admin Hub (Native)** | Admin | 🚧 Dev | Electron project initialized with Sidebar & Dashboard |
| **Wall Management** | Admin | 🔄 In Progress | UI started, logic for 4K upload pending |
| **Route Moderation** | Admin | 🔄 In Progress | UI started, dashboard mock ready |
| **Gym Config** | Admin | ⏳ Pending | Custom grades & hold types |
| **Training Folders** | Admin | ⏳ Pending | Per-user training assignment |
| **Intégration Photo & Canvas** | Client | ✅ Done | HD Wall integrated, percentage coords, Zoom & Pan calibrated |
| **Canvas HD** | Client | ✅ Done | Zoom/Pan + Tactile hit areas + Annotations |
| **Annotations** | Client | ✅ Done | Display integrated into canvas |
| **Community** | Client | ⏳ Pending | Library, Filters, Likes, Logbook |
| **Auto-Grading** | Client | 🔄 In Progress | Voting UI added to RoutesPage |
| **Sponsoring** | Client | ✅ Done | Partner logo slot on HomePage |

## UI Comparison Table

| Screen/Component | Option A | Option B | Selected | Rationale |
| :--- | :--- | :--- | :--- | :--- |
| Mobile Canvas Controls | Floating Fab | Bottom Sheet | Option B | Bottom sheet provides better tactile access for annotations |
| Admin Dashboard | Sidebar Navigation | Top Tabs | Option A | Sidebar is standard for data-heavy desktop apps |
| HD Zoom Implementation | Native CSS Zoom | SVG Transform | SVG Transform | Better performance with pan-zoom-pinch library |

## Project Rules Alignment
- ✅ Native Dark Mode
- ✅ 44px min button size
- ✅ 100dvh for mobile
- ✅ Disabled pull-to-refresh on canvas
