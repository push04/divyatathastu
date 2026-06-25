# 📋 Client Request — Deep Feature Audit
**Date:** 24 June 2026 | **Auditor:** Antigravity  
**Scope:** All 10 client-requested areas — Ebooks, Live Video, Temples, Shop, Nakshatra Report, Social, Contact/Bank, Booking, AI Report Background, Ardra Jalam

---

## Quick Summary

| # | Feature Area | Status | Issues Found |
|---|---|---|---|
| 1 | Ebooks | ⚠️ Partial | 5 bugs |
| 2 | Live Video | 🔴 Missing | 3 bugs |
| 3 | Temples (All India) | ⚠️ Partial | 6 bugs |
| 4 | Shop / Product Images | ⚠️ Partial | 7 bugs |
| 5 | Nakshatra Report (Ganpati + Yantra) | ⚠️ Partial | 5 bugs |
| 6 | Social Media Links | 🔴 Missing | 3 bugs |
| 7 | Contact + Bank + Consultation Booking 5–9 PM | 🔴 Missing | 6 bugs |
| 8 | Booking Date & Time Bug | 🔴 Bug | 5 bugs |
| 9 | AI Report Background | ⚠️ Visual | 3 bugs |
| 10 | Ardra Jalam — Bold & Big text | 🔴 Bug | 4 bugs |

---

# 1 — 📚 EBOOKS

