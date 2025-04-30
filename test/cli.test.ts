import { readFile, writeFile } from 'fs/promises';
import { signPackage, attachSignature } from '../src/lib/publish';
import { verifyPackage } from '../src/lib/verify';
import { loadConfig } from '../src/lib/config';
import { Command } from 'commander';

// Mock the required modules
jest.mock('fs/promises');
jest.mock('../src/lib/publish');
jest.mock('../src/lib/verify');
jest.mock('../src/lib/config');
jest.mock('commander');

// Mock console.log and console.error
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const mockExit = jest.spyOn(process, 'exit').mockImplementation((code) => {
  throw new Error(`Process.exit(${code})`);
});

describe('CLI', () => {
  let mockCommandInstance: any;
  let publishActionCallback: any;
  let verifyActionCallback: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset process.argv
    process.argv = ['node', 'sigstore-npm-signer'];

    // Mock console methods
    console.log = jest.fn();
    console.error = jest.fn();

    // Mock loadConfig
    (loadConfig as jest.Mock).mockResolvedValue({
      fulcioUrl: 'https://default-fulcio.example.com',
      rekorUrl: 'https://default-rekor.example.com',
      enforceVerification: true,
      allowedPublishers: [],
    });

    // Mock readFile
    (readFile as jest.Mock).mockResolvedValue(JSON.stringify({
      name: 'test-package',
      version: '1.0.0',
    }));

    // Mock writeFile
    (writeFile as jest.Mock).mockResolvedValue(undefined);

    // Mock signPackage
    (signPackage as jest.Mock).mockResolvedValue('test-signature');

    // Mock verifyPackage
    (verifyPackage as jest.Mock).mockResolvedValue(undefined);

    // Mock attachSignature
    (attachSignature as jest.Mock).mockImplementation((packageJson, signature) => {
      packageJson.sigstore = { signature };
      return Promise.resolve();
    });

    // Setup Commander mock
    mockCommandInstance = {
      name: jest.fn().mockReturnThis(),
      description: jest.fn().mockReturnThis(),
      version: jest.fn().mockReturnThis(),
      command: jest.fn().mockImplementation(() => {
        return {
          description: jest.fn().mockReturnThis(),
          option: jest.fn().mockReturnThis(),
          action: jest.fn().mockImplementation((callback) => {
            // Store the action callback for testing
            if (publishActionCallback === undefined) {
              publishActionCallback = callback;
            } else {
              verifyActionCallback = callback;
            }
            return this;
          }),
        };
      }),
      parse: jest.fn(),
    };

    (Command as jest.Mock).mockImplementation(() => mockCommandInstance);

    // Load the CLI module to set up the commands
    jest.isolateModules(() => {
      require('../src/bin/sigstore-npm-signer');
    });
  });

  afterEach(() => {
    // Restore console methods
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  describe('publish command', () => {
    it('should sign and publish a package with default options', async () => {
      // Call the publish action with default options
      await publishActionCallback({});

      // Verify the correct functions were called
      expect(loadConfig).toHaveBeenCalled();
      expect(readFile).toHaveBeenCalledWith('./package.json', 'utf8');
      expect(signPackage).toHaveBeenCalledWith({
        tarballPath: 'test-package-1.0.0.tgz',
        fulcioUrl: 'https://default-fulcio.example.com',
        rekorUrl: 'https://default-rekor.example.com',
      });
      expect(attachSignature).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'test-package', version: '1.0.0' }),
        'test-signature'
      );
      expect(writeFile).toHaveBeenCalledWith(
        './package.json',
        expect.any(String)
      );
      expect(console.log).toHaveBeenCalledWith('Package signed successfully');
    });

    it('should sign and publish a package with custom options', async () => {
      // Call the publish action with custom options
      await publishActionCallback({
        tarball: 'custom-tarball.tgz',
        fulcioUrl: 'https://custom-fulcio.example.com',
        rekorUrl: 'https://custom-rekor.example.com',
      });

      // Verify the correct functions were called with custom options
      expect(signPackage).toHaveBeenCalledWith({
        tarballPath: 'custom-tarball.tgz',
        fulcioUrl: 'https://custom-fulcio.example.com',
        rekorUrl: 'https://custom-rekor.example.com',
      });
    });

    it('should handle errors during publish', async () => {
      // Make signPackage throw an error
      (signPackage as jest.Mock).mockRejectedValue(new Error('Signing failed'));

      // Call the publish action and expect it to exit with code 1
      await expect(publishActionCallback({})).rejects.toThrow('Process.exit(1)');

      // Verify error was logged
      expect(console.error).toHaveBeenCalledWith(
        'Failed to sign package:',
        'Signing failed'
      );
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });

  describe('verify command', () => {
    it('should verify a package with default options', async () => {
      // Call the verify action with default options
      await verifyActionCallback({});

      // Verify the correct functions were called
      expect(readFile).toHaveBeenCalledWith('./package.json', 'utf8');
      expect(verifyPackage).toHaveBeenCalledWith({
        tarballPath: 'test-package-1.0.0.tgz',
        packageJson: expect.objectContaining({ name: 'test-package', version: '1.0.0' }),
        fulcioUrl: undefined,
        rekorUrl: undefined,
      });
      expect(console.log).toHaveBeenCalledWith('Package signature verified successfully');
    });

    it('should verify a package with custom options', async () => {
      // Call the verify action with custom options
      await verifyActionCallback({
        tarball: 'custom-tarball.tgz',
        fulcioUrl: 'https://custom-fulcio.example.com',
        rekorUrl: 'https://custom-rekor.example.com',
      });

      // Verify the correct functions were called with custom options
      expect(verifyPackage).toHaveBeenCalledWith({
        tarballPath: 'custom-tarball.tgz',
        packageJson: expect.objectContaining({ name: 'test-package', version: '1.0.0' }),
        fulcioUrl: 'https://custom-fulcio.example.com',
        rekorUrl: 'https://custom-rekor.example.com',
      });
    });

    it('should handle errors during verify', async () => {
      // Make verifyPackage throw an error
      (verifyPackage as jest.Mock).mockRejectedValue(new Error('Verification failed'));

      // Call the verify action and expect it to exit with code 1
      await expect(verifyActionCallback({})).rejects.toThrow('Process.exit(1)');

      // Verify error was logged
      expect(console.error).toHaveBeenCalledWith(
        'Signature verification failed:',
        'Verification failed'
      );
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });

  it('should set up the CLI with correct commands and options', () => {
    // Verify the CLI was set up correctly
    expect(mockCommandInstance.name).toHaveBeenCalledWith('sigstore-npm-signer');
    expect(mockCommandInstance.description).toHaveBeenCalledWith('Sign and verify npm packages using Sigstore');
    expect(mockCommandInstance.version).toHaveBeenCalledWith(expect.any(String));
    expect(mockCommandInstance.command).toHaveBeenCalledWith('publish');
    expect(mockCommandInstance.command).toHaveBeenCalledWith('verify');
    expect(mockCommandInstance.parse).toHaveBeenCalledWith(process.argv);
  });

  it('should use default version when npm_package_version is not set', () => {
    // Save original env
    const originalEnv = process.env.npm_package_version;

    // Delete npm_package_version from env
    delete process.env.npm_package_version;

    // Reset mocks
    jest.clearAllMocks();

    // Load the CLI module again
    jest.isolateModules(() => {
      require('../src/bin/sigstore-npm-signer');
    });

    // Verify version was set with default
    expect(mockCommandInstance.version).toHaveBeenCalledWith('1.0.0');

    // Restore original env
    process.env.npm_package_version = originalEnv;
  });
});
