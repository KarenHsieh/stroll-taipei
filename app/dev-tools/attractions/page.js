import { requireDevOnly } from "@/lib/dev-tools/dev-only.js";
import { readAttractions } from "@/lib/dev-tools/attractions-file.js";
import { EDITIONS } from "@/lib/stroll/editions.js";
import { AREAS } from "@/lib/stroll/areas.js";
import AttractionsTable from "./attractions-table.jsx";

export default function AdminAttractionsPage() {
  requireDevOnly();
  const attractions = readAttractions();
  return (
    <AttractionsTable attractions={attractions} editions={EDITIONS} areas={AREAS} />
  );
}
