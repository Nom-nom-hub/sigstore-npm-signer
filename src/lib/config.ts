import { cosmiconfig } from 'cosmiconfig';
import { z } from 'zod';

/**
 * Configuration module for sigstore-npm-signer
 * 
 * Handles loading and parsing of configuration from .signerrc files
 * using cosmiconfig.
 */

/**
 * Configuration schema for sigstore-npm-signer
 */
export const ConfigSchema = z.object({
  // List of allowed package publishers (GitHub usernames or email addresses)
  allowedPublishers: z.array(z.string()).default([]),
  
  // Whether to enforce signature verification on install
  enforceVerification: z.boolean().default(true),
  
  // Custom Fulcio URL (optional)
  fulcioUrl: z.string().optional(),
  
  // Custom Rekor URL (optional) 
  rekorUrl: z.string().optional(),
});

export type Config = z.infer<typeof ConfigSchema>;

/**
 * Default configuration values
 */
export const defaultConfig: Config = {
  allowedPublishers: [],
  enforceVerification: true,
};

/**
 * Loads configuration from .signerrc file using cosmiconfig
 */
export async function loadConfig(): Promise<Config> {
  const explorer = cosmiconfig('signer');
  const result = await explorer.search();

  if (!result || result.isEmpty) {
    return defaultConfig;
  }

  try {
    return ConfigSchema.parse(result.config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid configuration: ${error.errors.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
}
