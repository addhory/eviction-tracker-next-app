import { create } from "zustand";
import { Property, Tenant, LegalCase } from "@/types";

interface AppState {
  // Properties
  properties: Property[];
  setProperties: (properties: Property[]) => void;
  addProperty: (property: Property) => void;
  updateProperty: (id: string, property: Partial<Property>) => void;
  removeProperty: (id: string) => void;

  // Tenants
  tenants: Tenant[];
  setTenants: (tenants: Tenant[]) => void;
  addTenant: (tenant: Tenant) => void;
  updateTenant: (id: string, tenant: Partial<Tenant>) => void;
  removeTenant: (id: string) => void;

  // Legal Cases
  legalCases: LegalCase[];
  setLegalCases: (cases: LegalCase[]) => void;
  addLegalCase: (legalCase: LegalCase) => void;
  updateLegalCase: (id: string, legalCase: Partial<LegalCase>) => void;
  removeLegalCase: (id: string) => void;

  // UI State
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // Loading states
  loading: {
    properties: boolean;
    tenants: boolean;
    legalCases: boolean;
  };
  setLoading: (key: keyof AppState["loading"], loading: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Properties
  properties: [],
  setProperties: (properties) => set({ properties }),
  addProperty: (property) =>
    set((state) => ({
      properties: [...state.properties, property],
    })),
  updateProperty: (id, property) =>
    set((state) => ({
      properties: state.properties.map((p) =>
        p.id === id ? { ...p, ...property } : p
      ),
    })),
  removeProperty: (id) =>
    set((state) => ({
      properties: state.properties.filter((p) => p.id !== id),
    })),

  // Tenants
  tenants: [],
  setTenants: (tenants) => set({ tenants }),
  addTenant: (tenant) =>
    set((state) => ({
      tenants: [...state.tenants, tenant],
    })),
  updateTenant: (id, tenant) =>
    set((state) => ({
      tenants: state.tenants.map((t) =>
        t.id === id ? { ...t, ...tenant } : t
      ),
    })),
  removeTenant: (id) =>
    set((state) => ({
      tenants: state.tenants.filter((t) => t.id !== id),
    })),

  // Legal Cases
  legalCases: [],
  setLegalCases: (legalCases) => set({ legalCases }),
  addLegalCase: (legalCase) =>
    set((state) => ({
      legalCases: [...state.legalCases, legalCase],
    })),
  updateLegalCase: (id, legalCase) =>
    set((state) => ({
      legalCases: state.legalCases.map((c) =>
        c.id === id ? { ...c, ...legalCase } : c
      ),
    })),
  removeLegalCase: (id) =>
    set((state) => ({
      legalCases: state.legalCases.filter((c) => c.id !== id),
    })),

  // UI State
  sidebarCollapsed: false,
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

  // Loading states
  loading: {
    properties: false,
    tenants: false,
    legalCases: false,
  },
  setLoading: (key, loading) =>
    set((state) => ({
      loading: { ...state.loading, [key]: loading },
    })),
}));
