export function getJoinUrl(): string {
  if (typeof window === "undefined") return "/join";
  return `${window.location.origin}/join`;
}
