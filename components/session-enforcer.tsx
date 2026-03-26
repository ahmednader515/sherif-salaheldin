"use client";

import { useEffect, useRef } from "react";
import { signOut, useSession } from "next-auth/react";

async function invalidateAndGoHome() {
  // IMPORTANT: do NOT clear db flags here.
  // This device is already invalid, and clearing flags could log out the *current* valid device.
  await signOut({ redirect: false });
  if (typeof window !== "undefined") {
    window.location.replace("/");
  }
}

export function SessionEnforcer() {
  const { data: session, status } = useSession();
  const runningRef = useRef(false);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) return;

    const check = async () => {
      if (runningRef.current) return;
      runningRef.current = true;
      try {
        const res = await fetch("/api/auth/validate", { cache: "no-store" });
        if (res.status === 401) {
          await invalidateAndGoHome();
        }
      } finally {
        runningRef.current = false;
      }
    };

    // Initial check + periodic checks.
    check();
    const interval = window.setInterval(check, 8000);

    const onFocus = () => check();
    document.addEventListener("visibilitychange", onFocus);
    window.addEventListener("focus", onFocus);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onFocus);
      window.removeEventListener("focus", onFocus);
    };
  }, [session?.user?.id, status]);

  return null;
}

