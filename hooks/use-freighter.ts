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

export function useFreighter() {
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [network, setNetwork] = useState<string | null>(null);
  const [installed, setInstalled] = useState(false);

  const checkConnection = useCallback(async () => {
    const { isConnected: ok, error } = await isConnected();
    if (error || !ok) {
      setInstalled(false);
      return;
    }
    setInstalled(true);

    const { address: addr, error: addressError } = await getAddress();
    if (addressError || !addr) return;

    const { network: net, error: networkError } = await getNetwork();
    if (networkError) return;

    setConnected(true);
    setAddress(addr);
    setNetwork(net);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { isConnected: ok, error } = await isConnected();
      if (cancelled) return;
      if (error || !ok) {
        setInstalled(false);
        return;
      }
      setInstalled(true);

      const { address: addr, error: addressError } = await getAddress();
      if (cancelled || addressError || !addr) return;

      const { network: net, error: networkError } = await getNetwork();
      if (cancelled || networkError) return;

      setConnected(true);
      setAddress(addr);
      setNetwork(net);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const connect = useCallback(async () => {
    const { isConnected: ok, error } = await isConnected();
    if (error || !ok) {
      throw new Error(
        "Freighter wallet not installed. Install from freighter.app",
      );
    }

    const { address: addr, error: accessError } = await requestAccess();
    if (accessError || !addr) {
      throw new Error(accessError ?? "Freighter access denied");
    }

    const config = getStellarConfig();
    const { network: net, error: networkError } = await getNetwork();
    if (networkError) {
      throw new Error(networkError);
    }
    if (net !== config.networkPassphrase) {
      throw new Error(
        `Freighter is on wrong network. Switch to ${config.networkLabel} in Freighter settings.`,
      );
    }

    setConnected(true);
    setAddress(addr);
    setNetwork(net);
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
        throw new Error(signError ?? "Transaction signing failed");
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
