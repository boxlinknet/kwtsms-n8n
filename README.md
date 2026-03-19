# n8n-nodes-kwtsms

n8n community node for the [kwtSMS](https://www.kwtsms.com) gateway. Send SMS messages, check balance, validate numbers, and manage sender IDs directly from your n8n workflows.

## Features

- **Send SMS** - Send single or bulk SMS messages (up to 200 recipients per request)
- **Check Balance** - Query your current account balance
- **Get Sender IDs** - Retrieve your approved sender ID list
- **Get Coverage** - Check supported countries and operator coverage
- **Validate Phone Numbers** - Verify phone number format and reachability

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

To use this node, you need a kwtSMS API account.

1. Sign up or log in at [kwtsms.com](https://www.kwtsms.com)
2. Navigate to your API settings
3. Note your **username** and **password**
4. In n8n, create a new **kwtSMS API** credential
5. Enter your username and password

## Operations

| Operation | Description |
|-----------|-------------|
| Send SMS | Send an SMS to one or more recipients |
| Check Balance | Retrieve your current account balance |
| Get Sender IDs | List all approved sender IDs on your account |
| Get Coverage | Check country and operator coverage |
| Validate Numbers | Validate phone numbers before sending |

## Phone Number Format

Phone numbers must be in international format using digits only, without the `+` or `00` prefix.

Example: `96598765432`

## Compatibility

- n8n version 1.0 or later
- Node.js 18 or later

## Resources

- [kwtSMS API Documentation](https://www.kwtsms.com/API/)
- [kwtSMS Website](https://www.kwtsms.com)
- [n8n Community Nodes Documentation](https://docs.n8n.io/integrations/community-nodes/)

## License

[MIT](LICENSE)
