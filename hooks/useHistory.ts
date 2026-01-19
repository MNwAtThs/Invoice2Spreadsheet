"use client";

import { useState, useCallback } from "react";
import type { HistoryItem, HistoryResponse } from "@/types";

export function useHistory(accessToken: string | null) {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async () => {
    if (!accessToken) {
      setItems([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/history", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) {
        setError("Failed to load history.");
        return;
      }

      const payload: HistoryResponse = await response.json();

      if (payload.error) {
        setError(payload.error);
        return;
      }

      if (payload.history) {
        setItems(payload.history);
        setError(null);
      }
    } catch {
      setError("Failed to load history.");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  const clear = useCallback(() => {
    setItems([]);
    setError(null);
  }, []);

  return {
    items,
    error,
    isLoading,
    load,
    clear,
    setError,
  };
}
