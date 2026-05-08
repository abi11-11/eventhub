---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]
inputDocuments:
  - bmad-output/planning-artifacts/EventHub-PRD-BMAD.md
  - bmad-output/planning-artifacts/ux-design.md
  - bmad-output/planning-artifacts/architecture.md
  - bmad-output/planning-artifacts/database-schema.md
  - bmad-output/planning-artifacts/epics-and-stories.md
---

# UX Design Specification eventhub

**Author:** Leorio
**Date:** 2026-04-25

---

<!-- UX design content will be appended sequentially through collaborative workflow steps -->

## Executive Summary

### Project Vision

EventHub aims to be a dynamic, customizable event hosting and booking platform that empowers creators to build thriving communities. It goes beyond traditional venue booking by allowing hosts to define the entire experience—including custom branding and themes—while providing users with personalized, skill-based event discovery.

### Target Users

- **Event Hosts (Fitness & Niche Creators):** Users looking to monetize their passions, build communities, and have full control over their event's branding and ticketing (e.g., yoga instructors, book club organizers).
- **Participants (Sports Players & Discoverers):** Users seeking reliable, skill-matched events, seamless payment splitting, and a trustworthy community with transparent ratings and social discovery.

### Key Design Challenges

- **Constrained Theming for Consistency:** While we offer dynamic theming (colors, typography, backgrounds) to give hosts brand control, the structural layout and placement of critical CTAs (like 'Join & Pay') must remain locked and consistent. Theming should enhance the mood, not alter the navigation.
- **One-Time Setup vs. Recurring Sessions:** The comprehensive 7-step monetized event creation process must be a one-time setup for a specific event concept. Hosts should only need to go through this flow for brand-new event types; recurring sessions of the same event should be scheduled seamlessly under the umbrella of the original event without repeating the wizard.
- **Standardized Skill Taxonomy:** We cannot rely purely on subjective host definitions of skill levels. The UX must incorporate clear, standardized tooltips (e.g., "Intermediate = 2+ years playing") and potentially peer-validation loops to build genuine trust in the matching algorithm.

### Design Opportunities

- **Dynamic Theming:** Utilizing Material Design 3's dynamic capabilities to let host themes shine, creating a premium feel for grassroots events.
- **Social Virality:** Designing seamless location-based social graphs and group split-payment flows to encourage organic sharing and group participation.
- **Gamified Engagement:** Creating an engaging EventCoins and tier system interface that incentivizes positive community behavior and repeat bookings.

## M3 Theme Guidelines & Host Customization Engine

### Dynamic Styling Strategy
EventHub utilizes Google's Material Design 3 (M3) to allow hosts to customize the look and feel of their events while maintaining strict platform usability and accessibility standards.

### Host Customization Boundaries
- **Allowed:** Hosts may define the base color (`md-sys-color-primary`), secondary accent colors, and select from a curated list of typography scales (Playful, Professional, Elegant).
- **Phase 3 (Community Trust):** Build the **Skill Validation Matrix** to finalize the post-event loop and build long-term retention.

## UX Consistency Patterns

### Button Hierarchy & Micro-Animations
- **Primary (M3 Filled):** "Join," "Pay Now," "Publish." Uses high-visibility **Volt/Cyan** accents for maximum conversion.
- **Contextual Pulse Glow:** Primary buttons in the **Sports** category will feature a subtle pulse animation when an event has < 3 spots remaining to drive social urgency.
- **Secondary (M3 Tonal):** "Invite & Split," "Save Draft." Important actions that shouldn't compete with the primary conversion.
- **Tertiary (M3 Text):** "Cancel," "View Details," "Back."

### Feedback & Voice Patterns
- **The "Success Morph":** Every successful transaction ends with an M3 morph animation (Button → Checkmark) and haptic feedback to build trust.
- **Voice & Tone Pattern:** System messages must be encouraging, high-energy, and professional. 
  - *Example:* Instead of "Nudge Received," we use "Your squad is waiting! Nudge sent."
- **Haptic Strategy:** Precise tactile ticks for success; a distinct triple-pulse for errors.

### Form & Validation Patterns
- **Progressive Disclosure:** Utilizing the 7-step wizard to maintain low cognitive load and zero drop-off.
- **In-line Validation:** Immediate feedback on venue availability or timing clashes during creation to prevent "back-button" fatigue.

### Navigation & Contextual States
- **Persistent Bottom Bar:** Discover (Stream), Explore (Map), Host (+), Community (Clubs), Profile.
- **The "Lobby Bar":** A docked 48px bar above the navigation for active commitments, featuring a real-time progress circle and "Return to Lobby" CTA.

### Empty & Loading States
- **Host Spotlight Pattern:** Empty feeds display a "Host Spotlight" card instead of a generic "No Results" message, inviting users to host their first game with earn-potential highlights.
- **Shimmering Feeds:** M3 skeleton screens that mimic the "Immersive Card" layout to reduce perceived wait time and improve perceived performance.

