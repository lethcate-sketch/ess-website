import type { Config } from "tailwindcss";

/**
 * デザイントークン集約（§8: ミニマル・直線的・IT系）。
 * - ニュートラル基調 + アクセント1色（インディゴ）
 * - 角丸ゼロ〜極小、1px 罫線、控えめな影
 * - 見出し/数値に等幅（font-mono）を併用
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // アクセント1色（インディゴ系）
        accent: {
          DEFAULT: "#4f46e5",
          hover: "#4338ca",
          fg: "#ffffff",
          subtle: "#eef2ff",
        },
        // 本文・テキスト（白〜濃グレー）
        ink: {
          DEFAULT: "#111827",
          muted: "#6b7280",
          subtle: "#9ca3af",
        },
        // 面・背景
        surface: {
          DEFAULT: "#ffffff",
          muted: "#f9fafb",
          inverse: "#0b0f19",
        },
        // 1px 罫線
        line: {
          DEFAULT: "#e5e7eb",
          strong: "#d1d5db",
        },
        // 危険・エラー（唯一の警告色）
        danger: {
          DEFAULT: "#dc2626",
          subtle: "#fef2f2",
          fg: "#ffffff",
        },
      },
      borderRadius: {
        // 角丸ゼロ〜極小（直線的）
        none: "0px",
        sm: "2px",
        DEFAULT: "2px",
        md: "3px",
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Hiragino Kaku Gothic ProN",
          "Noto Sans JP",
          "Meiryo",
          "sans-serif",
        ],
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
        content: "72rem", // max-w-6xl 相当: 中央寄せの基準幅
      },
      boxShadow: {
        subtle: "0 1px 2px 0 rgb(0 0 0 / 0.04)", // 影は控えめ
      },
    },
  },
  plugins: [],
};

export default config;
