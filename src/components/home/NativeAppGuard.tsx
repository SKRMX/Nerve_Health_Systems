"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Capacitor } from "@capacitor/core";

export function NativeAppGuard() {
  const router = useRouter();

  useEffect(() => {
    // If running inside iOS or Android native application, skip web landing page and open app login directly
    if (Capacitor.isNativePlatform()) {
      router.replace("/login");
    }
  }, [router]);

  return null;
}
