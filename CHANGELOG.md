# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Send SMS operation (single and bulk, up to 200 recipients)
- Check Balance operation
- Get Sender IDs operation
- Get Coverage operation
- Validate Phone Numbers operation
- kwtSMS API credential type (username/password)
- Phone number normalization (digits only, international format)
- Message cleaning (strip emoji, hidden characters, convert Arabic digits)
- Duplicate number removal before sending
- Balance check before sending
- Coverage check before sending
- Test mode support (test=1)
- English and Arabic language support
