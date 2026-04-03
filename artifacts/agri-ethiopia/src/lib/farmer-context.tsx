/**
 * Global farmer context — single source of truth for the active farmer.
 * All pages that need farmer_id, region, crop, language read from here.
 * Nothing invents data: if no farmer is selected, fields are null.
 */
import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useListFarmers } from "@workspace/api-client-react";
import type { Farmer } from "@workspace/api-zod";

interface FarmerContextValue {
  farmer: Farmer | null;
  setFarmerId: (id: number) => void;
  farmerId: number | null;
  isLoading: boolean;
}

const Ctx = createContext<FarmerContextValue>({
  farmer: null,
  setFarmerId: () => {},
  farmerId: null,
  isLoading: false,
});

const STORAGE_KEY = "agri_active_farmer_id";

export function FarmerProvider({ children }: { children: ReactNode }) {
  const [farmerId, setFarmerIdState] = useState<number | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? parseInt(stored, 10) : null;
  });

  const { data: farmersData, isLoading } = useListFarmers(
    { limit: "100" },
    { query: { queryKey: ["/api/farmers", { limit: "100" }] } }
  );

  // Auto-select first farmer if none stored and data arrives
  useEffect(() => {
    if (!farmerId && farmersData?.farmers?.length) {
      const first = farmersData.farmers[0];
      if (first) setFarmerIdState(first.id);
    }
  }, [farmersData, farmerId]);

  const farmer = farmersData?.farmers?.find((f) => f.id === farmerId) ?? null;

  const setFarmerId = (id: number) => {
    setFarmerIdState(id);
    localStorage.setItem(STORAGE_KEY, String(id));
  };

  return (
    <Ctx.Provider value={{ farmer, setFarmerId, farmerId, isLoading }}>
      {children}
    </Ctx.Provider>
  );
}

export function useFarmerContext() {
  return useContext(Ctx);
}
