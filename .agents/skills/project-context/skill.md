---
name: project-context
description: Always read and prioritize the active development guardrails located in the root AGENTS.md and .agents/skills/project-context/skill.md files before running any code or terminal commands
---

# PREMIUM ART ECOMMERCE — COMPREHENSIVE PROJECT CONTEXT

## 1. PROJECT IDENTITY

- **App Name:** Dollysticart E-Commerce
- **Type:** Web Application (Responsive E-commerce Storefront + Admin Panel)
- **Framework:** Next.js (App Router + Server Actions)
- **Mission:** Build a simple, premium, secure art e-commerce website with a visual admin panel.
- **Design Inspiration:** Premium editorial experience referencing Kith (grayscale layout, minimal text, image-led, neon accents).
- **Default Currency:** INR (₹)
- **Target Audience:** Premium art collectors, bespoke commission clients, and storefront administrators.

---

## 2. ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────┐
│                       NEXT.JS FRONTEND                          │
│  ┌───────────────────────┐             ┌─────────────────────┐  │
│  │   Storefront Views    │             │     Admin Panel     │  │
│  │  (Home, Shop, About,  │             │ (Consolidated Shop, │  │
│  │   Customize, Contact) │             │  Orders, Messages)  │  │
│  └───────────────────────┘             └─────────────────────┘  │
└──────────────────────────┬────────────────────────────────────┘
                           │ API Requests / Server Actions
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NEXT.JS SERVER / API                         │
│  • Server Actions for uploader mutations                        │
│  • Dynamic storefront content loaders                           │
│  • Secure backend price calculation & cart checkout             │
└──────────────────────────┬────────────────────────────────────┘
                           │
           ┌───────────────┴───────────────┐
           ▼                               ▼
    ┌────────────┐                  ┌────────────┐
    │  SUPABASE  │                  │  RAZORPAY  │
    │ PostgreSQL │                  │  Payments  │
    │   + Auth   │                  │ (API/Test) │
    └────────────┘                  └────────────┘
```

---

## 3. COMPLETE TECH STACK

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Core Framework | Next.js (React + TypeScript) | Server components, Server Actions, routing |
| Styling | Tailwind CSS | Sleek dark mode styling, premium layouts |
| Database | Supabase PostgreSQL | Primary relational data store |
| Auth Service | Supabase Auth | Admin and customer session management |
| File Storage | Supabase Storage | Product assets and visual builder uploads (`products` bucket) |
| Payments | Razorpay API | Secured transactional gateways (Test Mode) |
| Mailing | Resend / SMTP | PDF Invoice delivery & notifications |
| Icons | Lucide React | Modern visual iconography |

---

## 4. DATABASE TABLES (SUPABASE REFERENCE)

- **`profiles`**: User session profiles mapping permissions (`role === 'admin'`).
- **`homepage_sections`**: Visual homepage grid items, draft layouts, and page configurations (e.g. `'homepage'`, `'about_page'`, `'contact_page'`, `'customize_page'`).
- **`categories`**: Dynamic collections for art taxonomies (parent/subcategories).
- **`products`**: Product catalog details (regular_price, discounted_price, and status).
- **`product_images`**: Uploaded image refs linked to Supabase storage objects.
- **`contact_messages`**: Storefront inquiries submitted via contact forms.
- **`customize_requests`**: Bespoke commissions details and delivery calendar targets.
- **`orders`**: Transaction status logs (total_amount, status).
- **`order_items`**: Purchase snapshot line-items.

---

## 5. BUSINESS RULES & SECURITY PRINCIPLES

### 5.1 Pricing Integrity (Server-Side Calculation)
- **NEVER trust client-supplied prices**: The frontend displays prices for presentation purposes only.
- **Autoritative Math**: During checkout, only product IDs and quantities are sent. The server queries active product database values, verifies availability, calculates subtotals/discounts, and generates the Razorpay order token with the calculated amount.

### 5.2 Access Control (RBAC & RLS)
- **Role Verification**: Admin routes (`/admin/*`) and uploader mutations verify authorization by querying the database `profiles` table to ensure `role === 'admin'`.
- **Database Rules (RLS)**: Row Level Security is enabled on PostgreSQL tables. Customers can read/write only their own carts/orders, while visual page definitions and configurations are writable only by authenticated administrators.

### 5.3 File Upload Restrictions
- Direct storage uploads must validate file sizes (limit to 5MB max), extensions (only `.jpg`, `.jpeg`, `.png`, `.webp`), and use randomly generated filenames (UUIDs) for physical objects in storage.

---

## 6. GITHUB WORKFLOW (VERSION CONTROL)

### 6.1 Capsulit Commit Standard
We strictly follow the CAPSULIT COMMIT STANDARD for all version control, commits, and releases:

> [!IMPORTANT]
> **CRITICAL RELEASE COMMIT RULE:**
> You MUST ALWAYS follow the exact release commit format specified in Pointer 7 below.
> Daily commit messages MUST NEVER contain version numbers. Version numbers are allowed and required ONLY inside the official release commit (matching the `release: v<major>.<minor>.<patch>` pattern) and corresponding Git tags. This is an urgent, non-negotiable standard.

#### 1. Commit Message Format
`<type>(<scope>): <subject>`

`[optional body]`

`[optional footer]`

#### 2. Types (Map to Semantic Versioning)
- `feat` (MINOR): New features
- `fix` (PATCH): Bug fixes
- `refactor` (None): Code change, same behavior
- `perf` (None): Performance improvement
- `test` (None): Adding/updating tests
- `docs` (None): Documentation only
- `chore` (None): Deps, build, CI, tooling, config
- `release` (Tag-based): Version bump commits ONLY

#### 3. Scopes
- `auth`      → Authentication, login, signup
- `cart`      → Cart, checkout flow
- `orders`    → Order placements, status tracking
- `profile`   → Admin auth check, whitelist logic
- `payments`  → Razorpay integration, verification
- `products`  → Product editing, permanent deletion
- `cms`       → Visual page editor builders, image uploads
- `ui`        → Borders, margins, grids, layout fixes
- `deps`      → Dependency updates
- `config`    → Environment parameters, next configuration

#### 4. Subject Rules
- Maximum 50 characters
- Use imperative mood: "add" not "added", "fix" not "fixed"
- No period at the end
- No version numbers in subject (except release commits)

#### 5. Body Rules (Optional)
- Explain WHAT and WHY, not HOW

#### 6. Release Commits (ONLY place version appears)
Use EXACTLY this format:
`release: v<major>.<minor>.<patch>`

`## [<major>.<minor>.<patch>] - YYYY-MM-DD`

`### Added`
`- feat(<scope>): <description>`

`### Fixed`
`- fix(<scope>): <description>`

`### Changed`
`- chore(<scope>): <description>`

`---`
`Tag: v<major>.<minor>.<patch>`

Create Git tag:
`git tag -a v<major>.<minor>.<patch> -m "release: v<major>.<minor>.<patch>"`

---

## 7. TESTING CHECKLIST (Per Feature)

Before marking any feature as complete:
- [ ] Feature works in happy path
- [ ] Feature handles error cases gracefully (visual placeholders show if images are missing)
- [ ] Security middleware applied (role query verification)
- [ ] No secrets hardcoded in client code
- [ ] Feature committed to Git with Capsulit-compliant commit message
- [ ] Build compiles successfully via `npm run build`
