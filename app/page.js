import { redirect } from "next/navigation";
import { ACTIVE_EDITIONS } from "@/lib/stroll/editions.js";

export default async function RootPage({ searchParams }) {
  const defaultEdition = ACTIVE_EDITIONS[0]?.id ?? "taipei";
  const sp = await searchParams;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(sp ?? {})) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      for (const v of value) query.append(key, v);
    } else {
      query.append(key, value);
    }
  }
  const qs = query.toString();
  redirect(qs.length > 0 ? `/${defaultEdition}?${qs}` : `/${defaultEdition}`);
}
