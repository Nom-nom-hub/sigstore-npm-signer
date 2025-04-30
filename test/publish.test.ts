import { sign, verify } from '@sigstore/sign';
import { mockFulcio, mockRekor } from '@sigstore/mock';
import { signPackage, attachSignature } from '../src/lib/publish';
import { readFile, writeFile } from 'fs/promises';
import { createHash } from 'crypto';

jest.mock('@sigstore/sign', () => {
  const mockCreate = jest.fn().mockResolvedValue({
    serialize: jest.fn().mockReturnValue('test-signature')
  });

  return {
    sign: jest.fn(),
    verify: jest.fn(),
    OIDCSigner: jest.fn().mockImplementation(() => ({
      sign: jest.fn().mockResolvedValue('mock-signature')
    })),
    MessageSignatureBundleBuilder: jest.fn().mockImplementation(() => ({
      create: mockCreate
    })),
    BundleBuilder: jest.fn()
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

describe('publish', () => {
  const mockSign = sign as jest.MockedFunction<typeof sign>;
  const mockVerify = verify as jest.MockedFunction<typeof verify>;
  const mockReadFile = readFile as jest.MockedFunction<typeof readFile>;
  const mockWriteFile = writeFile as jest.MockedFunction<typeof writeFile>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFulcio.reset();
    mockRekor.reset();
  });

  describe('signPackage', () => {
    it('should sign package tarball successfully', async () => {
      const mockTarballContent = Buffer.from('test-package-content');
      const expectedHash = createHash('sha256').update(mockTarballContent).digest('hex');
      const mockSignature = 'test-signature';

      mockReadFile.mockResolvedValue(mockTarballContent);

      // Get access to the mocked classes
      const { OIDCSigner, MessageSignatureBundleBuilder } = jest.requireMock('@sigstore/sign');

      const result = await signPackage({
        tarballPath: 'test-package.tgz',
        fulcioUrl: mockFulcio.url,
        rekorUrl: mockRekor.url,
      });

      // Verify OIDCSigner was constructed with the right parameters
      expect(OIDCSigner).toHaveBeenCalledWith({
        fulcioUrl: mockFulcio.url,
        rekorUrl: mockRekor.url,
      });

      // Verify MessageSignatureBundleBuilder.create was called with the right parameters
      const mockCreate = MessageSignatureBundleBuilder().create;
      expect(mockCreate).toHaveBeenCalledWith({
        content: expect.any(Buffer),
        contentType: 'application/x.npm+sha256'
      });

      expect(result).toBe(mockSignature);
    });

    it('should throw error if signing fails', async () => {
      mockReadFile.mockResolvedValue(Buffer.from('test-content'));

      // Get access to the mocked MessageSignatureBundleBuilder's create method
      const { MessageSignatureBundleBuilder } = jest.requireMock('@sigstore/sign');
      const mockCreate = MessageSignatureBundleBuilder().create;

      // Make it reject with an error for this test
      mockCreate.mockRejectedValueOnce(new Error('Signing failed'));

      await expect(signPackage({
        tarballPath: 'test-package.tgz',
      })).rejects.toThrow('Signing failed');
    });
  });

  describe('attachSignature', () => {
    it('should attach signature to package.json', async () => {
      const packageJson = {};
      const signature = 'test-signature';

      await attachSignature(packageJson, signature);

      expect(packageJson).toEqual({
        sigstore: {
          signature: 'test-signature',
        },
      });
    });

    it('should preserve existing package.json fields', async () => {
      const packageJson = {
        name: 'test-package',
        version: '1.0.0',
        sigstore: {},
      };
      const signature = 'test-signature';

      await attachSignature(packageJson, signature);

      expect(packageJson).toEqual({
        name: 'test-package',
        version: '1.0.0',
        sigstore: {
          signature: 'test-signature',
        },
      });
    });
  });
});