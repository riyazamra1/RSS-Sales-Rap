import { useEffect, useState } from "react";
import { useAppSettings } from "@/hooks/useAppSettings";

export function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);
  const { settings, logo } = useAppSettings();

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), 1100);
    const hideTimer = setTimeout(() => setVisible(false), 1600);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-hidden
      className={`fixed inset-0 z-[100] grid place-items-center bg-navy transition-opacity duration-500 ${
        fading ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="flex flex-col items-center gap-4 px-8 text-center">
        <img
          src={logo}
          alt={`${settings.company_name} logo`}
          className="h-24 w-24 rounded-3xl bg-white object-contain p-2 shadow-2xl"
        />
        <div>
          <p className="text-xl font-bold text-navy-foreground">{settings.app_name}</p>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-navy-foreground/60">
            {settings.tagline || settings.company_name}
          </p>
        </div>

        <span className="mt-2 h-1 w-24 overflow-hidden rounded-full bg-white/15">
          <span className="block h-full w-1/2 animate-pulse rounded-full bg-primary" />
        </span>
      </div>
    </div>
  );
}
