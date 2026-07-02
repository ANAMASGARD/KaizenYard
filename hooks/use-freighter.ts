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
    void checkConnection();
  }, [checkConnection]);

  const connect = useCallback(async () => {
    const { isConnected: ok, error } = await isConnected();
    if (error || !ok) {
      throw new Error(
        "Freighter wallet not installed. Install from freighter.app",
      );
    }

    const { address: addr, error: accessError } = await requestAccess();
    if (accessError) {
      throw new Error(accessError.message ?? "Wallet access denied");
    }

    const { network: net, error: networkError } = await getNetwork();
    if (networkError) {
      throw new Error(networkError.message ?? "Could not read wallet network");
    }

    setInstalled(true);
    setConnected(true);
    setAddress(addr);
    setNetwork(net);
    return addr;
  }, []);

  const disconnect = useCallback(() => {
    setConnected(false);
    setAddress(null);
    setNetwork(null);
  }, []);

  const sign = useCallback(
    async (xdr: string) => {
      if (!connected) throw new Error("Wallet not connected");
      const { networkPassphrase } = getStellarConfig();
      const { signedTxXdr, error } = await signTransaction(xdr, {
        networkPassphrase,
      });
      if (error) {
        throw new Error(error.message ?? "Signing rejected");
      }
      return signedTxXdr;
    },
    [connected],
  );

  return {
    installed,
    connected,
    address,
    network,
    connect,
    disconnect,
    sign,
    refresh: checkConnection,
  };
}
