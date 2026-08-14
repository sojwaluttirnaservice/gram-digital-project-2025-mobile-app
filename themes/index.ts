import { DefaultTheme as NavigationDefaultTheme } from "@react-navigation/native";

/**
 * Custom App Theme
 *
 * Why extend NavigationDefaultTheme?
 * ----------------------------------
 * React Navigation ships with its own `DefaultTheme` that
 * provides sensible defaults for colors (background, text, etc).
 * Instead of re-implementing everything, we spread (...) it and
 * override only the values we care about.
 *
 * This ensures:
 *  - Compatibility with React Navigation (no missing keys).
 *  - Consistent design system across screens.
 *  - Easy future upgrades (RN Navigation updates won't break our theme).
 */

export const MyTheme = {
  ...NavigationDefaultTheme, // start with defaults
  colors: {
    ...NavigationDefaultTheme.colors, // keep existing colors, override selectively

    /**
     * Background color for the entire app.
     * We set this to pure white (#fff) so our pages
     * don’t show a “grayish white” that comes from defaults.
     */
    background: "#ffffff",

    /**
     * Card color is used for headers, tab bars, and navigation containers.
     * Setting it to white keeps it consistent with the background.
     */
    card: "#ffffff",

    /**
     * Primary color → used for active states (links, buttons, tab active icon).
     * We use iOS blue (#007aff), but you can swap this for your brand color.
     */
    primary: "#007aff",

    /**
     * Text color → default text color across the app.
     * Dark gray (#1c1c1e) instead of pure black for better readability.
     */
    text: "#1c1c1e",

    /**
     * Border color → used for separators and outlines.
     * A subtle gray (#e0e0e0) works well across light backgrounds.
     */
    border: "#e0e0e0",

    /**
     * Notification color → used for badges (unread counts, alerts).
     * Standard iOS red for visibility.
     */
    notification: "#ff3b30",
  },
};
