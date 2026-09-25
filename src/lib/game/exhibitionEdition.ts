import { ROUTES } from "@/lib/routes";

export type ExhibitionEdition = "improved" | "tgs";

export function getExhibitionEdition(pathname: string | null): ExhibitionEdition | null {
  if (pathname === ROUTES.gameExhibitionTgs) return "tgs";
  if (pathname === ROUTES.gameExhibition) return "improved";
  return null;
}

export function getExhibitionPath(edition: ExhibitionEdition): string {
  return edition === "tgs" ? ROUTES.gameExhibitionTgs : ROUTES.gameExhibition;
}

export function keepExhibitionEdition(path: string, edition: ExhibitionEdition): string {
  if (edition !== "tgs" || !path.startsWith(ROUTES.gameExhibition)) return path;
  const suffix = path.slice(ROUTES.gameExhibition.length);
  if (suffix && !suffix.startsWith("?") && !suffix.startsWith("#")) return path;
  return `${ROUTES.gameExhibitionTgs}${suffix}`;
}
