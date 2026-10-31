import { useAppSettings } from "@/hooks/useAppSettings";

export function SplashScreen() {
  const { settings, logo } = useAppSettings();

  return (
    <>
      <style>{`
        @keyframes rss-splash-dismiss {
          0%, 65% { opacity: 1; visibility: visible; }
          100% { opacity: 0; visibility: hidden; pointer-events: none; }
        }
        @keyframes rss-splash-progress {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
      `}</style>
      <div
        aria-hidden
        className="fixed inset-0 z-[100] grid place-items-center bg-navy"
        style={{
          animation: "rss-splash-dismiss 2.2s ease-in-out forwards",
          pointerEvents: "none",
        }}
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
            <span
              className="block h-full w-full origin-left rounded-full bg-primary"
              style={{ animation: "rss-splash-progress 1.45s ease-out forwards" }}
            />
          </span>
        </div>
      </div>
    </>
  );
}
