import markOriginal from "@/assets/brand/ul-mark-original.png";
import logoCompact from "@/assets/logo/ul-logo-compact-original.png";
import Image from "next/image";
import Link from "next/link";

/**
 * ASSET_GUIDE.md §2/§3: the compact "UL </>" lockup is the header-scale mark;
 * the bare "UL" monogram is for icon-scale placements (collapsed sidebar,
 * mobile top bar). Both *-original variants, approved on dark backgrounds only.
 * Links to /app, the organization-resolution entry point. Width and height
 * are both explicit (from the masters' aspect ratios) so rendering doesn't
 * depend on the bundler turning the import into StaticImageData.
 */
export function Brand({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <Link href="/app" aria-label="Última Linha — início" className="flex items-center rounded-md">
      {collapsed ? (
        <Image src={markOriginal} alt="" width={22} height={14} className="h-3.5 w-auto" priority />
      ) : (
        <Image src={logoCompact} alt="" width={60} height={16} className="h-4 w-auto" priority />
      )}
    </Link>
  );
}
