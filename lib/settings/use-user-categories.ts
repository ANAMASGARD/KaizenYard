"use client";

import { useCallback, useEffect, useState } from "react";
import { listUserCategories } from "@/lib/settings/categories-actions";
import { metaRecordFromCategories } from "@/lib/settings/category-resolver";
import type { CategoryMeta, CategoryModule, UserCategoryRecord } from "@/lib/settings/types";

export function useUserCategories(module: CategoryModule) {
  const [categories, setCategories] = useState<UserCategoryRecord[]>([]);
  const [metaByKey, setMetaByKey] = useState<Record<string, CategoryMeta>>({});
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await listUserCategories(module);
      setCategories(rows);
      setMetaByKey(metaRecordFromCategories(rows));
    } finally {
      setLoading(false);
    }
  }, [module]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const rows = await listUserCategories(module);
        if (cancelled) return;
        setCategories(rows);
        setMetaByKey(metaRecordFromCategories(rows));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [module]);

  return { categories, metaByKey, loading, refresh };
}
