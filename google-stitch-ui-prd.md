# UI/UX Design PRD: EventHub

**Target Audience:** UI Designers, AI Design Generators (Google Stitch, Figma AI, V0)
**Project:** EventHub - Dynamic Event Hosting & Booking Platform
**Design Philosophy:** Premium, Dynamic, BookMyShow-inspired Discovery, Creator-Centric.

---

## 1. Design Vision & Aesthetics

EventHub is a modern, premium marketplace for discovering and hosting niche events (Yoga, Cacao Ceremonies, Football, Book Clubs). The app must look premium, vibrant, and alive. 

### Core Aesthetic Rules
- **No generic templates**: The design must feel highly polished, akin to Airbnb, BookMyShow, or Spotify.
- **Glassmorphism & Depth**: Use subtle blurs, drop shadows, and overlapping cards to create depth.
- **Dynamic Theming (Crucial)**: Event pages change their color palette and typography based on the event type (e.g., Calming blues for Yoga, Vibrant neon for Football).
- **Rich Media**: Heavy emphasis on high-quality cover images with gradients fading into content.

---

## 2. Global Design System (Tokens)

### 2.1 Base Color Palette (App Shell)
- **Background (Light Mode)**: `#FFFFFF` (pure white) with `#F8F9FA` for secondary sections.
- **Background (Dark Mode)**: `#0F172A` (slate dark) with `#1E293B` for elevated cards.
- **Brand Primary**: `#6366F1` (Indigo) - used for global navigation and core CTAs.
- **Brand Secondary**: `#10B981` (Emerald) - used for success states and "Verified" badges.
- **Text Primary**: `#0F172A` (Light Mode) / `#F8FAFC` (Dark Mode).
- **Text Secondary**: `#64748B` (Slate) / `#94A3B8`.

### 2.2 Typography
- **Primary Font**: `Inter` or `Outfit` (Clean, geometric sans-serif for high readability).
- **Display Font (Themes)**: 
  - `Playfair Display` (Serif - used dynamically for Elegant/Literary events).
  - `Fredoka` (Rounded - used dynamically for Playful/Creative events).
  - `Oswald` (Condensed - used dynamically for Sports/Fitness events).

### 2.3 Micro-Animations & Interactions
- **Tap States**: Cards shrink slightly (`scale: 0.98`) on press.
- **Page Transitions**: Smooth slide-in from right.
- **Hero Images**: Parallax scroll effect when scrolling down an event page.
- **Loading States**: Shimmer/skeleton loaders instead of traditional spinners.

---

## 3. Screen Specifications (For Google Stitch Generation)

Please generate the following screens using the component hierarchies and layout structures provided.

### Screen 1: Discovery Home Screen (Feed)
**Vibe**: Engaging, personalized, media-heavy.

**Layout Structure:**
1. **Header (Sticky)**:
   - Left: Location Dropdown (`📍 Bangalore ▼`).
   - Right: Notification Bell (`🔔` with red dot) and User Avatar (`👤`).
2. **Search Bar**: 
   - Floating search pill with a magnifying glass. Placeholder: "Find yoga, football, book clubs..."
3. **Category Chips (Horizontal Scroll)**:
   - Pills: [All] [🏃 Sports] [🧘 Wellness] [🎨 Creative] [💼 Tech]
4. **Hero Carousel ("Featured Near You")**:
   - Large, edge-to-edge cards (16:9 aspect ratio).
   - Image background with bottom gradient fade.
   - White text overlay: Event Title, Date, and a prominent "Join" button.
5. **Section: "Based on your skill level"**:
   - Grid of smaller **Event Cards** (see Component Library).
6. **Bottom Navigation Bar**:
   - Floating glassmorphism bar.
   - Icons: [Home (Active)] [Search] [Host (+)] [Chat] [Profile]

### Screen 2: Dynamic Event Detail Page (Yoga Theme Example)
**Vibe**: Calm, immersive, dynamically themed based on the host's settings.

**Theme Override**: 
- Primary Color: `#4DB8C6` (Soft Teal)
- Typography: `Playfair Display` for Headings.

**Layout Structure:**
1. **Hero Image Header**:
   - 40% of screen height. Image of a yoga session.
   - Top-left: Back Button (`←`). Top-right: Share (`📤`) and Heart (`♡`).
   - Bottom edge overlaps with a white/dark card containing content.
2. **Content Container (Overlapping Hero)**:
   - **Title**: "Sunday Morning Vinyasa Flow" (Playfair Display font).
   - **Host Pill**: Avatar + "Hosted by Priya" + green checkmark badge (`✓ Verified`).
   - **Quick Stats Bar**: `⭐ 4.8 Rating` | `👥 12/15 Joined` | `🔰 Beginner Friendly`.
