"use client";

export default function SkipToMain() {
  return (
    <a
      href="#content"
      className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:px-4 focus:py-2 focus:bg-background focus:text-foreground"
    >
      Ir al contenido principal
    </a>
  );
}
