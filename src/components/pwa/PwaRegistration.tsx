"use client";

import { useEffect } from "react";
import { registerMomentServiceWorker } from "@/lib/pwa/offlineCache";

export function PwaRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    void registerMomentServiceWorker();
  }, []);

  return null;
}
