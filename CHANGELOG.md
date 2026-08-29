# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
