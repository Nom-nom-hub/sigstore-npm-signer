# sigstore-npm-signer

[![npm version](https://img.shields.io/npm/v/sigstore-npm-signer.svg)](https://www.npmjs.com/package/sigstore-npm-signer)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Test Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen.svg)](https://github.com/yourusername/sigstore-npm-signer)
[![Node.js Version](https://img.shields.io/node/v/sigstore-npm-signer.svg)](https://nodejs.org)

Sign and verify npm packages using [Sigstore](https://www.sigstore.dev/) for enhanced supply chain security.

## Overview

`sigstore-npm-signer` provides a seamless way to integrate Sigstore's keyless signing and verification capabilities with your npm packages. This helps ensure the integrity and authenticity of packages throughout the software supply chain.

## Features

- 🔐 **Keyless Signing**: Sign npm packages without managing private keys
- ✅ **Verification**: Verify package signatures during installation
- 🔄 **CI/CD Integration**: Easily integrate with CI/CD pipelines
- ⚙️ **Configurable**: Customize signing and verification behavior via `.signerrc`
- 📦 **npm Workflow**: Hooks into `npm publish` to sign the package tarball with Sigstore
- 🛡️ **Security**: Hooks into `npm install` to verify the signature and abort on invalid provenance
- 🔑 **Zero-Secret Signing**: GitHub Actions workflow for zero-secret signing using OIDC

## Requirements

- Node.js ≥ 18.17.0

## Installation

```bash
npm install -g sigstore-npm-signer
```

Or as a project dependency:

```bash
npm install sigstore-npm-signer
```

## Usage

### Signing a Package

```bash
# Sign and publish a package
npx sigstore-npm-signer publish

# Optionally specify a tarball path
npx sigstore-npm-signer publish --tarball your-package-1.0.0.tgz
```

### Verifying a Package

```bash
# Verify a package
npx sigstore-npm-signer verify

# Optionally specify a tarball path
npx sigstore-npm-signer verify --tarball your-package-1.0.0.tgz
```

## Configuration

Create a `.signerrc` file in your project root to customize behavior:

```json
{
  "allowedPublishers": ["github:username", "email@example.com"],
  "enforceVerification": true,
  "fulcioUrl": "https://fulcio.example.com",
  "rekorUrl": "https://rekor.example.com"
}
```

### Configuration Options

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `allowedPublishers` | `string[]` | List of allowed publishers (GitHub usernames or email addresses) | `[]` |
| `enforceVerification` | `boolean` | Whether to enforce signature verification on install | `true` |
| `fulcioUrl` | `string` | Custom Fulcio URL | Sigstore default |
| `rekorUrl` | `string` | Custom Rekor URL | Sigstore default |

## API

### Signing

```typescript
import { signPackage } from 'sigstore-npm-signer';

// Sign a package
const signature = await signPackage({
  tarballPath: 'your-package-1.0.0.tgz',
  fulcioUrl: 'https://fulcio.example.com', // optional
  rekorUrl: 'https://rekor.example.com'    // optional
});
```

### Verification

```typescript
import { verifyPackage } from 'sigstore-npm-signer';

// Verify a package
await verifyPackage({
  tarballPath: 'your-package-1.0.0.tgz',
  packageJson: packageJsonObject,
  fulcioUrl: 'https://fulcio.example.com', // optional
  rekorUrl: 'https://rekor.example.com'    // optional
});
```

## How It Works

1. **Signing Process**:
   - The package tarball is hashed using SHA-256
   - The hash is signed using Sigstore's keyless signing infrastructure
   - The signature is attached to the package.json file

2. **Verification Process**:
   - The package tarball is hashed using SHA-256
   - The signature from package.json is verified against the hash
   - The verification uses Sigstore's transparency log to ensure authenticity

## Development

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/sigstore-npm-signer.git
cd sigstore-npm-signer

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test
```

### Testing

The project uses Jest for testing and maintains 100% code coverage:

```bash
npm test
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

Apache-2.0

## Acknowledgements

- [Sigstore](https://www.sigstore.dev/) - For providing the keyless signing infrastructure
- [npm](https://www.npmjs.com/) - For the package management ecosystem
