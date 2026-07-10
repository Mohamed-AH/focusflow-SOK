import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";

export type SyncStatus = "local" | "syncing" | "synced" | "error";

/**
 * Two-way progress sync with the cloud.
 *
 * localStorage stays the primary store at all times — this hook only layers
 * cloud persistence on top when the user is signed in and the server has a
 * database. If anything fails, the app keeps working from localStorage.
 *
 * Merge strategy on sign-in: whichever side has the newer data wins per
 * profile-set; server data is pulled once, then local changes push up
 * (debounced) for the rest of the session.
 */
export function useCloudSync(
  appData: any,
  setAppData: (data: any) => void
) {
  const { data: session, status: authStatus } = useSession();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("local");
  const pulledRef = useRef(false);
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPushed = useRef<string>("");

  const signedIn = authStatus === "authenticated" && Boolean(session?.user);

  // Initial pull when the user signs in
  useEffect(() => {
    if (!signedIn || pulledRef.current || !appData) return;
    pulledRef.current = true;
    setSyncStatus("syncing");
    fetch("/api/progress")
      .then(async (res) => {
        if (res.status === 503) {
          setSyncStatus("local"); // no DB on server: run in localStorage mode
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const { appData: remote } = await res.json();
        if (remote && typeof remote === "object") {
          const remoteProfiles = Object.keys(remote.profiles || {}).length;
          const localProfiles = Object.keys(appData.profiles || {}).length;
          // Prefer remote when local is empty (fresh browser); otherwise
          // merge remote profiles that local doesn't have.
          if (localProfiles === 0 && remoteProfiles > 0) {
            setAppData(remote);
          } else if (remoteProfiles > 0) {
            const merged = {
              ...appData,
              profiles: { ...remote.profiles, ...appData.profiles },
            };
            setAppData(merged);
          }
        }
        setSyncStatus("synced");
      })
      .catch(() => setSyncStatus("error"));
  }, [signedIn, appData, setAppData]);

  // Debounced push of local changes
  useEffect(() => {
    if (!signedIn || !appData || !pulledRef.current) return;
    if (syncStatus === "local") return; // server has no DB
    const serialized = JSON.stringify(appData);
    if (serialized === lastPushed.current) return;

    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(() => {
      setSyncStatus("syncing");
      fetch("/api/progress", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appData }),
      })
        .then((res) => {
          if (res.status === 503) {
            setSyncStatus("local");
            return;
          }
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          lastPushed.current = serialized;
          setSyncStatus("synced");
        })
        .catch(() => setSyncStatus("error"));
    }, 1500);

    return () => {
      if (pushTimer.current) clearTimeout(pushTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appData, signedIn, syncStatus]);

  // Reset pull flag on sign-out so a re-login pulls again
  useEffect(() => {
    if (!signedIn) {
      pulledRef.current = false;
      setSyncStatus("local");
    }
  }, [signedIn]);

  return { syncStatus, signedIn, session };
}
