# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.30] - 2026-08-30

### Added
- Created public Privacy Policy page ([`app/privacy/page.tsx`](file:///d:/Projects/antigravity/dollysticart_ecom/app/privacy/page.tsx)) and Terms of Service page ([`app/terms/page.tsx`](file:///d:/Projects/antigravity/dollysticart_ecom/app/terms/page.tsx)) with dynamic database content resolution.
- Added Admin CMS editors for Privacy Policy ([`app/admin/privacy/page.tsx`](file:///d:/Projects/antigravity/dollysticart_ecom/app/admin/privacy/page.tsx)) and Terms of Service ([`app/admin/terms/page.tsx`](file:///d:/Projects/antigravity/dollysticart_ecom/app/admin/terms/page.tsx)) supporting inline editing, draft saving, and live publishing.
- Added Privacy Policy and Terms of Service navigation links to Storefront Footer ([`components/layout/Footer.tsx`](file:///d:/Projects/antigravity/dollysticart_ecom/components/layout/Footer.tsx)) and Admin Sidebar ([`app/admin/layout.tsx`](file:///d:/Projects/antigravity/dollysticart_ecom/app/admin/layout.tsx)).
- Built country-specific mobile phone validation and digit sanitization helpers ([`lib/utils/phone-helpers.ts`](file:///d:/Projects/antigravity/dollysticart_ecom/lib/utils/phone-helpers.ts)) with landline/telephone support on checkout (`app/checkout/page.tsx`).

### Changed
- Updated support email address across all transactional email templates (`lib/email/email-events.ts`, `lib/email/brevo.ts`, `lib/pdf/invoice.tsx`), contact pages (`app/contact/page.tsx`, `app/admin/contact/page.tsx`), and policy documents to `letsmaildoly@gmail.com`.
- Updated email header and subject branding titles from `DOLLYSTICART STUDIO` / `Dollysticart Studio` to `DOLLYSTICART` / `Dollysticart`.

### Fixed
- Fixed missing cart item thumbnail renders by joining `product_images` in cart database queries (`app/cart/page.tsx`).
- Updated global CSS hover text overrides (`app/globals.css`) forcing all child text elements to crisp 100% black (`#000000`) on neon yellow hover.
- Added `suppressHydrationWarning` to `<html>` and `<body>` tags in `app/layout.tsx` to prevent third-party script hydration attribute mismatch warnings.
- Updated Razorpay payment verification (`app/api/razorpay/verify/route.ts` & `app/api/razorpay/order/route.ts`) to support Test Mode verification pass-through and automatic Brevo transactional email dispatch.

---

## [0.1.29] - 2026-08-30

### Fixed
- Fixed CSS z-index stacking context in [`BlankPlaceholder`](file:///d:/Projects/antigravity/dollysticart_ecom/app/shop/%5B%5B...category%5D%5D/page.tsx#L20) component. Explicitly elevated image element to `z-10` and overlay to `z-20` so background containers do not obscure uploaded artwork image renders.

---

## [0.1.28] - 2026-08-30

### Fixed
- Added unified image resolver utility ([`lib/utils/image-helpers.ts`](file:///d:/Projects/antigravity/dollysticart_ecom/lib/utils/image-helpers.ts)) handling nested arrays, single object relations, direct strings, and primary flags.
- Updated product cards across Shop Catalog ([`app/shop/[[...category]]/page.tsx`](file:///d:/Projects/antigravity/dollysticart_ecom/app/shop/%5B%5B...category%5D%5D/page.tsx#L380)), Homepage ([`app/page.tsx`](file:///d:/Projects/antigravity/dollysticart_ecom/app/page.tsx#L60)), and Product Carousel ([`components/product/ProductCarousel.tsx`](file:///d:/Projects/antigravity/dollysticart_ecom/components/product/ProductCarousel.tsx#L125)) to use `getProductCardImageUrl` so artwork images render reliably on all product cards.

---

## [0.1.27] - 2026-08-30

### Fixed
- Updated product detail page route ([`app/product/[slug]/page.tsx`](file:///d:/Projects/antigravity/dollysticart_ecom/app/product/%5Bslug%5D/page.tsx#L27)) to query linked `product_images!left(storage_path, is_primary, sort_order)`.
- Updated [`ProductDetailsClient.tsx`](file:///d:/Projects/antigravity/dollysticart_ecom/components/product/ProductDetailsClient.tsx#L164) to render main gallery image and thumbnail image buttons for uploaded artwork assets.

---

## [0.1.26] - 2026-08-30

### Fixed
- Fixed database column mapping for product images in `app/page.tsx`, `app/shop/[[...category]]/page.tsx`, and `components/product/ProductCarousel.tsx` by querying the exact PostgreSQL schema column `storage_path` (instead of `image_url`). This resolves the issue where uploaded product artwork images were rendering as blank placeholders across the site.

---

## [0.1.25] - 2026-08-30

### Fixed
- Added explicit `export const revalidate = 0;` and `export const dynamic = 'force-dynamic';` directives on Homepage ([`app/page.tsx`](file:///d:/Projects/antigravity/dollysticart_ecom/app/page.tsx#L2)) and Shop Catalog ([`app/shop/[[...category]]/page.tsx`](file:///d:/Projects/antigravity/dollysticart_ecom/app/shop/%5B%5B...category%5D%5D/page.tsx#L8)). This disables Next.js stale page caching so newly created products (`NOTEPAD`, `Towel`, etc.) and categories reflect live across the site instantly.

---

## [0.1.24] - 2026-08-30

### Fixed
- Fixed PostgREST relational query joins across `app/shop/[[...category]]/page.tsx`, `app/page.tsx`, and `app/product/[slug]/page.tsx` by using explicit `LEFT JOIN` syntax (`categories!left(name)` & `product_images!left(image_url)`). This resolves the issue where uncategorized products or products without primary images were being filtered out by default PostgREST INNER JOIN behavior.

---

## [0.1.23] - 2026-08-30

### Fixed
- Fixed product status fallback mapping in `app/page.tsx` to automatically display non-archived products if none are marked published.
- Added automatic Product Swiper section inclusion in `app/page.tsx` guaranteeing that homepage layouts always render active products regardless of custom CMS layout configurations.
- Changed default product status in `ProductForm.tsx` from `'draft'` to `'published'` so newly created products immediately go live on the storefront.

---

## [0.1.22] - 2026-08-30

### Added
- Added dedicated **FEATURED STUDIO EDITIONS** section on homepage ([`app/page.tsx`](file:///d:/Projects/antigravity/dollysticart_ecom/app/page.tsx#L129)) to showcase products marked with **"Feature on Homepage"** (`featured = true`).

---

## [0.1.21] - 2026-08-30

### Fixed
- Fixed homepage query logic (`app/page.tsx`) to prioritize products with `featured = true` at the top of the homepage product swiper and featured product sections.

---

## [0.1.20] - 2026-08-30

### Fixed
- Fixed PostgreSQL UUID type error (`invalid input syntax for type uuid: "c1"`) by generating standard 36-character UUID strings for category seeding in both `supabase/migrations/20260830000002_seed_categories.sql` and `app/admin/categories/page.tsx`.

---

## [0.1.19] - 2026-08-30

### Added
- Created SQL migration `supabase/migrations/20260830000002_seed_categories.sql` seeding all 12 default store categories into the Supabase database.
- Added **SEED DEFAULTS** instant populator button in Admin Categories (`app/admin/categories/page.tsx`).
- Added safety deletion check in Admin Categories displaying an assigned products count warning before setting assigned products to `Uncategorized` and removing the category row.
- Added bulk checkbox selection tool (`[x] Select All` and per-row product checkboxes) and sticky **Bulk Category Assignment Bar** in Admin Shop Inventory Dashboard (`app/admin/shop/page.tsx`).

---

## [0.1.18] - 2026-08-30

### Added
- Added an inline explanatory instruction note under the **Slug (URL Keyword)** field in [`ProductForm.tsx`](file:///d:/Projects/antigravity/dollysticart_ecom/components/admin/ProductForm.tsx#L612) clarifying web address formation and manual editing rules.

---

## [0.1.17] - 2026-08-30

### Changed
- Upgraded all built-in HTML email templates (`lib/email/email-events.ts` & `lib/email/brevo.ts`) to include warm, personalized customer greetings (`Hello [First Name] ✨` / `Hello [Email Username] ✨`) and luxury Dollysticart Studio header/footer branding.
- Completely removed legacy `lib/email/resend.ts` file and purged all Resend references across the codebase.

---

## [0.1.16] - 2026-08-30

### Added
- Integrated **Brevo Transactional Email Service** across the full e-commerce lifecycle (`lib/email/brevo.ts` & `lib/email/email-events.ts`).
- Created `email_logs` database table migration (`supabase/migrations/20260830000001_email_logs.sql`) guaranteeing idempotency and tracking dispatch attempts.
- Added digital download temporary signed URL generator (`lib/storage/digital-downloads.ts`) for secure private Supabase Storage delivery.
- Added courier shipping inputs (`courier_name`, `tracking_number`, `tracking_url`) and order status email triggers (`shipped`, `out_for_delivery`, `cancelled`, `refunded`) to Admin Orders panel.
- Added **Email Activity Ledger** under Admin Settings with manual retry support.
- Created Brevo Newsletter Subscription API (`app/api/newsletter/subscribe/route.ts`).

---

## [0.1.15] - 2026-08-30

### Changed
- Replaced Resend email integration with Brevo Transactional Email API (`lib/email/brevo.ts`).
- Updated Razorpay payment verification (`/api/razorpay/verify`) and webhook (`/api/razorpay/webhook`) routes to dispatch PDF invoice emails using Brevo REST API (`https://api.brevo.com/v3/smtp/email`).
- Updated environment setup documentation and tech stack guide in `README.md` to reference `BREVO_API_KEY`.

---

## [0.1.14] - 2026-08-30

### Added
- Added Razorpay webhook endpoint (`app/api/razorpay/webhook/route.ts`) to verify asynchronous server-to-server payment notifications (`order.paid`, `payment.captured`).
- Verified server-side price calculation and order insertion API (`/api/razorpay/order`).
- Verified cryptographic signature verification via HMAC-SHA256 (`/api/razorpay/verify`).
- Verified Razorpay checkout modal SDK integration and Sandbox testing fallback UI (`app/checkout/page.tsx`).

---

## [0.1.13] - 2026-08-30

### Added
- Implemented global Image Protection disabling right-click context menu and drag-and-drop actions on images across the storefront (`components/common/ImageProtection.tsx` & `globals.css`).
- Built browser-side WebP image optimization helper (`lib/utils/image-optimization.ts`) scaling images to max 1400px width/height and 82% WebP quality.
- Added dual-bucket storage architecture (`components/admin/ImageDropzone.tsx`) uploading master original images to private bucket `products-originals` and WebP assets to public bucket `products-web`.
- Added server action for secure signed URLs to private master assets for verified admin users (`app/actions/image-storage-actions.ts`).
- Added one-click **Batch Legacy Image Optimizer** tool in Admin Settings (`/admin/settings`) to convert existing JPG/PNG database image URLs into optimized WebP assets.

---

## [0.1.12] - 2026-08-30

### Added
- Added interactive **Image Crop Tool** (`components/admin/ImageCropModal.tsx`) with locked aspect ratio frames matching layout requirements.
- Integrated auto-playing **Product Carousel** (`components/product/ProductCarousel.tsx`) for `LATEST RELEASES` section with hover-pause, pagination indicators, and custom top spacing.
- Added recommended dimension pixel badges (e.g., `1920 × 960 px`) across image dropzones.

### Fixed
- Prominent standalone top-right action buttons (Upload ⬆️ and Delete 🗑️) without common container boxes.
- Resolved browser CORS canvas tainting (`toBlob`) by adding `crossOrigin="anonymous"` and local Blob pre-fetching.
- Fixed carousel top hover highlight border clipping with vertical padding clearance.
- Configured auto-closing of dialog and image source picker overlays upon upload completion.

---

## [0.1.11] - 2026-08-30

### Fixed
- Created OAuth callback route `app/auth/callback/route.ts` for exchange of authorization codes for sessions.
- Added user-friendly notification when Google Sign-In provider is disabled in Supabase.
- Fixed admin role assignment for whitelisted emails by creating SQL migration `20260830000000_fix_admin_whitelist_role.sql` and auto-syncing profile roles in `app/admin/layout.tsx`, `Header.tsx`, and `AccountPageClient.tsx`.

---

## [0.1.10] - 2026-08-30

### Added
- Added mandatory Confirm Password field to registration form with password matching validation.
- Added password visibility toggle buttons (`Eye` / `EyeOff` icons) on Password and Confirm Password input fields.
- Integrated real-time password match indicators featuring green checkmark (`✓`) circle badges, status text badges, and color-coded field borders.
- Updated Admin Panel links in header (desktop and mobile) and customer dashboard to open in a new tab (`target="_blank"`).

---

## [0.1.9] - 2026-08-29

### Fixed
- Fixed banner/hero images not turning colourful on hover by adding `.group:hover img` CSS selector scoped to images only, preventing sibling bleed.
- Added `pointer-events-none` to gradient overlay divs on hero banners, collection grid, and featured products section so mouse events pass through to the underlying `<img>`; CTA buttons inside retain `pointer-events-auto` to stay clickable.
- Aligned footer layout columns horizontally on mobile with horizontal scroll to maintain typography readability.
- Filtered out `_page` subpage configuration entries from loading inside the Homepage visual admin editor and draft preview canvas.
- Hidden "NO IMAGE CONFIGURED" placeholder label on mobile screens and within the admin visual editor's mobile preview frame.

---

## [0.1.8] - 2026-08-29

### Fixed
- Fixed banner/hero images not turning colourful on hover by adding `.group:hover img` CSS selector scoped to images only, preventing sibling bleed.
- Added `pointer-events-none` to gradient overlay divs on hero banners, collection grid, and featured products section so mouse events pass through to the underlying `<img>`; CTA buttons inside retain `pointer-events-auto` to stay clickable.

---

## [0.1.7] - 2026-08-29

### Changed
- Refined global grayscale hover selectors to scope the color transition to individual images/links/buttons, preventing sibling elements in the same parent group or section from lighting up.

## [0.1.6] - 2026-08-29

### Fixed
- Patched the uploader component to also hide "NO IMAGE CONFIGURED" when testing inside the admin visual editor's mobile preview frame, by using container descendant selectors matching the `.viewport-mobile` frame class.

## [0.1.5] - 2026-08-29

### Fixed
- Hided "NO IMAGE CONFIGURED" label inside image dropzones on mobile screen viewports while preserving visibility on tablet and desktop monitors.

## [0.1.4] - 2026-08-29

### Fixed
- Fixed redundant settings panels on the Admin Homepage Visual Editor. Client-side filtering now removes page-level configuration rows (ending in `_page` like `about_page`, `contact_page`, etc.) from loading onto the homepage canvas, resolving the issue where empty settings rows stacked repeatedly.

## [0.1.3] - 2026-08-29

### Changed
- Aligned footer layout columns horizontally on mobile with horizontal scroll support to prevent vertical stacking and keep typography readable.

### Fixed
- Fixed overlay text collisions on Homepage banner and lookbook campaign sections by passing a hideText prop to hide duplicate center labels when mock images are loaded.

## [0.1.2] - 2026-08-29

### Added
- Added pathname transition listener to the storefront navigation header which automatically closes the search overlay and mobile drawer when navigating.
- Bound direct click events on Account, Wishlist, and Cart icons to close the search overlay instantly.

### Fixed
- Fixed top padding on Cart, Wishlist, About, Contact, and Customize Art storefront pages, preventing titles and headers from being covered or cropped by the fixed navigation bar.

## [0.1.1] - 2026-08-29

### Added
- Consolidated visual shop dashboard at `/admin/shop` integrating product catalog table and storefront shop page title visual editor.
- Dynamic storefront loader for `/shop` loading all real items from PostgreSQL database.
- Fully functional interactive form previews in `/admin/contact` and `/admin/customize-art` pages enabling submissions in preview mode.
- Project context rules and operating standards.

### Changed
- Moved form previews overlays to prevent overlaying headers and enable title inline editing in visual page builders.
- Renamed products sidebar navigation tab to "Shop".
- Updated admin entry routing (`/admin`) redirect to target `/admin/shop`.

### Fixed
- Fixed layout alignment overlap of preview test banners.
- Resolved permission loops for whitelisted admins checking PostgreSQL custom profiles.
