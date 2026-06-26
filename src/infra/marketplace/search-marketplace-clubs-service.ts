import { createSearchMarketplaceClubs } from "@/core/use-cases/marketplace/search-marketplace-clubs";
import { marketplaceSearchRepo } from "@/infra/db/repositories/marketplace-search-repo";
import { withSearchCache } from "@/lib/search-cache";

// Wrap the search method with in-memory 5-minute TTL cache
const cachedSearch = withSearchCache((filters) => marketplaceSearchRepo.search(filters));

export const searchMarketplaceClubs = createSearchMarketplaceClubs({
  ...marketplaceSearchRepo,
  search: cachedSearch,
});
