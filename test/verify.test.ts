import { BundleVerifier, Bundle } from '@sigstore/sign';
import { mockFulcio, mockRekor } from '@sigstore/mock';
import { jest } from '@jest/globals';
import { verifyPackage } from '../src/lib/verify';
import { readFile } from 'fs/promises';
import { createHash } from 'crypto';

jest.mock('@sigstore/sign', () => {
  return {
    BundleVerifier: jest.fn().mockImplementation(() => ({
      verify: jest.fn(),
    })),
    Bundle: {
      parse: jest.fn().mockImplementation(() => ({})),
    },
  };
});

jest.mock('fs/promises');

// Mock the config module
jest.mock('../src/lib/config', () => ({
  loadConfig: jest.fn().mockResolvedValue({
    enforceVerification: true,
    allowedPublishers: [],
  }),
}));

// Create mock instances with jest functions
jest.mock('@sigstore/mock', () => {
  return {
    mockFulcio: {
      url: 'https://mock-fulcio.example.com',
      reset: jest.fn(),
    },
    mockRekor: {
      url: 'https://mock-rekor.example.com',
      reset: jest.fn(),
    },
  };
});

describe('verify', () => {
  // Get the mocked constructor
  const MockedBundleVerifier = BundleVerifier as jest.MockedClass<typeof BundleVerifier>;
  const mockVerify = jest.fn();

  // Setup the mock implementation
  MockedBundleVerifier.mockImplementation(() => ({
    verify: mockVerify,
  }));

  const mockBundleParse = Bundle.parse as jest.MockedFunction<typeof Bundle.parse>;
  const mockReadFile = readFile as jest.MockedFunction<typeof readFile>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFulcio.reset();
    mockRekor.reset();
    mockVerify.mockReset();
  });

  describe('verifyPackage', () => {
    const mockPackageJson = {
      name: 'test-package',
      version: '1.0.0',
      sigstore: {
        signature: 'test-signature',
      },
    };

    it('should verify package signature successfully', async () => {
      const mockTarballContent = Buffer.from('test-package-content');
      const expectedHash = createHash('sha256').update(mockTarballContent).digest('hex');

      mockReadFile.mockResolvedValue(mockTarballContent);
      mockVerify.mockResolvedValue(undefined);
      mockBundleParse.mockReturnValue({});

      await expect(verifyPackage({
        tarballPath: 'test-package.tgz',
        packageJson: mockPackageJson,
        fulcioUrl: mockFulcio.url,
        rekorUrl: mockRekor.url,
      })).resolves.toBeUndefined();

      expect(mockVerify).toHaveBeenCalledWith(
        expect.anything(),
        Buffer.from(expectedHash)
      );
      expect(mockBundleParse).toHaveBeenCalledWith('test-signature');
    });

    it('should throw error if signature is missing', async () => {
      await expect(verifyPackage({
        tarballPath: 'test-package.tgz',
        packageJson: { name: 'test-package' },
      })).rejects.toThrow('Package signature not found');
    });

    it('should throw error if verification fails', async () => {
      mockReadFile.mockResolvedValue(Buffer.from('test-content'));
      mockVerify.mockRejectedValue(new Error('Invalid signature'));

      await expect(verifyPackage({
        tarballPath: 'test-package.tgz',
        packageJson: mockPackageJson,
      })).rejects.toThrow('Signature verification failed: Invalid signature');
    });

    it('should handle non-Error objects in verification errors', async () => {
      mockReadFile.mockResolvedValue(Buffer.from('test-content'));
      // Throw a non-Error object
      mockVerify.mockRejectedValue('String error');

      await expect(verifyPackage({
        tarballPath: 'test-package.tgz',
        packageJson: mockPackageJson,
      })).rejects.toThrow('Signature verification failed: Unknown error');
    });

    it('should skip verification if not enforced', async () => {
      // Override the mock for this test only
      const { loadConfig } = require('../src/lib/config');
      loadConfig.mockResolvedValueOnce({ enforceVerification: false });

      await expect(verifyPackage({
        tarballPath: 'test-package.tgz',
        packageJson: mockPackageJson,
      })).resolves.toBeUndefined();

      expect(mockVerify).not.toHaveBeenCalled();
    });
  });
});