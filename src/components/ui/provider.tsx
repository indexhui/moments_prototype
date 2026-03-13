"use client";

import { ChakraProvider } from "@chakra-ui/react";
import { CacheProvider } from "@chakra-ui/next-js";
import { theme } from "@/app/theme";

export function Provider({ children }: { children: React.ReactNode }) {
  return (
    <CacheProvider>
      <ChakraProvider value={theme}>{children}</ChakraProvider>
    </CacheProvider>
  );
}
