# Traducteur Rapide Server

A TypeScript Express.js server for "Traducteur Rapide" (Quick Translator) with HMAC-based activation keys and LibreTranslate integration.

## Features

- 🔐 **HMAC-based activation system** - Secure key verification with expiry dates
- 🌍 **Translation service** - LibreTranslate API integration for text translation  
- 🚀 **TypeScript & Express** - Modern, type-safe backend architecture
- 🛡️ **Security middleware** - Helmet, CORS, rate limiting
- 🧪 **Testing** - Jest unit tests for key verification
- 🔧 **Key generation tools** - CLI tool for creating demo activation keys

## Quick Start

### 1. Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env
```

### 2. Configure Environment

Edit `.env` file with your settings:

```env
# CRITICAL: Change this secret in production!
ACT_KEY_SECRET=your_super_secure_secret_key_here
PORT=4000
NODE_ENV=development

# Optional: LibreTranslate API key for higher limits
LIBRETRANSLATE_API_KEY=your_api_key_here
```

### 3. Generate Demo Keys

```bash
# Generate demo activation keys
npm run generate-key

# Generate custom key
npm run generate-key "my-user" "premium" 30
```

### 4. Start Server

```bash
# Development mode (with hot reload)
npm run dev

# Production build and start
npm run build
npm start
```

## API Endpoints

### POST /api/activate

Activate a user with HMAC-signed key.

**Request:**
```json
{
  "key": "eyJpZGVudGlmaWVyIjoidGVzdC11c2VyIiwiZXhwaXJ5IjoiMjAyNC0xMi0zMVQyMzo1OTo1OS4wMDBaIiwicGxhbiI6InByZW1pdW0iLCJub25jZSI6ImFiYzEyMyJ9.signature"
}
```

**Response (Success):**
```json
{
  "ok": true,
  "identifier": "test-user",
  "plan": "premium", 
  "expiry": "2024-12-31T23:59:59.000Z"
}
```

**Response (Error):**
```json
{
  "ok": false,
  "reason": "Key has expired"
}
```

### POST /api/translate

Translate text using LibreTranslate API. Requires active session.

**Headers:**
```
X-Identifier: test-user
```

**Request:**
```json
{
  "text": "Hello world",
  "source": "en", 
  "target": "fr"
}
```

**Response:**
```json
{
  "ok": true,
  "translatedText": "Bonjour le monde"
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "ok": true,
  "service": "Traducteur Rapide",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Activation Key Format

Keys use HMAC-SHA256 signatures with this structure:

```
Payload: identifier|expiryIso|plan|nonce
Signature: HMAC-SHA256(payload, ACT_KEY_SECRET)  
Final Key: Base64URL(payload.signature)
```

**Example payload:**
```
demo-user|2024-12-31T23:59:59.000Z|premium|abc123def456
```

## Usage Examples

### 1. Activate a User

```bash
curl -X POST http://localhost:4000/api/activate \
  -H "Content-Type: application/json" \
  -d '{"key":"YOUR_ACTIVATION_KEY_HERE"}'
```

### 2. Translate Text

```bash
# First activate, then translate
curl -X POST http://localhost:4000/api/translate \
  -H "Content-Type: application/json" \
  -H "X-Identifier: demo-user-premium" \
  -d '{
    "text": "Hello, how are you?",
    "source": "en",
    "target": "es"
  }'
```

### 3. Complete Workflow

```bash
# 1. Generate key
npm run generate-key

# 2. Use the generated key to activate
curl -X POST http://localhost:4000/api/activate \
  -H "Content-Type: application/json" \
  -d '{"key":"GENERATED_KEY_FROM_STEP_1"}'

# 3. Translate with the activated identifier  
curl -X POST http://localhost:4000/api/translate \
  -H "Content-Type: application/json" \
  -H "X-Identifier: demo-user-premium" \
  -d '{"text":"Good morning","source":"en","target":"fr"}'
```

## Development

### Project Structure

```
src/
├── app.ts                 # Express app setup
├── server.ts             # Server entry point
├── routes/               # API route handlers
│   ├── index.ts         # Route aggregator
│   ├── activate.ts      # Activation endpoint
│   └── translate.ts     # Translation endpoint
├── services/            # Business logic
│   ├── activationService.ts
│   └── translateService.ts
├── middleware/          # Custom middleware
│   └── auth.ts         # Authentication checks
└── utils/              # Utilities
    └── hmac.ts         # Key generation & verification

tools/
└── generateKey.ts      # Key generation CLI

tests/
└── hmac.test.ts       # Unit tests
```

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Watch mode for development
npm test -- --watch
```

### Custom Key Generation

```bash
# Generate key programmatically
npm run generate-key "custom-user" "enterprise" 365

# Arguments: identifier, plan, days_valid
```

## Security Considerations

### Production Deployment

1. **Change secrets**: Replace `ACT_KEY_SECRET` with a cryptographically secure value
2. **Environment variables**: Never commit `.env` files to version control
3. **HTTPS**: Always use HTTPS in production
4. **Rate limiting**: Configure appropriate rate limits for your use case
5. **API keys**: Use LibreTranslate API keys for higher request limits

### Key Management

- Keys contain expiry dates and are automatically invalidated
- Session cleanup runs automatically every hour
- Use strong, unique secrets for HMAC signing
- Consider key rotation policies for production

## LibreTranslate Integration

This server proxies translation requests to LibreTranslate:

- **Free tier**: Limited requests per day
- **API key**: Get higher limits at [libretranslate.com](https://libretranslate.com)
- **Self-hosted**: Point `LIBRETRANSLATE_URL` to your own instance

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature-name`
3. Write tests for new functionality  
4. Ensure tests pass: `npm test`
5. Submit pull request

## License

MIT License - see LICENSE file for details.