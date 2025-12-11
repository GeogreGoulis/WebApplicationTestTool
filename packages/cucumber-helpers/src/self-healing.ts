/**
 * Self-healing element locator system
 */

import { Page, Locator } from '@playwright/test';

export interface LocatorConfig {
  primary: string;
  fallbacks?: string[];
  attributes?: {
    text?: string;
    role?: string;
    ariaLabel?: string;
  };
}

export interface HealingResult {
  locator: Locator;
  strategy: string;
  confidence: number;
}

export class SelfHealingLocator {
  constructor(private page: Page, private config: LocatorConfig) {}

  async locate(): Promise<HealingResult> {
    // Try primary locator first
    try {
      const locator = this.page.locator(this.config.primary);
      const count = await locator.count();
      if (count > 0) {
        return {
          locator,
          strategy: 'primary',
          confidence: 1.0,
        };
      }
    } catch {
      // Primary failed, try healing
    }

    // Try fallback locators
    if (this.config.fallbacks) {
      for (const fallback of this.config.fallbacks) {
        try {
          const locator = this.page.locator(fallback);
          const count = await locator.count();
          if (count > 0) {
            console.warn(
              `Self-healing: Using fallback locator "${fallback}" instead of "${this.config.primary}"`
            );
            return {
              locator,
              strategy: 'fallback',
              confidence: 0.85,
            };
          }
        } catch {
          continue;
        }
      }
    }

    // Try attribute-based matching
    if (this.config.attributes) {
      const { text, role, ariaLabel } = this.config.attributes;

      if (text) {
        try {
          const locator = this.page.getByText(text);
          const count = await locator.count();
          if (count > 0) {
            console.warn(
              `Self-healing: Using text-based locator for "${text}"`
            );
            return {
              locator,
              strategy: 'text',
              confidence: 0.75,
            };
          }
        } catch {
          // Continue
        }
      }

      if (role) {
        try {
          const locator = this.page.getByRole(role as any);
          const count = await locator.count();
          if (count > 0) {
            console.warn(
              `Self-healing: Using role-based locator for "${role}"`
            );
            return {
              locator,
              strategy: 'role',
              confidence: 0.8,
            };
          }
        } catch {
          // Continue
        }
      }

      if (ariaLabel) {
        try {
          const locator = this.page.getByLabel(ariaLabel);
          const count = await locator.count();
          if (count > 0) {
            console.warn(
              `Self-healing: Using aria-label locator for "${ariaLabel}"`
            );
            return {
              locator,
              strategy: 'aria-label',
              confidence: 0.8,
            };
          }
        } catch {
          // Continue
        }
      }
    }

    throw new Error(
      `Could not locate element with primary: "${this.config.primary}"`
    );
  }
}

export function createSelfHealingLocator(
  page: Page,
  config: LocatorConfig
): SelfHealingLocator {
  return new SelfHealingLocator(page, config);
}
