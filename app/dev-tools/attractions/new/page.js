import { requireDevOnly } from "@/lib/dev-tools/dev-only.js";
import { readAttractions } from "@/lib/dev-tools/attractions-file.js";
import { EDITIONS } from "@/lib/stroll/editions.js";
import { AREAS } from "@/lib/stroll/areas.js";
import AttractionForm from "./attraction-form.jsx";

export default function AdminNewAttractionPage() {
  requireDevOnly();
  const attractions = readAttractions();
  const existingIds = attractions.map((a) => a.id);
  return (
    <AttractionForm
      editions={EDITIONS}
      areas={AREAS}
      existingIds={existingIds}
    />
  );
}