3. **Logistics Grid**:
   - 2x2 grid with soft grey backgrounds.
   - 📅 "Sun, 24 Apr • 6:30 AM"
   - 📍 "Indiranagar Park (Map →)"
   - 💰 "₹500 / person"
   - ⏳ "90 minutes"
4. **About Section**:
   - Text description.
5. **Who's Going (Social Proof)**:
   - Stacked avatars of friends/users attending `(Avatar1)(Avatar2)(Avatar3) +9 others`.
6. **Sticky Bottom Bar**:
   - Left: "₹500 total".
   - Right: Large Teal Button "Join & Pay".

### Screen 3: Event Creation Wizard (Step: Theme Customization)
**Vibe**: Professional, Creator-focused, Tool-like.

**Layout Structure:**
1. **Header**: "Create Event" with a progress bar (Step 3 of 7).
2. **Content**:
   - Heading: "Design your event's look".
   - Subtext: "Make it stand out to attendees."
3. **Preset Themes Selector (Horizontal Scroll)**:
   - Cards showing color palettes: [Zen Mode 🧘] [Adrenaline ⚡] [Intellectual 📚].
4. **Custom Controls**:
   - **Color Pickers**: "Primary Color" and "Button Color" (shows hex codes).
   - **Typography Dropdown**: "Select Font Style".
5. **Live Preview Panel**:
   - A miniature phone frame showing exactly how the Event Card will look with the selected colors and fonts. Updates in real-time.
6. **Footer**:
   - "Back" button and "Next Step" button.

### Screen 4: Host Dashboard (Event Management)
**Vibe**: Data-rich, clear, administrative.

**Layout Structure:**
1. **Header**: Event Title + "Dashboard".
2. **Key Metrics Row**:
   - 3 Cards: [Revenue: ₹6,000] [Capacity: 12/15] [Views: 142].
3. **Action Grid**:
   - Buttons: [QR Check-in] [Broadcast Message] [Edit Details].
4. **Attendee List**:
   - List items: Avatar, Name, Skill Level, Payment Status (Pill: `Paid` or `Pending`).
   - Right edge: A circular button to manually mark "Present".

### Screen 5: User Profile & Reputation
**Vibe**: Social, gamified, achievement-oriented.

**Layout Structure:**
1. **Header**:
   - Large Avatar centered.
   - Name and Username `@vikram_rides`.
   - "Level 3: VIP" Badge.
2. **Stats Row**:
   - [Events Attended: 42] [Events Hosted: 0] [Friends: 18].
3. **Skill Radar/Tags**:
   - Badges showing peer-rated skills: `Football: Adv` | `Yoga: Beg`.
4. **EventCoins Wallet**:
   - Gradient card (gold/purple) showing current balance "1,450 🪙 EventCoins".
   - "Redeem for discounts" CTA.
5. **Past Events Gallery**:
   - Masonry grid of photos from past attended events.

---

## 4. Component Library Requirements

For the design generator, please adhere to these strict component definitions:

### C1: The Event Card (Standard)
- Aspect ratio: Vertical rectangle.
- Top 60%: Image with rounded corners (16px).
- Top Right absolute: Heart icon (save).
- Bottom 40%: 
  - Date (e.g., "TOMORROW, 6 PM" in brand primary color, small bold caps).
  - Title (Truncated to 2 lines, bold).
  - Footer row: Price on left, Host avatar mini on right.

### C2: Themed Button
- Border radius: 12px or fully pill-shaped (depending on the dynamic theme).
- Height: 56px.
- Text: Centered, 16px, Semi-bold.
- Feedback: Must show an active/pressed state (opacity 0.8).

### C3: Bottom Sheet Modal
- Used for Filters, Payment Method Selection, and Sharing.
- Drag handle at the top center (small pill).
- Top corners rounded (24px).
- Background: Pure white or frosted glass in dark mode.

---

## 5. Instructions for Google Stitch (Prompt Directives)

When generating these UI screens, follow these exact prompt directives:
1. **"Apply a premium, modern mobile app aesthetic similar to BookMyShow or Airbnb."**
2. **"Ensure the Event Detail Page clearly demonstrates a custom color palette applied by the host (e.g., Teal and Serif fonts for Yoga)."**
3. **"Use high-contrast typography for readability."**
4. **"Include sticky bottom bars for main Calls to Action to ensure one-hand usability."**
5. **"Generate all UI components using an 8pt grid system for spacing."**
