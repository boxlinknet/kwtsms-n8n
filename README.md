# n8n-nodes-kwtsms

[![npm version](https://img.shields.io/npm/v/n8n-nodes-kwtsms.svg)](https://www.npmjs.com/package/n8n-nodes-kwtsms)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![n8n community node](https://img.shields.io/badge/n8n-community%20node-ff6d5a.svg)](https://docs.n8n.io/integrations/community-nodes/)
[![kwtSMS](https://img.shields.io/badge/kwtSMS-gateway-FFA200.svg)](https://www.kwtsms.com)

n8n community node for the [kwtSMS](https://www.kwtsms.com) SMS gateway. Send SMS messages, check balance, validate numbers, and manage sender IDs directly from your n8n workflows.

[kwtSMS](https://www.kwtsms.com) is a Kuwait-based SMS gateway with coverage across 220+ countries, pay-as-you-go pricing, and built-in test mode. It supports both English and Arabic messages with transactional sender IDs that bypass DND for OTP delivery.

## Features

- **Send SMS**: Single or bulk (auto-batches 200+ recipients with delays and retry logic)
- **Check Balance**: Query current account credit balance
- **List Sender IDs**: Retrieve approved sender IDs on your account
- **Get Coverage**: List active country prefixes
- **Validate Numbers**: Verify phone number format and routability before sending
- **Phone Normalization**: Automatically strips prefixes, converts Arabic digits, removes duplicates
- **Message Cleaning**: Strips emoji, hidden characters, and HTML tags before sending
- **Pre-send Safety**: Checks balance and coverage before hitting the API
- **Test Mode**: Send with test=1 to validate integration without consuming credits

## Installation

### Community Node (Recommended)

1. Open your n8n instance
2. Go to **Settings** > **Community Nodes**
3. Select **Install a community node**
4. Enter `n8n-nodes-kwtsms`
5. Agree to the risks and click **Install**

### Manual Installation

```bash
cd ~/.n8n/nodes
npm install n8n-nodes-kwtsms
```

Restart n8n after installation.

## Credentials

You need a kwtSMS API account:

1. Sign up or log in at [kwtsms.com](https://www.kwtsms.com)
2. Navigate to your API settings to find your **API username** and **API password**
3. In n8n, create a new **kwtSMS API** credential
4. Enter your username, password, and default sender ID
5. Click **Test** to verify your credentials

> **Note:** The API username/password are separate from your account login credentials. Find them in your kwtSMS dashboard under API settings.

## Operations

### SMS

| Operation | Description |
|-----------|-------------|
| **Send** | Send an SMS to one or more recipients. Supports bulk sending with auto-batching, phone normalization, message cleaning, balance/coverage pre-checks, and duplicate removal. |

**Parameters:**
- **To**: Phone number(s), comma-separated. International format, digits only (e.g., `96598765432`).
- **Message**: SMS text. English: 160 chars/page. Arabic: 70 chars/page. Max 7 pages.
- **Sender ID**: Must be pre-approved on your kwtSMS account.
- **Test Mode** (optional): Send without delivering or consuming credits.

### Account

| Operation | Description |
|-----------|-------------|
| **Get Balance** | Returns available credits and total purchased credits. |
| **Get Coverage** | Returns array of active country prefixes on your account. |

### Sender

| Operation | Description |
|-----------|-------------|
| **List** | Returns all available sender IDs on your account. |

### Validation

| Operation | Description |
|-----------|-------------|
| **Validate Numbers** | Validates phone numbers and returns OK (valid), ER (format error), and NR (no route) arrays. Numbers are normalized automatically before validation. |

## Phone Number Format

Numbers are automatically normalized before any API call:
- `+96598765432` becomes `96598765432` (strip +)
- `0096598765432` becomes `96598765432` (strip 00)
- `965 9876 5432` becomes `96598765432` (strip spaces)
- Arabic/Hindi digits are converted to Latin automatically

## Error Handling

The node maps all 33 kwtSMS error codes to user-friendly messages. Common errors:

| Code | Description |
|------|-------------|
| ERR003 | Authentication failed. Check your API username and password. |
| ERR006 | No valid phone numbers provided. |
| ERR010 | Account balance is zero. |
| ERR013 | Send queue is full. The node retries automatically with backoff. |
| ERR028 | Must wait 15 seconds before sending to the same number again. |

## Compatibility

- n8n version 1.0 or later
- Node.js 18 or later

## Resources

- [kwtSMS Website](https://www.kwtsms.com)
- [kwtSMS Support](https://www.kwtsms.com/support.html)
- [n8n Community Nodes Documentation](https://docs.n8n.io/integrations/community-nodes/)

## License

[MIT](LICENSE)
