import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import BlueprintsListSkeleton from "./BlueprintsListSkeleton";

describe("BlueprintsListSkeleton", () => {
  it("renders the title and description", () => {
    render(<BlueprintsListSkeleton />);

    expect(screen.getByText("Service Catalog")).toBeInTheDocument();
    expect(screen.getByText("Choose from pre-approved infrastructure templates")).toBeInTheDocument();
  });

  it("renders default number of skeleton cards (6)", () => {
    const { container } = render(<BlueprintsListSkeleton />);

    const skeletonCards = container.querySelectorAll(".blueprint-card--skeleton");
    expect(skeletonCards).toHaveLength(6);
  });

  it("renders custom number of skeleton cards when count is provided", () => {
    const { container } = render(<BlueprintsListSkeleton count={4} />);

    const skeletonCards = container.querySelectorAll(".blueprint-card--skeleton");
    expect(skeletonCards).toHaveLength(4);
  });

  it("renders skeleton elements in each card", () => {
    const { container } = render(<BlueprintsListSkeleton count={2} />);

    const blueprintCards = container.querySelectorAll(".blueprint-card--skeleton");

    blueprintCards.forEach(card => {
      // Each card should have skeleton elements
      expect(card.querySelector(".skeleton-icon")).toBeInTheDocument();
      expect(card.querySelector(".skeleton-category")).toBeInTheDocument();
      expect(card.querySelector(".skeleton-version")).toBeInTheDocument();
      expect(card.querySelector(".skeleton-title")).toBeInTheDocument();
      expect(card.querySelector(".skeleton-desc")).toBeInTheDocument();
      expect(card.querySelector(".skeleton-provider")).toBeInTheDocument();
    });
  });

  it("renders with correct class names for blueprint grid", () => {
    const { container } = render(<BlueprintsListSkeleton />);

    const blueprintGrid = container.querySelector(".blueprint-grid");
    expect(blueprintGrid).toBeInTheDocument();
  });

  it("renders a skeleton search bar", () => {
    const { container } = render(<BlueprintsListSkeleton />);

    const searchSkeleton = container.querySelector(".blueprint-search .skeleton");
    expect(searchSkeleton).toBeInTheDocument();
  });

  it("renders zero skeleton cards when count is 0", () => {
    const { container } = render(<BlueprintsListSkeleton count={0} />);

    const skeletonCards = container.querySelectorAll(".blueprint-card--skeleton");
    expect(skeletonCards).toHaveLength(0);
  });
});
