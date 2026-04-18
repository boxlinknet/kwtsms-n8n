# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2026-04-19

### Changed

- Removed ERR013 retry loop; queue-full errors now surface to the caller for handling at workflow level
- Send flow no longer calls `/balance/` before every send; uses cached balance from prior send responses or Get Balance op, skipping the check if no cache is available
- Coverage pre-check now narrows its error catch to `ERR033` only; network and auth errors bubble correctly
- Phone number input now accepts commas, semicolons, newlines, and tabs as separators
- User-facing errors in the node execute flow now use `NodeOperationError` for consistent UI styling
- Credentials class exposes an `icon` for the kwtSMS list view
- Resource dropdown options are alphabetical and carry descriptions for AI-tool use via `usableAsTool`
- `Sender ID` field is no longer marked `required` so the credential-level default can apply when left blank

### Added

- CI workflow running lint, type-check, and build on every push and PR
- Response shape validation in the API helper to reject non-JSON/non-object gateway responses
- `mode`, `invalidInputs`, and masked `skippedNumbers` fields on send results
- `engines.node >= 18` in package metadata

### Removed

- Undocumented `subcategories` field from `KwtSms.node.json` (outside the supported codex schema)
- Dead `additionalFields.language` parameter that was defined in the UI but never sent to the API

### Fixed

- Inputs/outputs now use the `NodeConnectionTypes.Main` enum instead of string literals, matching the n8n node type description reference

## [0.1.4] - 2026-03-19

### Changed

- `Test Mode` is now a top-level parameter (defaults to on) rather than nested in an additional-fields collection

## [0.1.3] - 2026-03-19

### Changed

- `Test Mode` default is now on, so new workflows cannot accidentally send real SMS while being built

## [0.1.2] - 2026-03-19

### Changed

- API helper now uses `httpRequestWithAuthentication` so credentials flow through n8n's standard auth pipeline
- Publish workflow hardening

## [0.1.1] - 2026-03-19

### Added

- Dependabot auto-merge workflow for patch and minor version bumps
- CI workflows and README improvements

### Fixed

- n8n verification scanner issues flagged during community-node submission
- Documentation URL points at the kwtSMS integrations page

## [0.1.0] - 2026-03-19

### Added

- Send SMS operation (single and bulk, up to 200 recipients per request, with auto-batching for larger lists)
- Check Balance operation
- List Sender IDs operation
- Get Coverage operation
- Validate Phone Numbers operation
- kwtSMS API credential type (username + password + default sender ID)
- Phone number normalization (Arabic/Hindi → Latin digits, strip non-digits, strip leading zeros)
- Message cleaning (strip emoji, hidden control characters, HTML tags)
- Duplicate number removal before sending
- Pre-send balance and coverage checks
- Test mode support (`test=1`)
- English and Arabic language support

[Unreleased]: https://github.com/boxlinknet/kwtsms-n8n/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/boxlinknet/kwtsms-n8n/compare/v0.1.4...v0.2.0
[0.1.4]: https://github.com/boxlinknet/kwtsms-n8n/compare/v0.1.3...v0.1.4
[0.1.3]: https://github.com/boxlinknet/kwtsms-n8n/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/boxlinknet/kwtsms-n8n/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/boxlinknet/kwtsms-n8n/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/boxlinknet/kwtsms-n8n/releases/tag/v0.1.0
