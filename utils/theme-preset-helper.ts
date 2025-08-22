import { defaultThemeState } from "../config/theme";
import { ThemeStyles } from "../types/theme";
import { defaultPresets } from "../utils/theme-presets";

export function getPresetThemeStyles(name: string): ThemeStyles {
  const defaultTheme = defaultThemeState.styles;
  if (name === "default") {
    return defaultTheme;
  }

  // Use only default presets during build time to avoid database connection
  const preset = defaultPresets[name];
  if (!preset) {
    return defaultTheme;
  }

  return {
    light: {
      ...defaultTheme.light,
      ...(preset.styles.light || {}),
    },
    dark: {
      ...defaultTheme.dark,
      ...(preset.styles.light || {}),
      ...(preset.styles.dark || {}),
    },
  };
}
