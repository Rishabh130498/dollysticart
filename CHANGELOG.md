# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
