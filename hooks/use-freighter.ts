"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getAddress,
  getNetwork,
  isConnected,
  requestAccess,
  signTransaction,
} from "@stellar/freighter-api";
import { getStellarConfig } from "@/lib/stellar/config";

const FREIGHTER_INSTALL_URL = "https://www.freighter.app";

type FreighterApiError = {
  code?: number;
  message?: string;
};

function formatFreighterError(error: unknown): string {
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as FreighterApiError).message;
    if (message) return message;
  }
  return "Freighter request failed";
}

function hasFreighterGlobal(): boolean {
  return typeof window !== "undefined" && Boolean(window.freighter);
}

async function waitForFreighterExtension(
  attempts = 5,
  delayMs = 400,
): Promise<boolean> {
  if (typeof window === "undefined") return false;

  for (let i = 0; i < attempts; i += 1) {
    if (hasFreighterGlobal()) return true;

    const { isConnected: extensionPresent } = await isConnected();
    if (extensionPresent) return true;

    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  return false;
}

function freighterNotDetectedMessage(): string {
  return [
    "Could not reach the Freighter extension.",
    "Use Chrome or Firefox (not an in-app browser), unlock Freighter, enable it for this site, then refresh.",
    `Install: ${FREIGHTER_INSTALL_URL}`,
  ].join(" ");
}

async function syncAuthorizedSession(): Promise<{
  address: string;
  networkPassphrase: string;
} | null> {
  const { address: addr, error: addressError } = await getAddress();
  if (addressError || !addr) return null;

  const { networkPassphrase, error: networkError } = await getNetwork();
  if (networkError || !networkPassphrase) return null;

  return { address: addr, networkPassphrase };
}

export function useFreighter() {
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [network, setNetwork] = useState<string | null>(null);
  const [installed, setInstalled] = useState(false);

  const checkConnection = useCallback(async () => {
    const extensionPresent = await waitForFreighterExtension();
    setInstalled(extensionPresent);
    if (!extensionPresent) return;

    const session = await syncAuthorizedSession();
    if (!session) return;

    setConnected(true);
    setAddress(session.address);
    setNetwork(session.networkPassphrase);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const extensionPresent = await waitForFreighterExtension();
      if (cancelled) return;
      setInstalled(extensionPresent);
      if (!extensionPresent) return;

      const session = await syncAuthorizedSession();
      if (cancelled || !session) return;

      setConnected(true);
      setAddress(session.address);
      setNetwork(session.networkPassphrase);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const connect = useCallback(async () => {
    const extensionPresent = await waitForFreighterExtension();
    setInstalled(extensionPresent);

    const { address: addr, error: accessError } = await requestAccess();

    if (accessError) {
      throw new Error(formatFreighterError(accessError));
    }

    if (!addr) {
      if (!extensionPresent) {
        throw new Error(freighterNotDetectedMessage());
      }
      throw new Error(
        "Freighter did not return a wallet address. Unlock Freighter and approve access for this site.",
      );
    }

    const config = getStellarConfig();
    const { networkPassphrase, error: networkError } = await getNetwork();
    if (networkError) {
      throw new Error(formatFreighterError(networkError));
    }
    if (networkPassphrase !== config.networkPassphrase) {
      throw new Error(
        `Freighter is on the wrong network. Switch to ${config.networkLabel} in Freighter settings.`,
      );
    }

    setInstalled(true);
    setConnected(true);
    setAddress(addr);
    setNetwork(networkPassphrase);
    return addr;
  }, []);

  const sign = useCallback(
    async (xdr: string) => {
      if (!address) {
        throw new Error("Connect Freighter first");
      }
      const { signedTxXdr, error: signError } = await signTransaction(xdr, {
        networkPassphrase: getStellarConfig().networkPassphrase,
        address,
      });
      if (signError || !signedTxXdr) {
        throw new Error(formatFreighterError(signError ?? "Transaction signing failed"));
      }
      return signedTxXdr;
    },
    [address],
  );

  return {
    connected,
    address,
    network,
    installed,
    connect,
    sign,
    checkConnection,
  };
}

declare global {
  interface Window {
    freighter?: boolean;
  }
}
