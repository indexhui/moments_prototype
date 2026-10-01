"use client";

import { ChakraProvider } from "@chakra-ui/react";
import { CacheProvider } from "@chakra-ui/next-js";
import { theme } from "@/app/theme";
import { usePathname } from "next/navigation";

export function Provider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // The standalone canvas arcade owns its styles and needs no Emotion globals.
  if (pathname === "/muffin-knight" || pathname.startsWith("/muffin-knight/")) return <>{children}</>;
  return (
    <CacheProvider>
      <ChakraProvider value={theme}>{children}</ChakraProvider>
    </CacheProvider>
  );
}
