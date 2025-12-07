'use client';

import { useEffect } from "react";

type Theme = "player" | "admin";

export function ThemeSetter({ theme }: { theme: Theme }) {
  useEffect(() => {
    const previous = document.body.dataset.theme;
    document.body.dataset.theme = theme;
    return () => {
      document.body.dataset.theme = previous || "player";
    };
  }, [theme]);

  return null;
}
