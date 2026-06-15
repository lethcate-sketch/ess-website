import type { Config } from "tailwindcss";

/**
 * デザイントークン集約。
 * 方針: 明るく・親しみやすく・国際的。丸み / 色味 / 動きのあるデザイン。
 * - メイン #3BA7FF（ブルー） / サブ #A8F1D0（ミント） / アクセント #003B70（濃紺） / 背景 #F7FBFF
 * - 既存の意味トークン名（accent/ink/surface/line/danger）は維持し、新パレットへ再マッピング。
 * - 見出しは Poppins（+Noto Sans JP）、本文は Inter（+Noto Sans JP）。
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // メイン: 明るいブルー
        brand: {
          DEFAULT: "#3BA7FF",
          50: "#EAF6FF",
          100: "#D6ECFF",
          200: "#AEDBFF",
          300: "#7CC4FF",
          400: "#3BA7FF",
          500: "#1E8AE6",
          600: "#1571C4",
          700: "#125C9E",
          fg: "#ffffff",
          subtle: "#EAF6FF",
        },
        // サブ: ミント
        mint: {
          DEFAULT: "#A8F1D0",
          50: "#EDFCF5",
          100: "#D6F7E8",
          200: "#A8F1D0",
          300: "#7DE7BB",
          400: "#4FD9A2",
          subtle: "#EDFCF5",
        },
        // アクセント: 濃紺（見出し・強調）
        navy: {
          DEFAULT: "#003B70",
          600: "#00498A",
          700: "#003B70",
          800: "#002B52",
        },
        // --- 既存コンポーネント互換の意味トークン（新パレットへ再マップ）---
        accent: {
          DEFAULT: "#3BA7FF",
          hover: "#1E8AE6",
          fg: "#ffffff",
          subtle: "#EAF6FF",
        },
        ink: {
          DEFAULT: "#0F2C49", // 濃紺寄りの本文色
          muted: "#54708A",
          subtle: "#8AA2B8",
        },
        surface: {
          DEFAULT: "#ffffff",
          muted: "#F1F8FF",
          inverse: "#003B70",
        },
        canvas: "#F7FBFF", // ページ背景（淡い青白）
        line: {
          DEFAULT: "#DCEAF5",
          strong: "#C3DCEF",
        },
        danger: {
          DEFAULT: "#E5484D",
          subtle: "#FFF1F1",
          fg: "#ffffff",
        },
      },
      borderRadius: {
        none: "0px",
        sm: "0.375rem",
        DEFAULT: "0.625rem",
        md: "0.75rem",
        lg: "1rem",
        xl: "1.25rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
        "4xl": "2.5rem",
        full: "9999px",
      },
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "var(--font-noto-jp)",
          "ui-sans-serif",
          "system-ui",
          "Segoe UI",
          "Hiragino Kaku Gothic ProN",
          "Meiryo",
          "sans-serif",
        ],
        display: [
          "var(--font-poppins)",
          "var(--font-noto-jp)",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        jp: ["var(--font-noto-jp)", "Hiragino Kaku Gothic ProN", "Meiryo", "sans-serif"],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Consolas",
          "Liberation Mono",
          "monospace",
        ],
      },
      maxWidth: {
        content: "72rem",
      },
      boxShadow: {
        subtle: "0 1px 2px 0 rgb(0 0 0 / 0.04)",
        soft: "0 4px 20px -6px rgb(59 167 255 / 0.18)",
        card: "0 10px 32px -12px rgb(0 59 112 / 0.16)",
        "card-hover": "0 22px 48px -14px rgb(59 167 255 / 0.38)",
        glow: "0 12px 34px -8px rgb(59 167 255 / 0.45)",
        nav: "0 8px 28px -10px rgb(0 59 112 / 0.20)",
      },
      backgroundImage: {
        "hero-gradient":
          "radial-gradient(1100px 520px at 12% -10%, #Dff0ff 0%, rgba(223,240,255,0) 60%), radial-gradient(900px 480px at 95% 0%, #E6FBF1 0%, rgba(230,251,241,0) 55%), linear-gradient(180deg, #F7FBFF 0%, #F7FBFF 100%)",
        "brand-gradient": "linear-gradient(135deg, #3BA7FF 0%, #1E8AE6 100%)",
        "mint-gradient": "linear-gradient(135deg, #A8F1D0 0%, #7DE7BB 100%)",
        "sky-gradient": "linear-gradient(135deg, #7CC4FF 0%, #3BA7FF 45%, #A8F1D0 100%)",
      },
      keyframes: {
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(18px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
        bob: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-in": "fade-in 0.8s ease both",
        "scale-in": "scale-in 0.6s cubic-bezier(0.22, 1, 0.36, 1) both",
        float: "float 6s ease-in-out infinite",
        "float-slow": "float 9s ease-in-out infinite",
        bob: "bob 3.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
