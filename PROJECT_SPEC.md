# Ping Pong Tournament System – Project Specification

**Version:** 1.0 (MVP)
**Last Updated:** Dec 2025
**Status:** Implementation Complete (8-player bracket only)

---

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Requirements Specification](#requirements-specification)
4. [Implementation Status](#implementation-status)
5. [API Documentation](#api-documentation)
6. [Data Model](#data-model)
7. [Bracket Logic (8-Player)](#bracket-logic-8-player)
8. [Tournament Lifecycle](#tournament-lifecycle)
9. [Frontend Pages](#frontend-pages)
10. [Future Enhancements](#future-enhancements)
11. [Setup & Development](#setup--development)
12. [Environment Variables](#environment-variables)

---

## Overview

The Ping Pong Tournament System is a small web application for running recurring, casual **double-elimination** ping pong tournaments (e.g., office, club).

Key goals:

- Lightweight, **mobile-friendly** web UI
- Support **8–16 players**, using an **8-player double-elimination bracket** for V1
- Simple flows:
  - Admin creates and starts tournaments
  - Players join and report their match results
  - System manages bracket progression and final standings
- Ability to **save tournaments** and view a **history** of winners

The system uses:

- **Next.js App Router** (monorepo style) for frontend + backend
- **Prisma** ORM with SQLite (for now)
- Clear separation between:
  - **Admin** experience (clay “admin” theme)
  - **Player** experience (green “court” theme)

---

## System Architecture

### High-Level Diagram

```text
+------------------------------+
|        Next.js App           |
|  (App Router, React, API)    |
+------------------------------+
         |           |
   API Routes    Frontend Pages
         |
         v
+------------------------------+
|        Prisma ORM            |
+------------------------------+
         |
         v
+------------------------------+
|     Database (SQLite)        |
+------------------------------+
Backend Components
src/app/api/tournaments/route.ts

POST /api/tournaments – Create tournament

GET /api/tournaments – List tournaments (with optional status filter)

src/app/api/tournaments/[id]/route.ts

GET /api/tournaments/:id – Get tournament details + matches

src/app/api/tournaments/[id]/join/route.ts

POST /api/tournaments/:id/join – Join tournament

src/app/api/tournaments/[id]/start/route.ts

POST /api/tournaments/:id/start – Start tournament & generate bracket

src/app/api/matches/[matchId]/report/route.ts

POST /api/matches/:matchId/report – Report match result

Frontend Pages
Frontend Pages:

Home (/) - Split-screen entry to Player and Admin experiences

Admin Dashboard (/admin) - Create and manage tournaments (clay admin theme)

Player Entry (/player) - Enter tournament password and join as a player

Tournament View (/tournament/:id) - Live bracket with match reporting

⏳ Pending Features
16-player bracket configuration

Enhanced password hashing (bcrypt/scrypt)

Improved final standings algorithm

Real-time updates

Admin override functionality

Requirements Specification
User Roles
Admin (Organizer)
Can:

Create tournaments

Start tournaments (generate bracket)

View any tournament/bracket

Authentication:

Single global admin password (env var)

No registration or accounts

Provided via header x-admin-token in API calls

Player
Can:

Join tournaments

Report their own match results

View brackets of tournaments they have the password for

No accounts or login; identified per tournament by tournamentPlayerId

Identity concept for future expansion via GlobalPlayer

Viewer
Anyone with URL can view completed tournaments

Active tournaments require tournament password

Authentication Rules
Global Admin Password:

Used for: POST /api/tournaments, POST /api/tournaments/:id/start

Sent via header: x-admin-token: YOUR_ADMIN_SECRET

In the frontend, once the admin password is entered on /admin, it should be stored in memory and/or session storage and automatically attached to subsequent admin API calls (so the admin does not have to re-enter it repeatedly).

Tournament Password:

Used for: Joining, viewing active tournaments, reporting results

Stored hashed in DB

In the frontend, once a player enters a valid tournament password from the Player Entry flow (/player), it should be persisted for that browser session (per tournament) and reused for all subsequent calls (joining, viewing, reporting), so the player is not repeatedly prompted.

Match Reporting Identity Check:

Reporter must provide tournamentPassword (front-end supplies stored value)

Reporter must provide their reporterTournamentPlayerId

Reporter ID must equal player1_id OR player2_id

Implementation Status
✅ Completed Features
Backend (API Routes):

POST /api/tournaments - Create tournament (admin only)

GET /api/tournaments - List tournaments (with optional status filter)

GET /api/tournaments/:id - Get tournament details (password required if active)

POST /api/tournaments/:id/join - Join a tournament

POST /api/tournaments/:id/start - Start tournament and initialize bracket (admin only)

POST /api/matches/:matchId/report - Report match results

Core Logic:

Authentication (src/lib/auth.ts) - Admin token & password verification

Bracket Configuration (src/lib/brackets/bracket8.ts) - 8-player double-elimination

Seeding (src/lib/tournament/seeding.ts) - Skill-based seeding with shuffle

Bracket Initialization (src/lib/tournament/bracketInitializer.ts) - Match creation & BYE handling

Match Progression (src/lib/tournament/matchProgression.ts) - Winners/losers routing and tournament finalization

Frontend Pages:

Home (/) - Split-screen entry to Player and Admin experiences

Admin Dashboard (/admin) - Create and manage tournaments (clay admin theme)

Player Entry (/player) - Enter tournament password and join as a player

Tournament View (/tournament/:id) - Live bracket with match reporting

⏳ Pending Features
16-player bracket configuration

Enhanced password hashing (bcrypt/scrypt)

Improved final standings algorithm

Real-time updates (polling/SSE)

Admin override functionality

API Documentation
POST /api/tournaments
Admin-only. Create a new tournament.

Request Headers:

makefile
Copy code
x-admin-token: YOUR_ADMIN_SECRET
Request Body:

json
Copy code
{
  "name": "Office Ping Pong – Dec",
  "joinDeadlineOffsetMinutes": 120,
  "tournamentPassword": "pong123"
}
Response:

json
Copy code
{
  "id": 42,
  "name": "Office Ping Pong – Dec",
  "joinDeadline": "2025-12-15T18:00:00Z",
  "status": "joining"
}
Note: The frontend is responsible for constructing any navigation URLs. Players now typically start from / → /player, enter the tournament password, and then join.

GET /api/tournaments
List tournaments, optionally filtered by status.

Query Parameters:

status (optional) – one of: joining, in_progress, completed

Response:

json
Copy code
{
  "tournaments": [
    {
      "id": 42,
      "name": "Office Ping Pong – Dec",
      "status": "joining",
      "createdAt": "2025-12-10T15:00:00Z",
      "joinDeadline": "2025-12-10T17:00:00Z",
      "winner": null,
      "_count": { "players": 5 }
    },
    {
      "id": 43,
      "name": "Office Ping Pong – Nov",
      "status": "completed",
      "createdAt": "2025-11-10T15:00:00Z",
      "joinDeadline": "2025-11-10T17:00:00Z",
      "winner": { "playerId": "uuid-123", "name": "Isabela" },
      "_count": { "players": 8 }
    }
  ]
}
GET /api/tournaments/:id
Get tournament details, including players and matches.

Behavior:

If status = joining or in_progress, client must provide tournament password in the body or header.

If status = completed, read-only access can be allowed without password (depending on frontend behavior).

Response (example):

json
Copy code
{
  "tournament": {
    "id": 42,
    "name": "Office Ping Pong – Dec",
    "status": "in_progress",
    "createdAt": "...",
    "joinDeadline": "...",
    "winner": null
  },
  "players": [
    {
      "id": 1,
      "name": "Isabela",
      "skillRating": 4,
      "seed": 1,
      "finalRank": null,
      "lossCount": 0,
      "winsCount": 1
    }
  ],
  "matches": [
    {
      "id": "uuid-1",
      "bracket": "winners",
      "round": 1,
      "matchIndex": 1,
      "player1Id": 1,
      "player2Id": 2,
      "winnerId": null,
      "status": "pending",
      "nextWinnerMatchId": "uuid-5",
      "nextLoserMatchId": "uuid-8",
      "player1Score": null,
      "player2Score": null
    }
  ]
}
POST /api/tournaments/:id/join
Join a tournament as a player.

Request Body:

json
Copy code
{
  "name": "Isabela",
  "skill": 4,
  "tournamentPassword": "pong123"
}
Response:

json
Copy code
{
  "tournamentPlayerId": 123,
  "players": [
    { "id": 123, "name": "Isabela", "skill": 4 },
    { "id": 124, "name": "Alex", "skill": 3 }
  ]
}
POST /api/tournaments/:id/start
Start a tournament and initialize the bracket (admin-only).

Request Headers:

makefile
Copy code
x-admin-token: YOUR_ADMIN_SECRET
Behavior:

Validate:

Tournament exists

Status is joining

Player count between 8 and 16

Determine bracket size (8 for now):

If players < 8, create BYEs

Generate:

TournamentPlayer.seed values

Match rows for winners, losers, final

Update status = in_progress

Response:

json
Copy code
{
  "status": "in_progress",
  "bracketSize": 8,
  "matchCount": 15
}
POST /api/matches/:matchId/report
Report the result of a match.

Request Body:

json
Copy code
{
  "tournamentPassword": "pong123",
  "reporterTournamentPlayerId": 123,
  "winnerTournamentPlayerId": 123,
  "player1Score": 21,
  "player2Score": 18
}
Validation:

Match exists and belongs to the correct tournament

Match status is pending

Reporter is one of the players (player1 or player2)

Winner is one of the players

Tournament password is valid

Behavior:

Set winnerId, player1Score, player2Score, status = completed

Increment winsCount for winner; update lossCount for loser

If loser has 2nd loss, mark elimination and assign eliminationOrder

Route winner/loser to their next matches using nextWinnerMatchId / nextLoserMatchId

If this is the final match:

Set tournament.winnerPlayerId

Compute finalRank for all players

Set status = completed

Response:

json
Copy code
{
  "ok": true
}
Data Model
Tournament
prisma
Copy code
model Tournament {
  id                     Int              @id @default(autoincrement())
  name                   String
  createdAt              DateTime         @default(now())
  joinDeadline           DateTime
  status                 TournamentStatus
  tournamentPasswordHash String

  winnerPlayerId String?
  winner         GlobalPlayer? @relation("TournamentWinner", fields: [winnerPlayerId], references: [playerId])

  players TournamentPlayer[]
  matches Match[]
}
GlobalPlayer
prisma
Copy code
model GlobalPlayer {
  playerId String @id @default(uuid())
  name     String

  tournaments     TournamentPlayer[]
  tournamentsWon  Tournament[] @relation("TournamentWinner")
}
TournamentPlayer
prisma
Copy code
model TournamentPlayer {
  id               Int       @id @default(autoincrement())
  tournamentId     Int
  playerId         String
  skillRating      Int
  seed             Int?
  finalRank        Int?
  lossCount        Int       @default(0)
  eliminationOrder Int?
  winsCount        Int       @default(0)

  tournament   Tournament   @relation(fields: [tournamentId], references: [id])
  globalPlayer GlobalPlayer @relation(fields: [playerId], references: [playerId])

  matchesAsPlayer1 Match[] @relation("MatchPlayer1")
  matchesAsPlayer2 Match[] @relation("MatchPlayer2")
  matchesWon       Match[] @relation("MatchWinner")
}
Match
prisma
Copy code
model Match {
  id           String       @id @default(uuid())
  tournamentId Int
  bracket      BracketType
  round        Int
  matchIndex   Int

  player1Id Int?
  player2Id Int?
  winnerId  Int?
  status    MatchStatus     @default(pending)

  nextWinnerMatchId String?
  nextLoserMatchId  String?

  player1Score Int?
  player2Score Int?

  tournament Tournament @relation(fields: [tournamentId], references: [id])

  player1 TournamentPlayer? @relation("MatchPlayer1", fields: [player1Id], references: [id])
  player2 TournamentPlayer? @relation("MatchPlayer2", fields: [player2Id], references: [id])
  winner  TournamentPlayer? @relation("MatchWinner", fields: [winnerId], references: [id])

  nextWinnerMatch   Match?  @relation("NextWinner", fields: [nextWinnerMatchId], references: [id])
  previousWinnerFor Match[] @relation("NextWinner")

  nextLoserMatch    Match?  @relation("NextLoser", fields: [nextLoserMatchId], references: [id])
  previousLoserFor  Match[] @relation("NextLoser")
}
Bracket Logic (8-Player)
Supports 8 players (exact for now).

Double-elimination:

Everyone starts in winners bracket

First loss sends player to losers bracket

Second loss eliminates player

Bracket configuration is pre-defined in bracket8 mapping:

W1–W7 for winners matches

L1–L5 for losers matches

F1 for final

Each match has nextWinnerMatchId and nextLoserMatchId.

(Full mapping stored in code.)

Tournament Lifecycle
Admin creates tournament (POST /api/tournaments):

Provides name, joinDeadlineOffsetMinutes, tournamentPassword.

System sets status = joining.

Frontend uses the returned ID to show the tournament in admin dashboard.

Players generally enter via home → player entry (no special join link required).

Players join (/player → POST /api/tournaments/:id/join):

Player enters tournament password (from organizer).

Frontend associates the password with a tournament ID (current implementation: ID known via UI; future: lookup by password or short code).

Player enters name + skill rating (1–5).

Backend creates (or reuses) GlobalPlayer and adds TournamentPlayer.

Frontend receives tournamentPlayerId and player list.

Admin starts tournament (POST /api/tournaments/:id/start):

Validate player count (8–16).

Determine bracketSize (8 for now).

Seed players by skill rating.

Create all Match rows for winners/losers/final.

Set status = in_progress.

Tournament in progress:

Bracket visible on /tournament/:id

Match results reported via POST /api/matches/:matchId/report

Matches update in DB, progression logic routes players

Tournament completed:

Final match completion sets:

tournament.winnerPlayerId

status = completed

finalRank and standings computed for all TournamentPlayers

Completed tournaments appear in history views.

Frontend Pages
Home (/)
Full-page, split layout:

Left side in player (court) colorway with “Enter as Player” CTA

Right side in admin (clay) colorway with “Enter as Admin” CTA

No tournament list here; home is purely an entry point into Player/Admin experiences

Admin Dashboard (/admin)
Clay-themed “admin” page frame

Admin password input (persisted in-session once entered)

Tournament creation form (name, password, join deadline offset)

Tournament list with status, player count, and "Start" button for joining tournaments

Links to view tournaments (opens player-style bracket view with correct tournament loaded)

Player Entry (/player)
Court-themed page frame

Step 1: Prompt for tournament password (and optionally tournament ID/code in future)

Once password is accepted, Step 2: prompt for name and self-rated skill (1–5)

Uses the same POST /api/tournaments/:id/join endpoint under the hood

Tournament password is persisted for this session and reused for viewing bracket and reporting results (no need to re-enter)

Tournament View (/tournament/:id)
Password prompt for active tournaments

Player roster with seeds/ranks

Bracket visualization grouped by:

Winners bracket (by round)

Losers bracket (by round)

Grand final

Controls for reporting match results (if user knows tournament password)
13. UI Design & Styling System
13.1 Design Principles

Matte, bold color: Solid, non-glossy fills inspired by tennis courts (clay, hardcourt green/blue) with minimal gradients.

Refined but playful: Magazine-style typography (serif headings) with clean layouts and small tennis-specific flourishes (lines, ball paths).

Court metaphor: Strong use of lines, grids, and overhead perspectives – pages often feel like a court / bracket drawn on a field of color.

Clarity first: Bracket state, who plays who, and what to click next are always obvious.

Mobile-first: Layouts scale cleanly from small phones to large desktop monitors (home split screen collapses, bracket stacks vertically, etc.).

13.2 Color System

Colors are defined as design tokens and exposed via CSS variables / Tailwind config. Two main themes:

Player (Court) Theme – greens + blue, echoes hardcourt / ball.

Admin (Clay) Theme – clay reds/oranges, slightly darker, more serious.

13.2.1 Core Tokens
// tailwind.config.ts (excerpt)
theme: {
  extend: {
    colors: {
      // Neutrals
      "sand-50":  "#f7f2ea",
      "sand-100": "#e6ddcf",
      "sand-900": "#231b15",

      // Shared accent (tennis ball)
      "ball":     "#f5e663",

      // Player (court)
      "court-100": "#d4e7c7",
      "court-300": "#8fbe7f",
      "court-500": "#4f8b44",   // primary player green
      "court-700": "#2f5b2a",
      "court-blue": "#4d9de0",

      // Admin (clay)
      "clay-100":  "#f5d0b8",
      "clay-300":  "#e68f66",
      "clay-500":  "#c95e3f",   // primary admin clay
      "clay-700":  "#8a3622",

      // Status
      "success": "#4f8b44",
      "danger":  "#d64545",
      "warning": "#f5a623"
    },
    borderRadius: {
      card: "18px",
      pill: "9999px",
    },
    boxShadow: {
      card: "0 14px 30px rgba(0,0,0,0.06)", // soft matte shadow
    },
  }
}


Matte feel: avoid strong gloss/gradients; prefer flat fills with soft shadows and very subtle noise texture if desired.

13.2.2 Theme Application

Use a simple theme switch via data attributes on the root layout:

// <body data-theme="player"> or data-theme="admin">

[data-theme="player"] {
  --bg:        #f7f2ea;
  --accent:    #4f8b44;
  --accent-soft: #d4e7c7;
  --accent-alt: #4d9de0;
}

[data-theme="admin"] {
  --bg:        #f7f2ea;
  --accent:    #c95e3f;
  --accent-soft: #f5d0b8;
  --accent-alt: #4f8b44;
}


All components pull from var(--accent) etc. so they automatically restyle per context (home split screen, admin frame, player frame).

13.3 Typography

Inspired by vintage magazine covers: serif display + clean sans body.

Heading font (serif):

Primary: "Cormorant Garamond", "Times New Roman", serif

Usage: logos, page titles, section headers.

Body font (sans):

Primary: "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif

Usage: form labels, body text, buttons.

Scale:

H1: 32–40px / tight tracking, serif

H2: 24–28px / serif

H3: 20–22px / serif or bold sans

Body: 15–16px

Caption / meta: 12–13px, uppercase, increased letter spacing

13.4 Layout Patterns
13.4.1 App Shell

All pages share a minimal shell:

Top bar (height ~56px):

Left: small wordmark (serif): “Court Club” / “Ping Pong Bracket” etc.

Right (admin): current tournament name, status pill, optional admin actions.

Content container:

Max width: 1120–1280px

Horizontal padding: 16–24px mobile, 40px desktop

Vertical padding: 24–40px

Background:

Root background uses var(--bg) (sand/off-white).

Individual “surfaces” (cards) sit on top using white/sand with subtle shadow.

13.4.2 Home (Split Screen)

Desktop:

Full viewport height.

Left column (Player) ~50% width:

Solid court-500 background.

White court-line frame (1–2 px) inset from edges.

Large serif title (“Play”) + description, primary CTA button “Enter as Player”.

Right column (Admin) ~50% width:

Solid clay-500 background.

Similar line-drawing / net motif.

Serif title (“Organize”) + CTA “Enter as Admin”.

Mobile:

Stack vertically:

Top section: Player, tall “hero”.

Bottom section: Admin.

Maintain color blocks and court lines.

13.4.3 Admin Dashboard

Clay theme (data-theme="admin").

Background sand; main content on a centered column.

Tournaments displayed as cards:

Card header: tournament name (serif H3), status pill (joining / in progress / completed).

Meta row: join deadline, player count, short description.

Actions row: buttons (“Start”, “View bracket”).

Tournament creation form appears above cards in a dedicated card with subtle iconography (whistle, clipboard).

13.4.4 Player Entry

Court theme (data-theme="player").

Centered narrow column, with top portion showing a simplified overhead court (flat illustration).

Flow:

Card: “Enter Tournament” – password field + submit button.

On success: second card slides in for name + skill rating.

On mobile, everything remains single-column; on desktop, form stays centered with large margins.

13.5 Core UI Components

All components live under src/components/ui and are theme-aware via CSS variables / Tailwind classes.

13.5.1 Button

Variants:

primary – filled var(--accent), white text.

secondary – outlined (border var(--accent)), text var(--accent), neutral background.

ghost – subtle hover, used for less prominent actions.

Key properties:

<Button variant="primary" size="md">Start Tournament</Button>
<Button variant="secondary" size="sm">View Bracket</Button>
<Button variant="ghost" size="icon">?</Button>


Styling:

Border radius: rounded-pill

Height: 40–44px

Font: sans, medium weight

Hover: slightly darker accent, no gradients

Focus: 2px ball-yellow outline for accessibility.

13.5.2 Card

Used for:

Tournament list items

Forms

Player rosters

Match summaries

Styles:

bg-white or bg-sand-50

rounded-card

shadow-card

Internal padding: 20–24px

Optional top border in theme accent: 3px.

13.5.3 Input / Select

Full width in forms.

Subtle bottom border emphasis (like court lines); on focus, bottom border var(--accent) and label shifts to active state.

Small caption text for errors in danger color.

13.5.4 Status Pill

Used for tournament and match status.

Rounded pill.

Coloring:

Joining: warning background, dark text.

In progress: court-500 / clay-500 background.

Completed: neutral with subtle green border.

13.6 Bracket & Match UI

The bracket view is strongly inspired by the overhead tennis court and dotted trajectories from the New Yorker cover.

13.6.1 Bracket Layout

Winners and losers brackets arranged in columns (rounds).

Each match is a small “mini-court” card:

Thin border using var(--accent-soft).

Two horizontal “lanes” representing player slots, separated by a midline.

Player names left-aligned, seed in small serif numeral, record (W–L) in faint right-aligned text.

Between columns, draw connecting lines (SVG or CSS) that resemble dotted ball paths.

Responsiveness:

Desktop: full bracket grid with horizontal scrolling if needed.

Mobile: rounds stack vertically with a stepper / tabs at top (Round 1, Round 2, etc.).

13.6.2 Match Interaction

Clicking a match opens a bottom sheet (mobile) or side drawer (desktop):

Shows players, current scores, and a reporting form.

Theme accent used for the primary “Submit Result” button.

Completed matches:

Background slightly tinted (e.g., accent-soft).

Winner name bolded with small “🏆”-style icon or accent marker (without emojis if you prefer; can be a small dot).

13.7 Feedback & Micro-Interactions

Transitions: 150–200ms ease for hover, card elevation, and accordion expansion.

Toasts: Use small corner toasts for success/error on:

Tournament created

Joined tournament

Match result submitted / failure

Toasts respect theme (court vs clay accent bar).

Empty States:

Admin tournaments list: show a simple illustration of a net / empty court with text “No tournaments yet – create one to start the next match.”

Player bracket before start: short message explaining that the bracket will appear once the organizer starts the tournament.

13.8 Theming Implementation Details

Use a RootLayout wrapper (src/app/layout.tsx) that sets data-theme based on route:

/ uses split layout (each half manually styled).

/admin → data-theme="admin".

/player and /tournament/:id → data-theme="player" (or dynamically swapped later if you add per-tournament branding).

Define design tokens (colors, radius, shadow, spacing) once and consume via:

Tailwind utility classes (preferred for speed).

CSS modules / styled-components only for complex bracket lines if needed.

Ensure all custom components support className for composition with Tailwind utilities.

Future Enhancements
High Priority
1. 16-Player Bracket Support
Implement bracket16 configuration

Allow dynamic selection of bracket size based on player count

Ensure BYE handling generalizes

2. Enhanced Password Hashing
Replace simple hashing with bcrypt/scrypt/Argon2

Update verifyTournamentPassword and hashTournamentPassword

3. Real-Time Updates
Add polling or server-sent events for:

Bracket updates

Match completion

Reduce manual refresh in UI

4. Final Standings Algorithm
Explicit rules for rank beyond 1st/2nd

Consider:

Champion = winner of final

Runner-up = final loser

Others sorted by:

Later elimination → better rank

Higher winsCount → better rank

Add tie-breaking rules for same-round eliminations

4. Environment Variable Configuration
Location: Various API routes

Set up NEXT_PUBLIC_BASE_URL (optional; only needed if you want to generate fully-qualified shareable links client-side)

Document all required env vars

Add validation on startup

Medium Priority
5. Database Connection Pooling
Status: ✅ Completed (singleton pattern in src/lib/prisma.ts)

6. Transactions for Match Reporting
Use Prisma transactions for:

match update

player stats update

bracket routing

Avoid race conditions in simultaneous reports

Setup & Development
1. Install Dependencies
bash
Copy code
npm install
2. Prisma & Database
bash
Copy code
npx prisma migrate dev --name init
npx prisma generate
3. Run Dev Server
bash
Copy code
npm run dev
Access Points
Home: http://localhost:3000

Player Entry: http://localhost:3000/player

Admin: http://localhost:3000/admin

Tournament View: http://localhost:3000/tournament/:id

Development Workflow
Make code changes

Auto-reload via Next dev server

Run unit tests / manual tests as needed

Environment Variables
Variable	Required	Description
DATABASE_URL	Yes	Database connection string
ADMIN_PASSWORD	Yes	Admin authentication password
NEXT_PUBLIC_BASE_URL	Optional	Base URL for fully-qualified shareable links (not required for core player flow)

End of Project Specification
