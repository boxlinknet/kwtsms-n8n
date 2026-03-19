# Security Policy

## Supported Versions

| Version | Supported          |
|---------|--------------------|
| 0.1.x   | Yes                |

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it responsibly.

**Email:** support@kwtsms.com

Please include:

- A description of the vulnerability
- Steps to reproduce the issue
- The potential impact
- Any suggested fixes (optional)

### What to expect

- You will receive an acknowledgment within 48 hours
- We will investigate and provide an initial assessment within 5 business days
- Critical vulnerabilities will be patched as soon as possible
- You will be credited in the release notes (unless you prefer to remain anonymous)

### Guidelines

- Do not publicly disclose the vulnerability until a fix has been released
- Do not exploit the vulnerability beyond what is necessary to demonstrate it
- Do not access or modify other users' data

## Security Best Practices for Users

- Never commit your kwtSMS credentials to version control
- Use n8n's built-in credential storage for API credentials
- Rotate your API password regularly
- Use the test mode (`test=1`) during development to avoid sending real messages
