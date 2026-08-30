# DOLLYSTICART ECOMMERCE — COMPREHENSIVE PROJECT CONTEXT

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
| Mailing | Brevo API (Transactional SMTP) | PDF Invoice delivery & notifications |
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

---

## 8. RAZORPAY PAYMENT & BREVO EMAIL INTEGRATION

### 8.1 Architectural Payment & Fulfillment Flow

The payment integration guarantees 100% price integrity and transaction security using server-authoritative calculations, HMAC-SHA256 signature verification, and dual-layer fulfillment dispatch (Client + Webhook).

```
┌────────────────────────────────────────────────────────────────────────┐
│                      RAZORPAY CHECKOUT ARCHITECTURE                    │
│                                                                        │
│  1. Customer fills address & submits at /checkout                       │
│  2. Client calls POST /api/razorpay/order                              │
│     ├── Server queries active product prices from PostgreSQL catalog   │
│     ├── Recalculates subtotal/discounts in Paise (Server-Authoritative) │
│     ├── Registers pending order & order_items in Supabase              │
│     └── Calls Razorpay SDK to create order (or Sandbox fallback ID)    │
│  3. Razorpay SDK Checkout Modal opens                                  │
│  4. Customer pays via UPI / Credit Card / NetBanking / Wallet          │
│  5. Verification & Fulfillment Dispatch (Dual Layer):                  │
│     ├── LAYER 1 (Synchronous Client Handler):                          │
│     │   POST /api/razorpay/verify -> HMAC-SHA256 Signature Verification│
│     └── LAYER 2 (Asynchronous Server Webhook):                         │
│         POST /api/razorpay/webhook -> Signature check & backup fallback│
│  6. Database updates order status to 'paid'                            │
│  7. Server compiles PDF Invoice & dispatches via Brevo Email API       │
│  8. Client redirected to /checkout/success?id=...                      │
└────────────────────────────────────────────────────────────────────────┘
```

---

### 8.2 Endpoint & Component Reference

| Module / Component | Path | Description & Purpose |
| :--- | :--- | :--- |
| **Checkout UI & Modal** | [`app/checkout/page.tsx`](app/checkout/page.tsx) | Renders address forms, dynamically injects Razorpay Checkout SDK, opens payment overlay, and includes Sandbox Testing Modal fallback. |
| **Order Generator API** | [`app/api/razorpay/order/route.ts`](app/api/razorpay/order/route.ts) | Server endpoint validating cart items against database prices, creating pending orders, and requesting Razorpay Order IDs. |
| **Signature Verification API** | [`app/api/razorpay/verify/route.ts`](app/api/razorpay/verify/route.ts) | Server endpoint verifying payment authenticity via HMAC-SHA256 hash using `RAZORPAY_KEY_SECRET`. |
| **Server Webhook Listener** | [`app/api/razorpay/webhook/route.ts`](app/api/razorpay/webhook/route.ts) | Asynchronous webhook receiving `order.paid` and `payment.captured` events directly from Razorpay servers. |
| **PDF Invoice Generator** | [`lib/pdf/invoice.tsx`](lib/pdf/invoice.tsx) | Compiles professional PDF invoice document containing order items, tax breakdown, and shipping details. |
| **Brevo Email Dispatcher** | [`lib/email/brevo.ts`](lib/email/brevo.ts) | Connects to Brevo REST API (`https://api.brevo.com/v3/smtp/email`) to dispatch confirmation emails with Base64 PDF invoice attachments. |
| **Success Receipt Page** | [`app/checkout/success/page.tsx`](app/checkout/success/page.tsx) | Customer receipt page displaying purchase summary, order reference ID, and receipt actions. |
| **Failure Retry Page** | [`app/checkout/failed/page.tsx`](app/checkout/failed/page.tsx) | Error page assisting users when payments fail or are cancelled by the customer. |

---

### 8.3 Environment Variables Setup

To connect your live or test Razorpay and Brevo accounts, add the following variables to your `.env.local` file:

```env
# ==============================================================================
# RAZORPAY PAYMENT GATEWAY CREDENTIALS
# ==============================================================================
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_YourKeyIDHere
RAZORPAY_KEY_SECRET=YourSecretKeyHere
RAZORPAY_WEBHOOK_SECRET=YourWebhookSecretHere

# ==============================================================================
# BREVO TRANSACTIONAL EMAIL CREDENTIALS
# ==============================================================================
BREVO_API_KEY=xkeysib-YourBrevoApiKeyHere
EMAIL_FROM=Dollysticart Studio <support@dollysticart.com>
```

