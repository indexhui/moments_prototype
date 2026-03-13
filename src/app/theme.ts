import { createSystem, defaultConfig } from "@chakra-ui/react";

export const theme = createSystem(defaultConfig, {
  theme: {
    tokens: {
      colors: {
        // Brand palette: 晨光奶茶（療癒日常／溫柔陪伴）
        brandPrimary: { value: "#F4D7B9" }, // 奶茶米杏
        brandPrimaryDark: { value: "#E9C8A4" },
        brandSecondary: { value: "#7AC8C0" }, // 薄荷青藍
        brandAccent: { value: "#FF8A5B" }, // 珊瑚橙（CTA）
        ink: { value: "#2B2B2B" }, // 標題字
        textBody: { value: "#4A4A4A" }, // 內文字
        line: { value: "#EDE7E1" }, // 線條
        bgBase: { value: "#EDEBE7" }, // 背景底

        // Gradient endpoints
        gradientStart: { value: "#FFF1E4" },
        gradientEnd: { value: "#F4D7B9" },

        // Navigation pills background (light theme defaults)
        navBg: { value: "#EDE7E1" },
        navBgActive: { value: "#FFF1E4" },
      },
      fonts: {
        heading: {
          value:
            "system-ui, -apple-system, Segoe UI, Helvetica Neue, Arial, sans-serif",
        },
        body: {
          value:
            "system-ui, -apple-system, Segoe UI, Helvetica Neue, Arial, sans-serif",
        },
      },
    },
    semanticTokens: {
      colors: {
        // Semantic color tokens
        primary: {
          value: {
            base: "{colors.brandPrimary}",
            _dark: "{colors.brandPrimaryDark}",
          },
        },
        primaryHover: {
          value: {
            base: "{colors.brandPrimaryDark}",
            _dark: "{colors.brandPrimary}",
          },
        },
        secondary: {
          value: {
            base: "{colors.brandSecondary}",
            _dark: "{colors.brandSecondary}",
          },
        },
        accent: {
          value: {
            base: "{colors.brandAccent}",
            _dark: "{colors.brandAccent}",
          },
        },
        text: {
          value: { base: "{colors.textBody}", _dark: "#EDEDED" },
        },
        headingText: {
          value: { base: "{colors.ink}", _dark: "#FFFFFF" },
        },
        border: {
          value: { base: "{colors.line}", _dark: "#2D2D2D" },
        },
        bg: {
          value: { base: "{colors.bgBase}", _dark: "#1A1A1A" },
        },

        // Navigation pills backgrounds
        navBg: { value: { base: "{colors.navBg}", _dark: "#2A2A2A" } },
        navBgActive: {
          value: { base: "{colors.navBgActive}", _dark: "#3A3A3A" },
        },
      },
      fonts: {},
    },
  },
});
