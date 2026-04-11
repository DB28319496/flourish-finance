"use client";

import React, { useCallback, useEffect, useState } from "react";
import { usePlaidLink } from "react-plaid-link";
import { useAuth } from "@/lib/auth-context";
import { useData } from "@/lib/data-context";
import { Plus } from "lucide-react";
import Link from "next/link";

export function PlaidLinkButton({ className }: { className?: string }) {
  const { getIdToken, user } = useAuth();
  const { refreshAccounts, refreshTransactions } = useData();
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Get a link token when the component mounts (only when signed in)
  const fetchLinkToken = useCallback(async () => {
    if (!user) return;
    try {
      const token = await getIdToken();
      if (!token) return;
      const res = await fetch("/api/plaid/create-link-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.link_token) setLinkToken(data.link_token);
    } catch (err) {
      console.error("Failed to create link token:", err);
    }
  }, [user, getIdToken]);

  useEffect(() => {
    fetchLinkToken();
  }, [fetchLinkToken]);

  const onSuccess = useCallback(
    async (publicToken: string) => {
      setLoading(true);
      try {
        const token = await getIdToken();
        if (!token) return;
        await fetch("/api/plaid/exchange-token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ public_token: publicToken }),
        });
        await Promise.all([refreshAccounts(), refreshTransactions()]);
      } catch (err) {
        console.error("Failed to exchange token:", err);
      } finally {
        setLoading(false);
      }
    },
    [getIdToken, refreshAccounts, refreshTransactions]
  );

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess,
  });

  const buttonClass =
    className ||
    "flex items-center gap-2 px-4 py-2.5 rounded-xl bg-flourish-orange text-white text-sm font-medium hover:bg-flourish-orange/90 transition-colors disabled:opacity-50";

  // Show "Sign in to Connect" when not authenticated
  if (!user) {
    return (
      <Link href="/login" className={buttonClass}>
        <Plus className="w-4 h-4" />
        Sign in to Connect Bank
      </Link>
    );
  }

  return (
    <button
      onClick={() => open()}
      disabled={!ready || loading}
      className={buttonClass}
    >
      <Plus className="w-4 h-4" />
      {loading ? "Connecting..." : "Connect Bank"}
    </button>
  );
}
