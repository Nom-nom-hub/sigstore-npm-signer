import { loadConfig, ConfigSchema, defaultConfig } from '../src/lib/config';
import { cosmiconfig } from 'cosmiconfig';
import { z } from 'zod';

// Mock cosmiconfig
jest.mock('cosmiconfig', () => ({
  cosmiconfig: jest.fn(),
}));

describe('config', () => {
  const mockExplorer = {
    search: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (cosmiconfig as jest.MockedFunction<typeof cosmiconfig>).mockReturnValue(mockExplorer as any);
  });

  it('should return default config when no config file exists', async () => {
    mockExplorer.search.mockResolvedValue(null);

    const config = await loadConfig();

    expect(config).toEqual(defaultConfig);
    expect(cosmiconfig).toHaveBeenCalledWith('signer');
    expect(mockExplorer.search).toHaveBeenCalled();
  });

  it('should return default config when config file is empty', async () => {
    mockExplorer.search.mockResolvedValue({ isEmpty: true, config: {}, filepath: '/path/to/config' });

    const config = await loadConfig();

    expect(config).toEqual(defaultConfig);
  });

  it('should parse and return valid config', async () => {
    const mockConfig = {
      allowedPublishers: ['user1', 'user2'],
      enforceVerification: false,
      fulcioUrl: 'https://custom-fulcio.example.com',
      rekorUrl: 'https://custom-rekor.example.com',
    };

    mockExplorer.search.mockResolvedValue({
      config: mockConfig,
      filepath: '/path/to/config',
      isEmpty: false,
    });

    const config = await loadConfig();

    expect(config).toEqual(mockConfig);
  });

  it('should throw error for invalid config (Zod validation error)', async () => {
    const invalidConfig = {
      allowedPublishers: 'not-an-array', // This should be an array
      enforceVerification: 'not-a-boolean', // This should be a boolean
    };

    mockExplorer.search.mockResolvedValue({
      config: invalidConfig,
      filepath: '/path/to/config',
      isEmpty: false,
    });

    await expect(loadConfig()).rejects.toThrow('Invalid configuration:');
  });

  it('should rethrow non-Zod errors', async () => {
    const genericError = new Error('Generic error');

    // Mock ConfigSchema.parse to throw a generic error
    jest.spyOn(ConfigSchema, 'parse').mockImplementation(() => {
      throw genericError;
    });

    mockExplorer.search.mockResolvedValue({
      config: {},
      filepath: '/path/to/config',
      isEmpty: false,
    });

    await expect(loadConfig()).rejects.toThrow(genericError);
  });
});
