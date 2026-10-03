import { appIconResponse } from "@/lib/app-icon";

// Fixed URLs (/pwa-icon/192, /pwa-icon/512) for the web app manifest, which
// can't point at the hashed URLs of the icon file convention.
const SIZES = ["192", "512"] as const;

export const dynamicParams = false;

export function generateStaticParams() {
  return SIZES.map((size) => ({ size }));
}

export async function GET(_request: Request, ctx: RouteContext<"/pwa-icon/[size]">) {
  const { size } = await ctx.params;
  return appIconResponse(Number(size));
}
