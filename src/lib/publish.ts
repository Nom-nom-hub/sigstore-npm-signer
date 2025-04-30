import { BundleBuilder, MessageSignatureBundleBuilder } from '@sigstore/sign';
import { OIDCSigner } from '@sigstore/sign';
import { createHash } from 'crypto';
import { readFile } from 'fs/promises';
import { Config, loadConfig } from './config';

/**
 * Publishing module for sigstore-npm-signer
 * 
 * Handles intercepting the npm publish process to sign the package
 * tarball with Sigstore.
 */

/**
 * Options for signing a package
 */
export interface SignOptions {
  /** Path to the package tarball */
  tarballPath: string;
  /** Optional custom Fulcio URL */
  fulcioUrl?: string;
  /** Optional custom Rekor URL */
  rekorUrl?: string;
}

/**
 * Signs a package tarball using Sigstore
 */
export async function signPackage(options: SignOptions): Promise<string> {
  const config = await loadConfig();
  
  // Read and hash the tarball
  const tarballContent = await readFile(options.tarballPath);
  const hash = createHash('sha256').update(tarballContent).digest('hex');

  // Create OIDC signer and bundle builder
  const signer = new OIDCSigner({
    fulcioUrl: options.fulcioUrl || config.fulcioUrl,
    rekorUrl: options.rekorUrl || config.rekorUrl,
  });

  // Create and build the signature bundle
  const bundleBuilder = new MessageSignatureBundleBuilder(signer);
  const bundle = await bundleBuilder.create({
    content: Buffer.from(hash),
    contentType: 'application/x.npm+sha256'
  });

  // Return the serialized bundle
  const signature = bundle.serialize();

  return signature;
}

/**
 * Attaches a signature to the package metadata
 */
export async function attachSignature(packageJson: any, signature: string): Promise<void> {
  if (!packageJson.sigstore) {
    packageJson.sigstore = {};
  }
  packageJson.sigstore.signature = signature;
}