> [!IMPORTANT]
> **Automatic Sandbox Fallback:**
> If `NEXT_PUBLIC_RAZORPAY_KEY_ID` or `BREVO_API_KEY` are not set (or contain placeholder values), the application automatically operates in **Sandbox Testing Mode**. 
> - **Checkout**: Displays a simulated payment modal allowing you to test "Simulate Success" or "Simulate Failure" without needing real API keys.
> - **Emails**: Logs invoice email payloads and PDF attachment sizes to the server console without calling external mail servers.

---

### 8.4 How to Test Payments & Webhooks

#### 1. Testing Local Sandbox Mode (No API keys required)
1. Add items to cart and proceed to `/checkout`.
2. Populate the shipping form and click **CONFIRM AND PAY**.
3. A **Razorpay Sandbox Payment** modal will appear.
4. Click **SIMULATE SUCCESS** to complete order placement and view the `/checkout/success` receipt page.

#### 2. Testing Live / Test Razorpay Keys
1. Set `NEXT_PUBLIC_RAZORPAY_KEY_ID` (e.g. `rzp_test_...`) and `RAZORPAY_KEY_SECRET` in `.env.local`.
2. Restart the Next.js dev server (`npm run dev`).
3. Open `/checkout` and click **CONFIRM AND PAY**.
4. The official Razorpay overlay will open. Enter Razorpay test UPI IDs or card numbers to test live payment verification.

#### 3. Setting Up Razorpay Server Webhooks
1. In your Razorpay Dashboard, go to **Settings** &rarr; **Webhooks** &rarr; **Add New Webhook**.
2. Set Webhook URL to: `https://your-domain.com/api/razorpay/webhook`.
3. Select active events: `order.paid`, `payment.captured`, `payment.failed`, and `refund.processed`.
4. Copy the secret key into `RAZORPAY_WEBHOOK_SECRET` in `.env.local`.

---

### 8.5 EMAIL MANAGEMENT SUMMARY CHECKLIST

Where email configurations live and what each service handles in your store:

| Location | What to Set | What it Handles | How it Works |
| :--- | :--- | :--- | :--- |
| **Vercel Environment Variables** | `BREVO_API_KEY`<br>`EMAIL_FROM` | • Order Confirmation & PDF Invoice<br>• Payment Failed Notice<br>• Digital Product Downloads<br>• Order Shipped + Courier Tracking<br>• Out for Delivery Notice<br>• Order Cancelled & Refunded<br>• Newsletter Signups | **REQUIRED**: Connects to Brevo REST API (`lib/email/brevo.ts`). Dispatches emails using Brevo Visual Templates, dynamic parameters (`params`), and PDF attachments. |
| **Supabase Dashboard** | Brevo SMTP Credentials<br>*(Port 587)* | • New User Email Verification<br>• Password Reset links | **OPTIONAL**: Set under Supabase **Project Settings** &rarr; **Authentication** &rarr; **SMTP Settings**. Sends custom branded account auth links. |

---

### Quick Event-to-Email Reference Table

| Event / Trigger | Environment Variable / Feature | Delivery Details & Idempotency Rules |
| :--- | :--- | :--- |
| **Order Paid** | `BREVO_TEMPLATE_ORDER_CONFIRMATION` | Sent **ONCE** after Razorpay payment verification on backend. Includes attached PDF invoice. |
| **Payment Failed** | `BREVO_TEMPLATE_PAYMENT_FAILED` | Sent ONLY on genuine Razorpay `payment.failed` webhooks. Never sent on modal dismissal. |
| **Digital Download** | `BREVO_TEMPLATE_DIGITAL_DOWNLOAD` | Includes 7-day signed download link. Customers get **lifetime access** by regenerating links anytime in `/account`. |
| **Order Shipped** | `BREVO_TEMPLATE_ORDER_SHIPPED` | Sent when Admin updates status to `shipped` + inputs courier name, tracking number, and tracking URL. |
| **Out for Delivery** | `BREVO_TEMPLATE_OUT_FOR_DELIVERY` | Sent when Admin updates status to `out_for_delivery`. |
| **Order Cancelled** | `BREVO_TEMPLATE_ORDER_CANCELLED` | Sent when Admin or system marks order status as `cancelled`. |
| **Refund Completed** | `BREVO_TEMPLATE_REFUND_COMPLETED` | Sent when payment status changes to `refunded` / `refund.processed` webhook. |
| **Newsletter Signup** | `BREVO_NEWSLETTER_LIST_ID` | Adds subscriber email directly to Brevo Contact List (`/api/newsletter/subscribe`). |




