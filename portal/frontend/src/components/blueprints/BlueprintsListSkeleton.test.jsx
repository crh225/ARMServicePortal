import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import BlueprintsListSkeleton from "./BlueprintsListSkeleton";

describe("BlueprintsListSkeleton", () => {
  it("renders the title and description", () => {
    render(<BlueprintsListSkeleton />);

    expect(screen.getByText("Choose a Blueprint")).toBeInTheDocument();
    expect(screen.getByText("Select an approved Terraform module to deploy.")).toBeInTheDocument();
  });

  it("renders default number of skeleton cards (4)", () => {
    const { container } = render(<BlueprintsListSkeleton />);

    const skeletonCards = container.querySelectorAll(".blueprint-card");
    expect(skeletonCards).toHaveLength(4);
  });

  it("renders custom number of skeleton cards when count is provided", () => {
    const { container } = render(<BlueprintsListSkeleton count={6} />);

    const skeletonCards = container.querySelectorAll(".blueprint-card");
    expect(skeletonCards).toHaveLength(6);
  });

  it("renders skeleton loaders for title and badge in each card", () => {
    const { container } = render(<BlueprintsListSkeleton count={2} />);

    const blueprintCards = container.querySelectorAll(".blueprint-card");

    blueprintCards.forEach(card => {
      const skeletons = card.querySelectorAll(".skeleton");
      // Each card should have: 1 title skeleton, 1 badge skeleton, 2 text skeletons = 4 total
      expect(skeletons.length).toBeGreaterThanOrEqual(4);
    });
  });

  it("renders text skeletons with correct widths", () => {
    const { container } = render(<BlueprintsListSkeleton count={1} />);

    // Check for the 100% width skeleton
    const fullWidthSkeleton = container.querySelector('.skeleton[style*="width: 100%"]');
    expect(fullWidthSkeleton).toBeInTheDocument();

    // Check for the 80% width skeleton
    const partialWidthSkeleton = container.querySelector('.skeleton[style*="width: 80%"]');
    expect(partialWidthSkeleton).toBeInTheDocument();
  });

  it("renders with correct class names for blueprint list", () => {
    const { container } = render(<BlueprintsListSkeleton />);

    const blueprintList = container.querySelector(".blueprint-list");
    expect(blueprintList).toBeInTheDocument();
  });

  it("renders zero skeleton cards when count is 0", () => {
    const { container } = render(<BlueprintsListSkeleton count={0} />);

    const skeletonCards = container.querySelectorAll(".blueprint-card");
    expect(skeletonCards).toHaveLength(0);
  });
});
