/** The UI must not manufacture safety evidence when source fields are absent. */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ColdChainBadge, MatchTypeBadge } from "@/components/ui/core";

describe("evidence badges", () => {
  it("shows unavailable for missing cold-chain verification", () => {
    render(<ColdChainBadge />);
    expect(screen.getByText("Cold-chain status unavailable")).toBeInTheDocument();
    expect(screen.queryByText(/2°C–6°C Verified/)).not.toBeInTheDocument();
  });

  it("shows an excursion hold without pretending it passed", () => {
    render(<ColdChainBadge verified={false} quarantinedUnits={3} tempCelsius={7.4} />);
    expect(screen.getByText("3 Excursion Quarantined")).toBeInTheDocument();
  });

  it("only shows verified status when the backend provides it", () => {
    render(<ColdChainBadge verified tempCelsius={3.8} />);
    expect(screen.getByText("2°C–6°C Verified (3.8°C)")).toBeInTheDocument();
  });

  it("does not invent an exact compatibility match", () => {
    render(<MatchTypeBadge />);
    expect(screen.getByText("Group match not confirmed")).toBeInTheDocument();
    expect(screen.queryByText("Exact Group Match")).not.toBeInTheDocument();
  });
});
