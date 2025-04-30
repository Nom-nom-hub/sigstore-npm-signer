import { BundleVerifier } from '@sigstore/sign';
import { Bundle } from '@sigstore/sign';
import { readFile } from 'fs/promises';
import { createHash } from 'crypto';
import { Config, loadConfig } from './config';

/**
 * Verification module for sigstore-npm-signer
 * 
 * Handles verifying the Sigstore signature of an npm package
 * during installation.
 */

/**
 * Options for verifying a package
 */
export interface VerifyOptions {
  /** Path to the package tarball */
  tarballPath: string;
  /** Package metadata containing signature */
  packageJson: any;
  /** Optional custom Fulcio URL */
  fulcioUrl?: string;
  /** Optional custom Rekor URL */
  rekorUrl?: string;
}

/**
 * Verifies a package signature using Sigstore
 * @throws {Error} If verification fails or is not enforced
 */
export async function verifyPackage(options: VerifyOptions): Promise<void> {
  const config = await loadConfig();

  // Skip verification if not enforced
  if (!config.enforceVerification) {
    return;
  }

  const signature = options.packageJson?.sigstore?.signature;
  if (!signature) {
    throw new Error('Package signature not found');
  }

  // Read and hash the tarball
  const tarballContent = await readFile(options.tarballPath);
  const hash = createHash('sha256').update(tarballContent).digest('hex');

  try {
    // Create bundle verifier
    const verifier = new BundleVerifier({
      fulcioUrl: options.fulcioUrl || config.fulcioUrl,
      rekorUrl: options.rekorUrl || config.rekorUrl,
    });

    // Parse and verify the signature bundle
    const bundle = Bundle.parse(signature);
    await verifier.verify(bundle, Buffer.from(hash));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Signature verification failed: ${errorMessage}`);
  }
}