## Responsive Design & Accessibility

### Responsive Strategy: Mobile-First, Desktop-Elite

- **Mobile (Primary):** Single-column immersive feed with bottom navigation. Optimized for "on-the-go" discovery and 1-thumb use.
- **Desktop (Command Center):** 3-column **"Dashboard"** layout. Utilizes a **Live Activity Sidebar** to allow hosts to monitor Lobbies and Chat in real-time while managing events.
- **Offline Accessibility:** The platform implements **Offline-Ready Tickets**. Once a booking is confirmed, the QR check-in ticket is cached locally, ensuring entry is possible even in low-connectivity venues (e.g., basement turfs or remote parks).
- **Breakpoint Strategy:** Mobile (< 600px), Tablet (600px - 1024px), Desktop (> 1024px).

### Accessibility Strategy: WCAG AA Compliance

- **Mathematical Contrast:** Leverage M3's **Dynamic Tonal Palettes** to automatically maintain a 4.5:1 contrast ratio across all host-customized themes, ensuring readability for all users.
- **Aria-Live Regions:** The high-stakes Lobby Timer is implemented as an `aria-live` region, ensuring screen readers announce time-remaining milestones (e.g., "5 minutes left") automatically to keep everyone in the game.
- **Inclusive Interaction Guide:** Strict **Focus Order** management for the 7-step wizard. Focus is automatically moved to the primary input of the new step to minimize navigation friction for keyboard and screen-reader users.
- **Haptic Assistance:** Contextual haptic patterns (Long-pulse for success, Triple-pulse for error) provide non-visual feedback for system states.

### Testing Strategy

- **Network Simulation:** Testing the "Offline-Ready" journey by simulating 0-bar connectivity at the check-in point to ensure zero-failure entry.
- **Accessibility Audit:** Combined automated audits (Lighthouse/Axe) with manual screen reader testing (VoiceOver/TalkBack) of the 30-second discovery flow.

### Implementation Guidelines

- **Semantic HTML:** Strict adherence to semantic elements (`<main>`, `<nav>`, `<article>`) to ensure clear document structure.
- **Relative Units:** Use of `rem` and `%` for all layout dimensions to ensure clean scaling across high-density mobile displays.
- **Touch Targets:** Maintain a minimum **48x48dp** hit area for all interactive elements, following M3 standards. CTAs (e.g., 'Join & Pay' button) are strictly controlled by EventHub.
- **Accessibility Guarantee:** M3's dynamic tonal palettes will automatically calculate contrasting text and surface colors based on the host's primary selection to ensure WCAG compliance.

### The UI Experience
- The interface will leverage soft, pill-shaped geometry, subtle glassmorphism elevations for depth, and micro-animations for state changes to provide a premium, tactile experience.

## Core User Experience

### Defining Experience

For participants, the core experience is **effortless, personalized event discovery matched to their exact skill level**. For hosts, it's the **empowerment of turning a passion into a branded, monetized community** with zero technical friction.

### Platform Strategy

EventHub is a mobile-first application (iOS and Android). Given the heavy reliance on location-based matching, on-the-go real-time chat, and QR check-ins at physical venues, the mobile interface must feel native and lightning-fast. Deep linking is absolutely crucial for hosts sharing their custom event pages across external social media.

### Effortless Interactions

- **Group Payment Splitting:** Eliminating the awkward "pay me back later" dance; the platform calculates and requests shares automatically.
- **1-Tap 'Duplicate Event':** Ensuring recurring hosts can spin up next week's session without re-entering the 7-step creation wizard.
- **Skill-Based Matchmaking:** Finding the right game should feel automatic—no more reading through dense descriptions to guess if a game is too competitive or too relaxed.

### Critical Success Moments

- **The "Sold Out" Notification:** The magical moment a host realizes their event has reached maximum capacity and their payout is secured.
- **The First Seamless Group Join:** When a participant discovers a new activity, invites three friends, and they all successfully split the payment without ever leaving the app.
- **The "Wow" Share:** When a host finishes their UI customization and sees their beautiful, premium M3 event card for the first time, making them proud to share the link.

### Experience Principles

1. **Aesthetics are Functional:** A premium, beautiful interface justifies premium event pricing. 
2. **Customization Without Chaos:** Give hosts the paint (colors, typography), but the platform holds the canvas (layout, CTAs).
3. **Friction is the Enemy of Fun:** Group coordination and payments must be handled by the platform, not the user.
4. **Trust over Traffic:** Reliable skill matching and verified host badges are more important than simply showing maximum events.

## Desired Emotional Response

### Primary Emotional Goals

