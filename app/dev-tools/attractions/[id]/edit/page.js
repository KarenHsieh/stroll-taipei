import { notFound } from "next/navigation";
import { requireDevOnly } from "@/lib/dev-tools/dev-only.js";
import { readAttractions } from "@/lib/dev-tools/attractions-file.js";
import { EDITIONS } from "@/lib/stroll/editions.js";
import { AREAS } from "@/lib/stroll/areas.js";
import AttractionForm from "../../new/attraction-form.jsx";

export default async function AdminEditAttractionPage({ params }) {
  requireDevOnly();
  const { id } = await params;
  const attractions = readAttractions();
  const initial = attractions.find((a) => a.id === id);
  if (!initial) {
    notFound();
  }
  const existingIds = attractions.map((a) => a.id);
  return (
    <AttractionForm
      editions={EDITIONS}
      areas={AREAS}
      existingIds={existingIds}
      mode="edit"
      initialAttraction={initial}
    />
  );
}
