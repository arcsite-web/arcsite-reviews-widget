import { appStoreAdapter } from "@/lib/sources/appStore";
import { gdmExportAdapter } from "@/lib/sources/gdmExport";
import { googlePlayAdapter } from "@/lib/sources/stubs";
import type { ReviewSourceAdapter } from "@/lib/types";

export const ALL_SOURCE_ADAPTERS: ReviewSourceAdapter[] = [
  appStoreAdapter,
  gdmExportAdapter,
  googlePlayAdapter,
];