- **For Hosts:** **Empowered and Proud.** They should feel like they own a premium brand, not just a slot on a bulletin board.
- **For Participants:** **Confident and Connected.** They should feel absolute trust in what they are booking and immediate excitement about joining a community.

### Emotional Journey Mapping

- **Discovery Phase:** *Excitement.* The personalized feed and visually distinct, M3-styled event cards should create a sense of abundance and possibility.
- **Booking Phase:** *Confidence.* Transparent pricing, clear skill-level definitions, and easy group payment splitting should completely eliminate anxiety.
- **Event Day:** *Belonging.* Real-time group chats and location-based social features should make users feel like they are already part of the community before they arrive.
- **Post-Event:** *Accomplishment.* Earning EventCoins, ranking up tiers, and leaving reviews should provide a satisfying dopamine hit of completion.

### Micro-Emotions

- **Trust over Skepticism:** Fostered by clear "Verified Host" badges and transparent cancellation policies.
- **Delight over Mere Satisfaction:** Achieved through tactile M3 micro-animations (e.g., fluid morphing of the 'Join' button into a success state).
- **Relief over Frustration:** The exact feeling an organizer gets when the platform automatically handles chasing friends for split payments.

### Design Implications

- **To foster Empowerment:** We must ensure the host's custom color palette feels dominant on their event page, minimizing platform branding in favor of the host's brand.
- **To foster Trust:** Critical UI elements (prices, skill requirements, participant counts) must use highly legible typography and consistent layout patterns, regardless of the host's chosen theme.
- **To foster Delight:** We will over-index on smooth, 60fps transitions and tactile feedback (haptics) during core actions like booking confirmation and EventCoin collection.

### Emotional Design Principles

1. **Brand the Host, Not Just the App:** Make the creator the star of the show.
2. **Anxiety-Free Commitments:** Every payment, waitlist, and skill-requirement flow must be explicitly clear and reversible where possible.
3. **Reward Every Interaction:** Use micro-interactions to celebrate even small actions, like RSVPing or checking in.

## UX Pattern Analysis & Inspiration

### Inspiring Products Analysis

- **BookMyShow:** Masters of discovery. They use visually distinct, highly immersive event cards and personalized horizontal carousels to make browsing feel like an entertainment experience.
- **Playo:** Experts in community and matchmaking. Their use of peer ratings, skill progression graphs, and reliable match-finding solves the core anxiety of joining a new sports group.
- **Splitwise:** Leader in effortless financial coordination. Their "group commitment" and tracking logic is essential for our split-payment flows.
- **Instagram/Swiggy:** Benchmarks for app performance and perceived speed through shimmer effects and progressive loading.

### Transferable UX Patterns

**Navigation Patterns:**
- **The Immersive Feed:** Horizontal scrolling carousels categorized by 'Trending', 'For You', and 'Friends' Events' (inspired by BookMyShow) to make discovery effortless and visually rich.

**Interaction Patterns:**
- **Discovery → Commitment Group → Payment Flow:** Using a "Commitment Group" phase (inspired by Splitwise) where attendees join a temporary group before the final payment is triggered, ensuring group success.
- **The 1-Tap Booking Bottom Sheet:** Keeping the checkout process within a bottom-sheet modal rather than navigating to a new page, ensuring users never lose their context.
- **Peer-Validated Skill Badges:** Using visual tags for 'Beginner' or 'Advanced' that are backed by community consensus (inspired by Playo) to build trust instantly.

**Visual Patterns:**
- **Shimmer & Progressive Loading:** Utilizing M3-styled shimmer skeletons and progressive image loading (inspired by Instagram) to keep the app feeling lightning-fast even during heavy asset loads.
- **Dynamic Color Extraction:** Using Material Design 3 to pull color palettes from event cover images, mimicking BookMyShow's immersive movie pages.

### Anti-Patterns to Avoid

- **The "Ghost Event":** Avoiding events that appear available in the feed but are revealed as 'Sold Out' only after clicking. We must use high-visibility "Sold Out" ribbons on the feed cards themselves.
- **The "Text Wall" Feed:** Avoiding dense, text-heavy lists. Users scan; we must lead with high-quality imagery.
- **The "Groundhog Day" Creation Flow:** Forcing hosts who run weekly events to manually re-enter their details every time. Recurring events need a 1-tap duplication flow.

### Design Inspiration Strategy

**What to Adopt:**
- BookMyShow's visually distinct carousels and Playo's robust skill-rating taxonomy.
- Instagram's performance patterns (shimmers) to protect the M3 aesthetic.

**What to Adapt:**
- Adapt Splitwise's coordination logic to fit our 1-tap booking flow, making group payments feel like a collaborative achievement.
- Adapt M3's dynamic color extraction for host branding while maintaining platform accessibility.

**What to Avoid:**
- Avoid complex, multi-page checkout flows and hidden CTAs that get lost in custom host themes.
