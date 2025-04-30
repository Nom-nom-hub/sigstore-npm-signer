#!/usr/bin/env node

import { Command } from 'commander';
import { readFile, writeFile } from 'fs/promises';
import { signPackage, attachSignature } from '../lib/publish';
import { verifyPackage } from '../lib/verify';
import { loadConfig } from '../lib/config';

const program = new Command();

program
  .name('sigstore-npm-signer')
  .description('Sign and verify npm packages using Sigstore')
  .version(process.env.npm_package_version || '1.0.0');

program
  .command('publish')
  .description('Sign and publish an npm package')
  .option('--tarball <path>', 'Path to package tarball')
  .option('--fulcio-url <url>', 'Custom Fulcio URL')
  .option('--rekor-url <url>', 'Custom Rekor URL')
  .action(async (options) => {
    try {
      const config = await loadConfig();
      
      // Get package.json content
      const packageJsonPath = './package.json';
      const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'));

      // Sign the package
      const signature = await signPackage({
        tarballPath: options.tarball || `${packageJson.name}-${packageJson.version}.tgz`,
        fulcioUrl: options.fulcioUrl || config.fulcioUrl,
        rekorUrl: options.rekorUrl || config.rekorUrl,
      });

      // Attach signature to package.json
      await attachSignature(packageJson, signature);
      await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));

      console.log('Package signed successfully');
    } catch (error) {
      console.error('Failed to sign package:', error.message);
      process.exit(1);
    }
  });

program
  .command('verify')
  .description('Verify an npm package signature')
  .option('--tarball <path>', 'Path to package tarball')
  .option('--fulcio-url <url>', 'Custom Fulcio URL')
  .option('--rekor-url <url>', 'Custom Rekor URL')
  .action(async (options) => {
    try {
      const packageJson = JSON.parse(await readFile('./package.json', 'utf8'));

      await verifyPackage({
        tarballPath: options.tarball || `${packageJson.name}-${packageJson.version}.tgz`,
        packageJson,
        fulcioUrl: options.fulcioUrl,
        rekorUrl: options.rekorUrl,
      });

      console.log('Package signature verified successfully');
    } catch (error) {
      console.error('Signature verification failed:', error.message);
      process.exit(1);
    }
  });

program.parse(process.argv);
