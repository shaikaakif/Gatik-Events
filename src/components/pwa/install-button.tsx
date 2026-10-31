"use client";

import { useEffect, useState } from "react";
import { Download, Share } from "lucide-react";
import { cn } from "@/lib/utils";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type NavigatorWithStandalone = Navigator & { standalone?: boolean };

export function InstallButton({ className }: { className?: string }) {
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches ||
      Boolean((navigator as NavigatorWithStandalone).standalone);
    const frame = window.requestAnimationFrame(() => {
      setInstalled(standalone);
      setIsIos(/iphone|ipad|ipod/i.test(navigator.userAgent) && !standalone);
    });

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed || (!prompt && !isIos)) return null;

  async function install() {
    if (!prompt) {
      setShowIosHelp((current) => !current);
      return;
    }
    await prompt.prompt();
    const choice = await prompt.userChoice;
    if (choice.outcome === "accepted") setPrompt(null);
  }

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={install}
        aria-expanded={isIos ? showIosHelp : undefined}
        className="install-button"
      >
        {isIos ? <Share aria-hidden="true" /> : <Download aria-hidden="true" />}
        Install G Events
      </button>
      {isIos && showIosHelp ? (
        <div className="install-help" role="status">
          In Safari, tap <strong>Share</strong>, then <strong>Add to Home Screen</strong>.
        </div>
      ) : null}
    </div>
  );
}
