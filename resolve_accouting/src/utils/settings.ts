/**
 * Settings utility for managing user preferences
 * Stores settings in localStorage
 */

export interface UISettings {
  showAIAssistant: boolean;
  showVoiceSync: boolean;
}

const DEFAULT_SETTINGS: UISettings = {
  showAIAssistant: false, // Hidden by default
  showVoiceSync: false, // Hidden by default
};

const SETTINGS_KEY = 'resolve_accounting_ui_settings';

/**
 * Get UI settings from localStorage
 */
export function getUISettings(): UISettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('Error reading UI settings:', error);
  }
  return DEFAULT_SETTINGS;
}

/**
 * Save UI settings to localStorage
 */
export function saveUISettings(settings: Partial<UISettings>): void {
  try {
    const current = getUISettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving UI settings:', error);
  }
}

/**
 * Update a specific setting
 */
export function updateUISetting<K extends keyof UISettings>(
  key: K,
  value: UISettings[K]
): void {
  saveUISettings({ [key]: value });
}

/**
 * Reset all settings to defaults
 */
export function resetUISettings(): void {
  try {
    localStorage.removeItem(SETTINGS_KEY);
  } catch (error) {
    console.error('Error resetting UI settings:', error);
  }
}

