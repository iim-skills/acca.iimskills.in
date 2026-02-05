// src/lib/heroDataCache.ts
import { getHeroData } from "@/components/dataTS/heroSecData";
import type { HeroData } from "@/components/dataTS/heroSecData";

let cachedHeroData: HeroData[] | null = null;

export async function getCachedHeroData(): Promise<HeroData[]> {
  if (cachedHeroData) return cachedHeroData;
  cachedHeroData = await getHeroData();
  return cachedHeroData;
}
    