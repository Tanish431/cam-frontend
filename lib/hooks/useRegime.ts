import { useState, useEffect } from "react";

interface ClusterData {
  current: {
    cluster_id: number;
    label: string;
    desc: string;
  };
}

export function useRegime(window: number) {
  const [regime, setRegime] = useState<ClusterData["current"] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`http://localhost:8080/api/regime-clusters?window=${window}`)
      .then((r) => r.json())
      .then((data: ClusterData) => {
        if (data?.current) setRegime(data.current);
      })
      .finally(() => setLoading(false));
  }, [window]);

  return { regime, loading };
}
