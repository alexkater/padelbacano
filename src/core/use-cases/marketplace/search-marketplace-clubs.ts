import type {
  MarketplaceSearchPort,
  SearchFilters,
  SearchResponse,
} from "@/core/entities/marketplace";

export type SearchMarketplaceClubs = {
  readonly execute: (filters: SearchFilters) => Promise<SearchResponse>;
};

export function createSearchMarketplaceClubs(
  marketplaceSearchPort: MarketplaceSearchPort
): SearchMarketplaceClubs {
  return {
    execute(filters) {
      return marketplaceSearchPort.search(filters);
    },
  };
}
