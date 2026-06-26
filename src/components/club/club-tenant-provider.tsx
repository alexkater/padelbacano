"use client";

import { createContext, useContext } from "react";
import type { ClubConfigModules } from "@/core/ports/club-config-port";

export type ClubTenantView = {
  readonly slug: string;
  readonly name: string;
  readonly city: string;
  readonly modules: ClubConfigModules;
  readonly clubId: string | null;
};

const ClubTenantContext = createContext<ClubTenantView | null>(null);

export function ClubTenantProvider({
  children,
  tenant,
}: {
  readonly children: React.ReactNode;
  readonly tenant: ClubTenantView;
}) {
  return <ClubTenantContext.Provider value={tenant}>{children}</ClubTenantContext.Provider>;
}

export function useClubTenant(): ClubTenantView {
  const tenant = useContext(ClubTenantContext);
  if (!tenant) {
    throw new Error("useClubTenant must be used inside ClubTenantProvider");
  }

  return tenant;
}