**Files:** [`/ebooks/page.tsx`](file:///c:/Users/pushp/Downloads/DIVYATATHASTU/divya-tathastu/src/app/(public)/ebooks/page.tsx) · [`EbookCardClient.tsx`](file:///c:/Users/pushp/Downloads/DIVYATATHASTU/divya-tathastu/src/app/(public)/ebooks/EbookCardClient.tsx)

### Bug 1.1 🔴 "Get This Book" / "Download Free" Button Links to `/shop` — Not the Ebook's Own Product Page
```tsx
// EbookCardClient.tsx L166
<Link href="/shop">  // ← WRONG — goes to generic shop, not this book
  {isFree ? 'Download Free' : 'Get This Book'}
</Link>
```
**Impact:** Every ebook card button drops the user into the general shop page. Free ebook downloads have no download mechanism — clicking "Download Free" just opens the shop. Users cannot actually download or purchase any specific ebook from this page.

**Fix:** Link to `/shop?category=ebook` or directly to `/shop/${book.slug}`:
```tsx
<Link href={`/shop/${book.slug}`}>
```
Or for free: hit a download API endpoint that returns a signed URL.

---

### Bug 1.2 🟠 Author is Always Hardcoded as "MahaTathastu" — No Per-Book Author
```typescript
// ebooks/page.tsx L28
author: 'MahaTathastu',  // Always overrides any real author stored in DB
```
The `mapProduct()` function hardcodes the author. If different ebooks have different authors (guest authors, Vedic scholars), this information is lost.

---

### Bug 1.3 🟠 `pages`, `rating`, `reviews` Are Always `null` — Dead UI Elements
```typescript
pages: null as null,    // Never populated
rating: null as null,   // Never populated
reviews: null as null,  // Never populated
```
The `EbookCard` has UI for pages and rating but these are always null, so those UI elements never render. Either populate them from DB or remove the dead UI.

---

### Bug 1.4 🟡 Ebook Cover Image Field Mismatch — `images[0].url` vs `images[0]` (string)
```typescript
// EbookCover L81 (EbookCardClient):
const coverImg = Array.isArray(book.images) && book.images[0]?.url ? book.images[0].url : null

// Shop page L63–67 (getImageUrl):
if (typeof img === 'string') return img    // handles string format
if (img?.url) return img.url               // handles {url:...} format
```
The ebook cover only checks `images[0]?.url` (object format) but not `images[0]` (string format). If images are stored as plain string URLs in DB, the cover image never shows and falls back to the SVG illustration — even though a real image exists in the database.

---

### Bug 1.5 🟡 `deriveCategory()` Uses Regex — "Vastu" in Book Title Gives "Vastu", Not "Astrology" for Mixed Books
If an ebook is titled "Vastu and Astrology", it gets categorized as "Vastu" because `vastu` matches first. The priority order of the checks is arbitrary. Books may appear in the wrong section.

---

# 2 — 🎥 LIVE VIDEO

**File:** [`/events/page.tsx`](file:///c:/Users/pushp/Downloads/DIVYATATHASTU/divya-tathastu/src/app/(public)/events/page.tsx)

### Bug 2.1 🔴 Live Video Section Is Missing — Events Page Only Shows Pre-Recorded Events, No Live Stream
The `/events` page renders a list of scheduled events with Zoom/YouTube locations, but there is:
- **No "Live Now" indicator** for currently streaming events
- **No YouTube Live embed** (no `<iframe>` anywhere in the codebase for live streams)
- **No live status check** (no `start_date === today && start_time === now` logic)
- **No WebRTC / streaming integration**

A user landing on this page sees a static list with no way to join a live stream. There is a `ConsultationRoom` component for 1-on-1 video calls, but nothing for group live video.

**What's needed:** Add a "Live Now" banner at the top that embeds the YouTube live stream URL when an event is currently active.

---

### Bug 2.2 🔴 The Events `/events/[id]` Page Does Not Exist
```
/events/[id]/page.tsx  ← MISSING
```
Every event card has a `<Link href={`/events/${e.id}`}>Register</Link>` button. Clicking "Register" on any event leads to a 404 page. The event detail/registration page has **not been built**.

---

### Bug 2.3 🔴 Fallback Events Have Dates in October/November 2025 — All Are Already "Past"
```typescript
// events/page.tsx L13
{ id: '1', start_date: '2025-10-02', ... }
{ id: '2', start_date: '2025-10-15', ... }
```
The fallback events (shown when DB has no events) all have dates from October-November 2025, which are in the past (current date: June 2026). Users see events with "register" buttons for events that already happened 8 months ago.

**Fix:** Either update fallback dates to be rolling (current month + 2 weeks), or don't show fallback events at all when no live DB events exist.

---

# 3 — 🛕 TEMPLES (ALL INDIA) WITH PROPER DETAILING

**File:** [`/mandir-finder/page.tsx`](file:///c:/Users/pushp/Downloads/DIVYATATHASTU/divya-tathastu/src/app/(dashboard)/mandir-finder/page.tsx)

### Bug 3.1 🔴 Temple Details Are Extremely Thin — No Photo, No Description, No Deity History
The temple detail popup (line 152–166) only shows:
- Name
- City, State  
- Timing
- Save / Directions buttons

**Missing:**
- Temple photo/image
- Deity name, significance
- Historical background
- Festivals celebrated
- Dress code / rules
- Contact number / website
- Prasad / special pooja info
- Whether it's a Jyotirlinga / Shakti Peetha / Divya Desam

A "proper detailing" temple finder needs all these. The `Mandir` interface only has 12 fields, none of which include any rich description data.

---

### Bug 3.2 🔴 Temple Map (`IndiaMandirMap`) Uses Hardcoded Static Data — Not Dynamic from DB
```tsx
// mandir-finder/page.tsx L8
const IndiaMandirMap = dynamic(() => import('@/components/IndiaMandirMap'), { ssr: false })
```
The `IndiaMandirMap` component is a standalone SVG-based India map with hardcoded temple markers (from `mandirs.json` — 74.9KB). This data is:
- Hardcoded in a JSON file, cannot be updated from admin
- No way to add new temples without a code deploy
- Temple coordinates are approximate, not GPS-precise

**Fix:** Move temple data to a Supabase `temples` table with full details. Admin should be able to add/edit temples.

---

### Bug 3.3 🟠 "Near Me" Tab Shows "Search to find nearby temples" Until User Clicks Search — No Auto-Load
```typescript
// L61: fetchNearby() is only called from:
// - initMap() (when tab switches to 'nearby') ← correct
// But: initMap() returns early if mapInstanceRef.current already exists
// So on second tab switch, fetchNearby() is NOT called
```
Sequence of events:
1. User goes to "Near Me" → map initializes → `fetchNearby()` called → temples load ✓
2. User switches to "India Map" tab
3. User switches back to "Near Me" → `initMap()` is called but returns early (`if (mapInstanceRef.current) return`) → **`fetchNearby()` is NOT called**
4. Temple list is now empty (reset by component re-render? No — state persists but markers may be gone)

---

### Bug 3.4 🟠 Temple Marker Clicking Only Sets State — Doesn't Work if Map Not Yet Loaded
```typescript
// L82: marker.on('click', () => setSelected(m))
```
If the map tab is never visited (user only uses India Map), clicking a temple in the list view does nothing because `mapInstanceRef.current` is null.

---

### Bug 3.5 🟠 Leaflet Map Uses `require('leaflet')` in `updateMarkers()` — Causes SSR Error in Development
```typescript
// L74
const L = require('leaflet')  // synchronous require — not allowed in Next.js App Router
```
`updateMarkers()` uses `require('leaflet')` but the Leaflet library is async-loaded above. This can cause issues in dev mode and fails if called before the async import completes.

---

### Bug 3.6 🟡 Temple Timing Field Is a Raw String With No Formatting
```
"timing": "06:00 AM - 12:00 PM, 04:00 PM - 09:00 PM"
```
Displayed as-is in a `<p>` tag. No icon, no today's hours, no indication if currently open.

---

# 4 — 🛍️ SHOP — PRODUCT IMAGE UPLOADING

**File:** [`/shop/page.tsx`](file:///c:/Users/pushp/Downloads/DIVYATATHASTU/divya-tathastu/src/app/(dashboard)/shop/page.tsx)

### Bug 4.1 🔴 No Product Image Upload UI in Admin Panel
```
src/app/(dashboard)/admin/
  └── services/   ← Only service management, no product management
```
The admin panel has a `services` directory but **no product management UI**. There is no:
- Admin page to add/edit products
- Image upload form for product photos
- Product creation form

All products must be added directly in the Supabase dashboard. This is not user-friendly for the client. Need an admin `/admin/products/new` page with image upload.

---

### Bug 4.2 🟠 `getImageUrl()` Handles Only 2 Image Formats — Third Format (Supabase Storage Path) Missing
```typescript
function getImageUrl(images: any): string | null {
  if (Array.isArray(images) && images.length > 0) {
    const img = images[0]
    if (typeof img === 'string') return img          // "https://..." ✓
    if (img?.url) return img.url                     // {url:"..."} ✓
  }
  return null
  // Missing: Supabase storage path like "products/abc123/main.jpg"
}
```
If images are stored as Supabase storage paths (not full URLs), `getImageUrl()` returns null and the product shows a color gradient instead of the real image. Admin must upload to Supabase and manually paste the full URL.

**Fix:**
```typescript
if (typeof img === 'string') {
  if (img.startsWith('http')) return img
  // Convert storage path to public URL
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/${img}`
}
```

---

### Bug 4.3 🟠 Product Modal Shows Only Description — No Full Product Details, No Specifications
The product detail modal (line 498–564) shows:
- Name, price, discount
- 2-line description (same as card)
- Stock count warning

**Missing from modal:**
- Multiple product images / gallery
- Product specifications / weight / dimensions
- Ingredients (for herbal items)
- How to use
- Reviews
- Shipping information
- Return policy

---

### Bug 4.4 🟠 "Ardra Jalam" Category in Shop Uses `href="/ardra-jalam"` (Absolute) — Not `Link` Component
```tsx
// shop/page.tsx L283
<a href="/ardra-jalam" ...>Order Ardra Jalam</a>  // Raw anchor — loses Next.js prefetching
```
Uses `<a>` instead of `<Link>`, causing a full page reload and losing any cached state.

---

### Bug 4.5 🟡 `featured` Sort Does Not Sort by `is_featured` DB Column
```typescript
// shop/page.tsx L155–157
if (sort === 'price_asc') ...
else if (sort === 'price_desc') ...
else if (sort === 'newest') ...
// 'featured' (default) → NO sort applied — just DB insertion order
```
The "Featured" sort option does nothing — it leaves products in the order they come from the database. The `is_featured` column exists in the database (used in ebooks page) but is never used in the shop sort.

---

### Bug 4.6 🟡 Cart in `localStorage` Uses Product ID as Key — Deleted/Out-of-Stock Products Remain in Cart
```typescript
localStorage.setItem('dt_cart', JSON.stringify([...m]))
```
If a product is deleted from Supabase or goes out of stock, the cart still shows it (from localStorage). On checkout, the `cartItems` filter removes it (`products.find(p => p.id === id)` returns undefined) — so the user sees their cart total is wrong on the checkout page.

---

### Bug 4.7 🟡 No Product Image at All for "Report", "Consultation", "Bundle" Type Products
```typescript
const TYPE_GRADIENT: Record<string, string> = {
  report: 'from-[#2F2A44] to-[#460B2F]',
  consultation: 'from-emerald-600 to-teal-700',
  bundle: 'from-[#2F2A44] to-[#B9986B]',
}
```
Digital product types (report, consultation, bundle) typically have no image in the `images` field — they always show color gradients. Consider adding auto-generated cover images or at minimum branded visual banners for these types.

---

# 5 — 🕉️ NAKSHATRA REPORT — GANPATI MANTRA & YANTRA

**File:** [`/lib/noxatra/engine.ts`](file:///c:/Users/pushp/Downloads/DIVYATATHASTU/divya-tathastu/src/lib/noxatra/engine.ts) · [`reports/[reportId]/page.tsx`](file:///c:/Users/pushp/Downloads/DIVYATATHASTU/divya-tathastu/src/app/(dashboard)/reports/%5BreportId%5D/page.tsx)

### Bug 5.1 🔴 `mantra_writing` Section: Ganpati Mantra Step 3 Is Silently Skipped for Pushya Nakshatra
```tsx
// reports/[reportId]/page.tsx L643–659
{ml.step3 ? (
  <div>...</div>
) : (
  <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 text-center">
    <p className="text-xs ...">चरण 3 — पुष्य नक्षत्र के लिए नक्षत्र गणपति मंत्र नहीं है</p>
  </div>
)}
```
When `ml.step3` is null/undefined (for Pushya Nakshatra), the UI shows a grey fallback box with small Hindi text "no nakshatra Ganpati mantra for Pushya". This is: (a) hidden from the user as a grey box, (b) not communicated clearly. The grey box should instead explain WHY and provide an alternative practice.

---

### Bug 5.2 🔴 Yantra Is Not Displayed Visually in the Report — Only Text Name
The `YantraSection` renders:
```tsx
<p className="font-bold text-[var(--indigo-deep)] text-base">{data.primaryYantra?.name}</p>
```
Only the yantra **name** is shown (e.g., "Shri Yantra", "Ganesh Yantra"). There is **no visual/image of the yantra**. A yantra report without showing the actual yantra geometry is incomplete. The `SriYantraPanel` and `OmMandala` SVGs exist in the book viewer but are NOT shown in the print flat layout or in the YantraSection card.

---

### Bug 5.3 🟠 Ganpati Mantra Steps 1–4 Use Small Font — Not Bold/Big Enough for Sacred Text
```tsx
// Step 1 mantra text:
<p className="text-lg font-bold text-[var(--indigo-deep)]">{ml.step1.mantra}</p>
// "text-lg" = 18px
```
The Ganpati mantra (Sanskrit text) is rendered at `text-lg` (18px). For a sacred mantra display, this should be at minimum `text-2xl` (24px) or `text-3xl` (30px) with the traditional serif font. The transliteration and meaning are even smaller at `text-sm` (14px).

---

### Bug 5.4 🟠 `NAKSHATRA_LORDS` Map Has No Case-Insensitive Match — AI Generates Variant Spellings
```typescript
const lord = NAKSHATRA_LORDS[ml.nakshatra] || 'Jupiter'
```
If the AI generates "Aswini" instead of "Ashwini", or "Poorva Phalguni" instead of "Purva Phalguni", the map lookup fails, the lord defaults to `'Jupiter'`, and the wrong pen color, paper color, and deity are shown for the user's mantra writing practice.

**Fix:** Normalize both sides: `NAKSHATRA_LORDS[ml.nakshatra?.trim()]` and add common alternates.

---

### Bug 5.5 🟡 `mantra_writing` Is in `SINGLE_SECTIONS` But Absent from the Report Viewer Chapter List
```typescript
// generate/page.tsx L84:
mantra_writing: [{ sectionType: 'mantra_writing', ... }]
```
The generation wizard supports `mantra_writing` as a standalone report type, but in the **book viewer chapter list** (reports/[reportId]/page.tsx), there is no dedicated `mantra_writing` chapter — it's merged into the `mantra_chanting` chapter:
```typescript
// reports/[reportId]/page.tsx L1901
show: (['mantra_chanting', 'mantra_writing'].includes(report.report_type) || isFull) && !!(d.mantras || d.mantra || d.mantraLekhnan),
```
A standalone `mantra_writing` report appears in the "Mantra Guidance" chapter (labeled "Mantra Guidance VI") — which is confusing. It should have its own chapter titled "Likhit Japa Guide".

---

# 6 — 📲 SOCIAL MEDIA LINKS

**File:** [`/social/page.tsx`](file:///c:/Users/pushp/Downloads/DIVYATATHASTU/divya-tathastu/src/app/(dashboard)/social/page.tsx)

### Bug 6.1 🔴 Social Media Page Is an AI Content GENERATOR — Not Social Media Profile Links
The `/social` page generates AI-written posts for copy-pasting. It is NOT a page that shows the organization's actual social media links/profiles. The client wants:
- Links to Instagram, YouTube, Facebook, WhatsApp channel
- These should be prominent, clickable buttons

**What exists:** An AI tool to generate post content (useful but different from what's requested).

---

### Bug 6.2 🔴 No Social Media Links Anywhere in the App — No Footer, No Header
Searching the entire codebase for social links:
- No `instagram.com` link
- No `youtube.com` link  
- No `facebook.com` link
- No `wa.me` (WhatsApp) link
- The Ardra Jalam page has `levitatelabs.online@gmail.com` and `9858784784` — but these are contact details, not social links

**Fix:** Add a footer component with branded social media buttons, and a separate "Follow Us" section on the home/about page.

---

### Bug 6.3 🟠 Social Generator Has No Error Boundary — If Groq Returns Non-JSON, Page Shows "Failed to parse"
```typescript
const match = text.match(/\{[\s\S]*\}/)
if (match) {
  const parsed = JSON.parse(match[0])
} else {
  toast.error('Failed to parse response')  // ← No retry, no fallback
}
```
If the AI returns text like "I cannot generate..." or any non-JSON response, the user sees a silent toast error with no guidance. Should show a helpful message and offer to retry.

---

# 7 — 📞 CONTACT NUMBER + BANK + CONSULTATION BOOKING (5–9 PM)

### Bug 7.1 🔴 Contact Page Does Not Exist as a Dedicated Route
There is no `/contact` page anywhere in the project. The only contact info visible is:
```
// ardra-jalam/page.tsx L229:
Contact: 9858784784 · levitatelabs.online@gmail.com
```
A business needs a proper `/contact` page with:
- Phone number (prominently displayed, click-to-call on mobile: `tel:9858784784`)
- WhatsApp button
- Email (click-to-mailto)
- Bank / UPI payment details for offline payments
- Physical address (if any)
- Map embed
- Business hours

---

### Bug 7.2 🔴 Bank / Payment Details Section Missing from Entire App
The client asked for "bank" information — presumably for users who want to pay via NEFT/IMPS/UPI instead of Razorpay. There is:
- No bank account details page
- No UPI QR code
- No offline payment flow

If Razorpay fails (which can happen), users have no fallback payment method.

---

### Bug 7.3 🔴 Consultation Slots Cannot Be Filtered for 5–9 PM Time Window
```typescript
// consultations/page.tsx L53
supabase.from('consultation_slots')
  .select('*')
  .eq('is_booked', false)
  .gte('date', today)
  .order('date')
  .order('start_time')
  // ← No filter for time range (e.g., 17:00–21:00)
```
The booking page shows ALL available slots regardless of time. If the client wants to limit consultation bookings to 5 PM – 9 PM, there's:
- No time filter in the query
- No UI indicator of business hours
- No validation that prevents admins from accidentally creating morning slots

**Fix:** Add a time range filter:
```typescript
.gte('start_time', '17:00')
.lte('start_time', '21:00')
```
Or better — show all slots but visually highlight 5–9 PM as "prime" slots.

---

### Bug 7.4 🔴 Consultation Slots Must Be Created Manually in Supabase — No Admin UI for Slot Management
The admin panel (`/admin/services`) manages general services but there is **no admin UI** to:
- Create new consultation slots
- Set time ranges (e.g., generate slots from 5 PM to 9 PM)
- Block/unblock slots
- View booked slots
- Assign experts to slots

The expert's name is never shown in the slot card (line 134: just shows "Expert Consultation" hardcoded). No expert name or photo.

---

### Bug 7.5 🟠 Specialization Filter Is UI-Only — Not Connected to DB or Slot Data
```typescript
const SPECIALIZATIONS = ['All', 'Astrology', 'Numerology', 'Vastu', 'Ayurveda', 'Tarot', 'Meditation']
...
const filtered = slots  // ← ALWAYS returns all slots, filter variable never applied!
```
The specialization filter buttons are rendered and clickable but `filtered = slots` — the filter value is stored in `filter` state but **never applied** to the slots array. The filter has zero effect. All slots always show regardless of which filter button is selected.

---

### Bug 7.6 🟠 After Booking, Email Confirmation Toast Is Shown But No Email Is Actually Sent
```tsx
toast.success('Consultation booked! Check your email for confirmation.')
```
The booking inserts a record in `consultation_bookings` and marks the slot as booked, but:
- There is no email-sending code anywhere in the booking flow
- No webhook or Supabase Edge Function trigger visible
- The toast tells the user to "check their email" but nothing is sent

---

# 8 — 📅 BOOKING DATE & TIME BUG

### Bug 8.1 🔴 Date Picker: Date Is Stored as UTC ISO String But Displayed as Local Time → Off-By-One Day Error
```typescript
// consultations/page.tsx L137
new Date(slot.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
```
`slot.date` is a string like `"2026-06-25"`. `new Date("2026-06-25")` in JavaScript creates a UTC midnight date. When displayed via `toLocaleDateString()` in IST (UTC+5:30), this becomes **June 24** (previous day) for users in India.

**Example:**
- Admin creates a slot for June 25
- DB stores `"2026-06-25"`
- `new Date("2026-06-25")` = June 24, 6:30 PM IST (midnight UTC = previous day evening IST)
- User sees **"24 Jun"** but the actual slot is for **June 25**

**Fix:** Parse as local date:
```typescript
const [y, m, d] = slot.date.split('-')
new Date(+y, +m - 1, +d).toLocaleDateString('en-IN', ...)
```

---

### Bug 8.2 🔴 Time Display Uses Raw Database String — No AM/PM, No IST Label, No Duration
```tsx
// consultations/page.tsx L138
<p>{slot.start_time}</p>  // Shows "17:00" — no AM/PM, no duration, no end time
```
Users see `"17:00"` with no context:
- No conversion to 12-hour format ("5:00 PM")
- No IST label
- No session duration info (is it 30 min? 1 hour?)
- `end_time` field exists in the interface but is never displayed

---

### Bug 8.3 🔴 Expert Name & Photo Not Shown on Slot Cards
```tsx
// consultations/page.tsx L134
<h3 className="font-bold text-[var(--indigo-deep)]">Expert Consultation</h3>
// All slots show "Expert Consultation" — expert identity is hidden
```
The `slot.expert_id` field exists but is never joined to get the expert's profile (name, photo, specialization, bio). Every slot card is identical — no way for a user to know who they're booking with.

---

### Bug 8.4 🟠 Double Booking Race Condition — Two Users Can Book the Same Slot Simultaneously
```typescript
// consultations/page.tsx L72–75
const { error } = await supabase.from('consultation_bookings').insert({ ... status: 'confirmed' })
// ← No check if slot is STILL available before inserting
await supabase.from('consultation_slots').update({ is_booked: true }).eq('id', slotId)
```
Between the insert and the update, another user could also insert a booking for the same slot. Both would get `status: 'confirmed'` but only one can attend. There's no DB-level lock or transaction.

**Fix:** Use a Supabase RPC function with a transaction:
```sql
BEGIN;
  -- Lock and verify slot is still free
  SELECT id FROM consultation_slots WHERE id = $1 AND is_booked = false FOR UPDATE;
  -- Only proceed if slot was found
  INSERT INTO consultation_bookings...;
  UPDATE consultation_slots SET is_booked = true WHERE id = $1;
COMMIT;
```

---

### Bug 8.5 🟠 Past Booked Consultations Show No Status Update — Always Shows "confirmed" Even if Completed
```tsx
// My Bookings tab
<span className={...}>{b.status}</span>  // Always "confirmed"
```
Once a consultation is done, the status in the database stays as `"confirmed"` forever. There's no `"completed"` or `"cancelled"` status management. Users cannot see past sessions vs upcoming sessions.

---

# 9 — 🎨 AI REPORT BACKGROUND

**File:** [`reports/generate/page.tsx`](file:///c:/Users/pushp/Downloads/DIVYATATHASTU/divya-tathastu/src/app/(dashboard)/reports/generate/page.tsx#L399)

### Bug 9.1 🔴 Generation Progress Screen Has Plain Dark Background — No Sacred/Divine Aesthetic
```tsx
// generate/page.tsx L399
<div className="bg-gradient-to-br from-[var(--indigo-deep)] to-[#3B2882] p-8 text-white text-center">
  <SudarshanLoader size="lg" />
  <h2>Divinely Crafting Your Report</h2>
```
The generation progress screen uses a plain dark purple-to-indigo gradient. The client wants a more immersive "AI divine background" — starfield, mandala animation, particles, or sacred geometry as the background while the report generates.

**What's missing:**
- No animated mandala/chakra rotating in the background
- No star field or cosmic particles
- No golden sacred geometry watermark
- The `SudarshanLoader` exists and is a wheel (good start), but the surrounding background is minimal

---

### Bug 9.2 🟠 Section Progress Items (Kundli, Numerology, etc.) Have No Animation When Transitioning
```tsx
// The section items go from 'pending' → 'active' → 'done' with only a class change
// No entrance animation, no glow effect, no pulse when active
```
When each section becomes "active", only a subtle background/icon change happens. A divine/premium experience should have:
- Pulsing glow when section is active
- Fade-in when section becomes done  
- Gold shimmer on completion

---

### Bug 9.3 🟡 The Report List Page (`/reports`) Shows a Plain Table — No Astrological Styling
The `/reports` listing page shows generated reports in a flat list without:
- Cover thumbnails
- Astrological symbols for report types
- Color-coded categories  
- Any visual indicating the richness of content inside

---

# 10 — 💧 ARDRA JALAM — BOLD AND BIG TEXT

**File:** [`/ardra-jalam/page.tsx`](file:///c:/Users/pushp/Downloads/DIVYATATHASTU/divya-tathastu/src/app/(dashboard)/ardra-jalam/page.tsx)

### Bug 10.1 🔴 Section Title "Ardra Jalam" Is `text-4xl` — Correct — But Section Headers Are `text-2xl` Only
```tsx
// Hero title:
<h1 className="text-4xl font-black text-[#065f46]">Ardra Jalam</h1>  // ✓ Big

// Section headers:
<h2 className="text-2xl font-bold text-[var(--indigo-deep)]">The Science of Ardra Nakshatra</h2>
<h2 className="text-2xl font-bold text-[var(--indigo-deep)]">Benefits</h2>
<h2 className="text-2xl font-bold text-[var(--indigo-deep)]">How to Use</h2>
```
Client said "adra jalam section wale bold and big" — the section headers inside the page (Benefits, How to Use, Nakshatra Science) need to be visually stronger: `text-3xl` or larger with a decorative underline/divider.

---

### Bug 10.2 🔴 Benefit Card Titles Are `text-sm font-bold` — Too Small for a Sacred Product
```tsx
// ardra-jalam/page.tsx L174
<h3 className="font-bold text-[var(--indigo-deep)] mb-2 text-sm">
  {b.title}  // "Karma Dissolution", "Meditation Deepening", etc.
</h3>
```
Benefit section card titles are only `text-sm` (14px). These sacred benefit headings should be at least `text-base` (16px) to `text-lg` (18px), bold, and ideally with an emerald accent color.

---

### Bug 10.3 🟠 How-to-Use Step Titles Are `font-bold` Only — Not `font-extrabold` or Larger
```tsx
// ardra-jalam/page.tsx L193
<h3 className="font-bold text-[var(--indigo-deep)] mb-1">{h.title}</h3>
// "Morning Ritual", "Space Purification", etc. — needs to be bigger
```
The step titles should be `text-base font-extrabold` minimum. The step numbers in the dark squares are styled nicely but the step title text is undersized relative to them.

---

### Bug 10.4 🟡 Nakshatra Info Cards Have `text-sm` Description Text — Hard to Read on Mobile
```tsx
// ardra-jalam/page.tsx L157
<p className="text-sm text-[var(--warm-charcoal)]/60 leading-relaxed">{n.desc}</p>
```
At 14px with 60% opacity on mobile, these descriptions are very light and small. For a premium spiritual product, content should be at minimum `text-sm` at 80% opacity or `text-base` at 70% opacity.

---

# 📌 PRIORITY ACTION LIST

| Priority | Feature | Action Required |
|---|---|---|
| 🔴 P0 | Booking time display | Fix UTC→IST off-by-one date bug |
| 🔴 P0 | Ebook "Get This Book" | Fix link to go to product page, not `/shop` |
| 🔴 P0 | Events `/[id]` page | Build the event registration page |
| 🔴 P0 | Consultation filter | Fix filter — it currently does nothing |
| 🔴 P0 | Contact page | Create `/contact` with phone, WhatsApp, bank |
| 🔴 P0 | Social media links | Add real social links to footer & homepage |
| 🔴 P0 | Live video | Add YouTube Live embed to Events page |
| 🟠 P1 | Consultation 5–9 PM | Add time slot filter + admin slot management UI |
| 🟠 P1 | Temple details | Add photo, deity, description to temple popup |
| 🟠 P1 | Ardra Jalam | Make section headers text-3xl, benefits text-base |
| 🟠 P1 | Ganpati mantra | Increase mantra text to text-2xl/text-3xl |
| 🟠 P1 | Yantra visual | Add SVG yantra image in YantraSection |
| 🟠 P1 | Product image admin | Build admin product management UI |
| 🟡 P2 | AI report background | Add mandala/particles to generation screen |
| 🟡 P2 | Race condition booking | Use DB transaction for slot booking |
| 🟡 P2 | Expert profile on slots | Show expert name, photo, specialization |
| 🟡 P2 | Bank details | Add offline payment details page/section |
