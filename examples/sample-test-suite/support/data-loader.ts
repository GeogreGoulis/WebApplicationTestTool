/**
 * WATT Test Data Loader
 *
 * Utility for loading and resolving test data from JSON files
 * Supports dot-notation paths like "users.validUser.email"
 */

import * as fs from 'fs';
import * as path from 'path';

// Cache for loaded JSON files
const dataCache: Map<string, unknown> = new Map();

// Base path for data files (configurable)
let dataBasePath = path.join(__dirname, '..', 'data');

/**
 * Set the base path for data files
 */
export function setDataBasePath(basePath: string): void {
  dataBasePath = basePath;
  dataCache.clear(); // Clear cache when path changes
}

/**
 * Load a JSON data file
 */
function loadDataFile(filename: string): unknown {
  const filePath = path.join(dataBasePath, `${filename}.json`);

  // Check cache first
  if (dataCache.has(filePath)) {
    return dataCache.get(filePath);
  }

  // Load and cache
  if (!fs.existsSync(filePath)) {
    throw new Error(`Data file not found: ${filePath}`);
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(content);
  dataCache.set(filePath, data);

  return data;
}

/**
 * Resolve a dot-notation path to a value
 * Example: "users.validUser.email" -> loads users.json and gets users.validUser.email
 *
 * @param dataPath - Dot-notation path (e.g., "users.validUser.email")
 * @returns The resolved value
 */
export function loadTestData<T = unknown>(dataPath: string): T {
  const parts = dataPath.split('.');

  if (parts.length < 2) {
    throw new Error(
      `Invalid data path: "${dataPath}". Expected format: "filename.key.subkey"`
    );
  }

  // First part is the filename
  const filename = parts[0];
  const data = loadDataFile(filename) as Record<string, unknown>;

  // Navigate through the remaining path
  let current: unknown = data;
  for (let i = 1; i < parts.length; i++) {
    const key = parts[i];

    if (current === null || current === undefined) {
      throw new Error(
        `Cannot access "${key}" on null/undefined at path: "${parts.slice(0, i).join('.')}"`
      );
    }

    if (typeof current !== 'object') {
      throw new Error(
        `Cannot access "${key}" on non-object at path: "${parts.slice(0, i).join('.')}"`
      );
    }

    current = (current as Record<string, unknown>)[key];
  }

  if (current === undefined) {
    throw new Error(`Data path not found: "${dataPath}"`);
  }

  return current as T;
}

/**
 * Check if a data path exists
 */
export function hasTestData(dataPath: string): boolean {
  try {
    loadTestData(dataPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Load entire data file as object
 */
export function loadDataFileAsObject<T = Record<string, unknown>>(
  filename: string
): T {
  return loadDataFile(filename) as T;
}

/**
 * Resolve data references in a string
 * Replaces "data:path.to.value" with actual values
 *
 * @param input - String that may contain data references
 * @returns String with resolved values
 */
export function resolveDataReferences(input: string): string {
  const dataRefPattern = /data:([a-zA-Z0-9_.]+)/g;

  return input.replace(dataRefPattern, (match, dataPath) => {
    try {
      const value = loadTestData(dataPath);
      return String(value);
    } catch (error) {
      console.warn(`Failed to resolve data reference: ${match}`);
      return match; // Return original if resolution fails
    }
  });
}

/**
 * Get all available data files
 */
export function listDataFiles(): string[] {
  if (!fs.existsSync(dataBasePath)) {
    return [];
  }

  return fs
    .readdirSync(dataBasePath)
    .filter((file) => file.endsWith('.json'))
    .map((file) => file.replace('.json', ''));
}

/**
 * Validate data file against schema
 */
export function validateDataFile(filename: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  try {
    const data = loadDataFile(filename) as Record<string, unknown>;

    // Basic validation - check for required metadata
    if (!data.metadata) {
      errors.push('Missing required "metadata" property');
    } else {
      const metadata = data.metadata as Record<string, unknown>;
      if (!metadata.description) {
        errors.push('Missing required "metadata.description" property');
      }
      if (!metadata.version) {
        errors.push('Missing required "metadata.version" property');
      }
    }
  } catch (error) {
    errors.push(`Failed to load data file: ${(error as Error).message}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Clear the data cache (useful for tests)
 */
export function clearDataCache(): void {
  dataCache.clear();
}
