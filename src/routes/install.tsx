import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Download, Share, Smartphone } from "lucide-react";
import logoUrl from "@/assets/logo.jpg";

export const Route = createFileRoute("/install")({
  head: () => ({
    meta: [
      { title: "Install the app — RSS Sales Manager" },
      {
        name: "description",
        content:
          "Install RSS Sales Manager on your Android or iPhone home screen for full-screen, app-like access in the field.",
      },
      { property: "og:title", content: "Install the app — RSS Sales Manager" },
      {
        property: "og:description",
        content: "Add RSS Sales Manager to your phone home screen in two taps.",
      },
    ],
  }),
  component: InstallPage,
});

type InstallPromptEvent = Event & { prompt: () => Promise<void> };

function InstallPage() {
  const navigate = useNavigate();
  const [deferred, setDeferred] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as InstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);


  return (
    <div className="min-h-screen bg-background pb-16">
      <header className="sticky top-0 z-30 bg-navy px-4 py-4 text-navy-foreground">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <button
            onClick={() => void navigate({ to: "/account" })}
            className="grid h-9 w-9 place-items-center rounded-lg bg-white/10"
            aria-label="Back"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </button>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-navy-foreground/60">
              RSS Razeen Secure Solutions
            </p>
            <h1 className="truncate text-xl font-bold">Install the app</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-4">
        <div className="surface-card flex items-center gap-4 p-4">
          <img
            src={logoUrl}
            alt="RSS Sales Manager app icon"
            className="h-16 w-16 rounded-2xl bg-white object-contain p-1"
          />
          <div>
            <p className="font-semibold">RSS Sales Manager</p>
            <p className="text-xs text-muted-foreground">
              Installs to your home screen with its own icon and full-screen view.
            </p>
          </div>
        </div>

        <button
          onClick={() => void deferred?.prompt()}
          disabled={!deferred || installed}
          className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          {installed ? "App installed" : deferred ? "Install app now" : "Use the steps below to install"}
        </button>

        <div className="surface-card mt-4 space-y-2 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Smartphone className="h-4 w-4 text-primary" /> Android (Chrome)
          </div>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
            <li>Open this app in Chrome.</li>
            <li>Tap the ⋮ menu (top right).</li>
            <li>
              Tap <span className="font-medium text-foreground">Install app</span> or{" "}
              <span className="font-medium text-foreground">Add to Home screen</span>.
            </li>
            <li>Confirm — the RSS icon appears with your other apps.</li>
          </ol>
        </div>

        <div className="surface-card mt-4 space-y-2 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Share className="h-4 w-4 text-primary" /> iPhone / iPad (Safari)
          </div>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
            <li>Open this app in Safari.</li>
            <li>Tap the Share button.</li>
            <li>
              Choose <span className="font-medium text-foreground">Add to Home Screen</span>.
            </li>
            <li>Tap Add.</li>
          </ol>
        </div>

        <div className="surface-card mt-4 space-y-2 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Download className="h-4 w-4 text-primary" /> About APK files
          </div>
          <p className="text-sm text-muted-foreground">
            RSS Sales Manager is a web app, so there is no APK file to download here. The
            home-screen install above gives your reps the same experience — an app icon,
            full-screen layout and automatic updates with no Play Store approval or manual
            reinstall. A signed APK can be produced later by wrapping this app with Capacitor and
            building it in Android Studio.
          </p>
        </div>
      </main>
    </div>
  );
}
