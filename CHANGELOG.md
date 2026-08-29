# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
