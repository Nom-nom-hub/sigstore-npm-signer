import * as index from '../src/lib/index';
import * as publish from '../src/lib/publish';
import * as verify from '../src/lib/verify';
import * as config from '../src/lib/config';

describe('index', () => {
  it('should export all functions from publish module', () => {
    // Check that all exports from publish are in the index
    Object.keys(publish).forEach(key => {
      expect(index).toHaveProperty(key);
      expect(index[key]).toBe(publish[key]);
    });
  });

  it('should export all functions from verify module', () => {
    // Check that all exports from verify are in the index
    Object.keys(verify).forEach(key => {
      expect(index).toHaveProperty(key);
      expect(index[key]).toBe(verify[key]);
    });
  });

  it('should export all functions from config module', () => {
    // Check that all exports from config are in the index
    Object.keys(config).forEach(key => {
      expect(index).toHaveProperty(key);
      expect(index[key]).toBe(config[key]);
    });
  });
});
