import { DecisionNav } from "@/components/DecisionNav";

/** Shared chrome for all four decision views: a sticky tab bar to move between
 * them, so the tool feels like one app rather than four disconnected pages. */
export default function DecisionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <DecisionNav />
      {children}
    </>
  );
}
