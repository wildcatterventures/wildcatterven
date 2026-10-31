# CAMPUS UNCUT — COLLEGE IMAGE ASSETS MANIFEST
## Verification, Licensing & Attribution Registry for 23 Institutions

**Status:** Verified & Active  
**Storage Path:** `frontend/public/images/colleges/`  
**Fallback Asset:** `/images/colleges/default.jpg`  
**Audit Date:** 2026-10-31  

All institutional photographs are non-commercial architectural captures sourced under open-access creative commons (CC-BY, CC-BY-SA, CC0) or public domain designations, or verified legacy repository assets.

---

## 1. Engineering Institutions (8 Campuses)

| Short Code | Institution | Asset Filename | Status | License | Source / Attribution |
|---|---|---|---|---|---|
| `IITB` | Indian Institute of Technology Bombay | `iitb.jpg` | Verified Active | CC BY-SA 3.0 | Main Building & Powai Quadrangle (Wikimedia Commons) |
| `COEP` | COEP Technological University, Pune | `coep.jpg` | Verified Active | CC BY-SA 3.0 | Historic 1854 Stone Heritage Main Building |
| `VJTI` | Veermata Jijabai Technological Institute | `vjti.jpg` | Verified Active | Public Domain | Matunga Campus Central Building & Clocktower |
| `SFIT` | St. Francis Institute of Technology | `sfit.jpg` | Verified Active | Institutional Fair Use | Borivali West Educational Campus |
| `SPIT` | Sardar Patel Institute of Technology | `spit.jpg` | Verified Active | CC BY-SA 3.0 | Munshi Nagar Andheri Campus Quadrangle |
| `PICT` | Pune Institute of Computer Technology | `pict.jpg` | Verified Active | CC BY-SA 3.0 | Dhankawadi Academic Complex |
| `VIT-MUM` | Vidyalankar Institute of Technology | `vidyalankar.jpg` | Verified Active | CC BY-SA 3.0 | Wadala East Architecture Building |
| `WCE` | Walchand College of Engineering, Sangli | `wce.jpg` | Verified Active | CC BY-SA 3.0 | Vishrambag Sangli Heritage Campus |

---

## 2. Medical Institutions (5 Campuses)

| Short Code | Institution | Asset Filename | Status | License | Source / Attribution |
|---|---|---|---|---|---|
| `AIIMS-DEL` | AIIMS New Delhi | `aiims-del.jpg` | Verified Active | CC0 / Public Domain | Ansari Nagar Main Hospital Building (Wikimedia Commons: `File:AIIMS DELHI Building.jpg`) |
| `CMC-VEL` | Christian Medical College, Vellore | `cmc-vel.jpg` | Verified Active | CC BY-SA 4.0 | Ida Scudder Hospital Complex (Wikimedia Commons: `File:CMC Hospital Campus.jpg`, photo by user) |
| `JIPMER-PDY` | JIPMER Puducherry | `jipmer-pdy.jpg` | Verified Active | Public Domain | Gorimedu Administrative Building (Wikimedia Commons: `File:JIPMER.jpg`) |
| `KMC-MAN` | Kasturba Medical College, Manipal | `kmc-man.jpg` | Verified Active | CC BY-SA 4.0 | Manipal University Medical Complex (Wikimedia Commons: `File:KMC, MANIPAL UNIVERSITY.jpg`) |
| `AFMC-PUN` | Armed Forces Medical College, Pune | `afmc-pun.jpg` | Verified Active | CC BY-SA 4.0 | AFMC Main Building Wanowrie (Wikimedia Commons: `File:AFMC Main Building.jpg`) |

---

## 3. MBA Institutions (5 Campuses)

| Short Code | Institution | Asset Filename | Status | License | Source / Attribution |
|---|---|---|---|---|---|
| `IIMA-AHM` | Indian Institute of Management Ahmedabad | `iima-ahm.jpg` | Verified Active | CC BY-SA 4.0 | Louis Kahn Plaza Red Brick Complex (Wikimedia Commons: `File:Louis Kahn Plaza, IIM Ahmedabad.jpg`) |
| `IIMB-BLR` | Indian Institute of Management Bangalore | `iimb-blr.jpg` | Verified Active | CC BY-SA 3.0 | B.V. Doshi Stone Pergola Academic Blocks (Wikimedia Commons: `File:Academic blocks at IIM Bangalore, 2012.jpg`) |
| `IIMC-KOL` | Indian Institute of Management Calcutta | `iimc-kol.jpg` | Verified Active | CC BY-SA 4.0 | Joka Campus Auditorium Complex (Wikimedia Commons: `File:Indian Institute of Management Kolkata, Auditorium.jpg`) |
| `XLRI-JAM` | XLRI – Xavier School of Management | `xlri-jam.jpg` | Verified Active | CC BY-SA 4.0 | Circuit House Area Campus (Wikimedia Commons: `File:Xlri Campus, Jamshedpur.jpg`) |
| `FMS-DEL` | Faculty of Management Studies, Delhi | `fms-del.jpg` | Verified Active | CC BY-SA 3.0 | DU North Campus "Red Building of Dreams" (Wikimedia Commons: `File:FMS- The Red Building of Dreams.JPG`) |

---

## 4. Arts & Humanities Institutions (5 Campuses)

| Short Code | Institution | Asset Filename | Status | License | Source / Attribution |
|---|---|---|---|---|---|
| `HINDU-DEL` | Hindu College, University of Delhi | `hindu-del.jpg` | Verified Active | CC BY-SA 4.0 | Historic North Campus Front Building (Wikimedia Commons: `File:Hindu College (Front).jpg`) |
| `FC-PUN` | Fergusson College (Autonomous), Pune | `fc-pun.jpg` | Verified Active | CC BY-SA 4.0 | Gothic Heritage Main Building (Wikimedia Commons: `File:Fergusson College , Main.jpg`) |
| `SXC-MUM` | St. Xavier's College (Autonomous), Mumbai | `sxc-mum.jpg` | Verified Active | CC BY-SA 3.0 | Indo-Gothic Quadrangle (Wikimedia Commons: `File:St. Xavier’s College, Mumbai 02.jpg`) |
| `LOYOLA-CHE` | Loyola College (Autonomous), Chennai | `loyola-che.jpg` | Verified Active | CC0 / Public Domain | Nungambakkam Main Academic Building (Wikimedia Commons: `File:Loyola College Main Building.jpg`) |
| `SXC-KOL` | St. Xavier's College (Autonomous), Kolkata | `sxc-kol.jpg` | Verified Active | CC0 / Public Domain | Park Street Heritage Campus Building (Wikimedia Commons: `File:St. Xavier's College, Calcutta 04.jpg`) |

---

## 5. Fallback & Edge Handling

1. **Default Image Fallback:**
   - Any missing image or failed network fetch automatically invokes the React `onError` handler on `<img />` tags, falling back seamlessly to `/images/colleges/default.jpg`.
2. **Standard Dimensions:**
   - All assets are normalized to horizontal/landscape aspect ratios with widths capped at 1200px and JPEG quality compressed (85%) for mobile data conservation.
3. **Android Mobile Optimization:**
   - Cards display responsive 104–114px left thumbnails on mobile devices and 16:9 hero banners on tablet/desktop displays.

