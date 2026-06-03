import { notFound } from "next/navigation";

export function requireDevOnly() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }
}
