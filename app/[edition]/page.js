import { notFound } from "next/navigation";
import { getEditionById } from "@/lib/stroll/editions.js";
import { AREAS } from "@/lib/stroll/areas.js";
import EditionHomeForm from "./edition-home-form.jsx";

export default async function EditionHome({ params }) {
  const { edition: editionId } = await params;
  const edition = getEditionById(editionId);
  if (!edition || !edition.active) {
    notFound();
  }
  const areas = AREAS.filter((a) => a.editionId === editionId);
  return <EditionHomeForm edition={edition} areas={areas} />;
}
