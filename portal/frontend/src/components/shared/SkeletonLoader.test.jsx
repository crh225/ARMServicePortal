import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import SkeletonLoader from "./SkeletonLoader";

describe("SkeletonLoader", () => {
  it("renders a single skeleton by default", () => {
    const { container } = render(<SkeletonLoader />);

    const skeletons = container.querySelectorAll(".skeleton");
    expect(skeletons).toHaveLength(1);
  });

  it("renders multiple skeletons when count is specified", () => {
    const { container } = render(<SkeletonLoader count={3} />);

    const skeletons = container.querySelectorAll(".skeleton");
    expect(skeletons).toHaveLength(3);
  });

  it("renders text skeleton type", () => {
    const { container } = render(<SkeletonLoader type="text" />);

    const skeleton = container.querySelector(".skeleton--text");
    expect(skeleton).toBeInTheDocument();
  });

  it("renders title skeleton type", () => {
    const { container } = render(<SkeletonLoader type="title" />);

    const skeleton = container.querySelector(".skeleton--title");
    expect(skeleton).toBeInTheDocument();
  });

  it("renders card skeleton type", () => {
    const { container } = render(<SkeletonLoader type="card" />);

    const skeleton = container.querySelector(".skeleton--card");
    expect(skeleton).toBeInTheDocument();
  });

  it("renders button skeleton type", () => {
    const { container } = render(<SkeletonLoader type="button" />);

    const skeleton = container.querySelector(".skeleton--button");
    expect(skeleton).toBeInTheDocument();
  });

  it("renders input skeleton type", () => {
    const { container } = render(<SkeletonLoader type="input" />);

    const skeleton = container.querySelector(".skeleton--input");
    expect(skeleton).toBeInTheDocument();
  });

  it("renders badge skeleton type", () => {
    const { container } = render(<SkeletonLoader type="badge" />);

    const skeleton = container.querySelector(".skeleton--badge");
    expect(skeleton).toBeInTheDocument();
  });

  it("renders circle skeleton type", () => {
    const { container } = render(<SkeletonLoader type="circle" />);

    const skeleton = container.querySelector(".skeleton--circle");
    expect(skeleton).toBeInTheDocument();
  });

  it("renders default skeleton class for unknown type", () => {
    const { container } = render(<SkeletonLoader type="unknown" />);

    const skeleton = container.querySelector(".skeleton");
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).not.toHaveClass("skeleton--text");
    expect(skeleton).not.toHaveClass("skeleton--title");
  });

  it("applies custom width style", () => {
    const { container } = render(<SkeletonLoader width="200px" />);

    const skeleton = container.querySelector(".skeleton");
    expect(skeleton).toHaveStyle({ width: "200px" });
  });

  it("applies custom height style", () => {
    const { container } = render(<SkeletonLoader height="50px" />);

    const skeleton = container.querySelector(".skeleton");
    expect(skeleton).toHaveStyle({ height: "50px" });
  });

  it("applies both width and height styles", () => {
    const { container } = render(<SkeletonLoader width="300px" height="100px" />);

    const skeleton = container.querySelector(".skeleton");
    expect(skeleton).toHaveStyle({ width: "300px", height: "100px" });
  });

  it("applies custom className", () => {
    const { container } = render(<SkeletonLoader className="custom-class" />);

    const skeleton = container.querySelector(".skeleton");
    expect(skeleton).toHaveClass("custom-class");
  });

  it("applies both type class and custom className", () => {
    const { container } = render(<SkeletonLoader type="text" className="my-skeleton" />);

    const skeleton = container.querySelector(".skeleton");
    expect(skeleton).toHaveClass("skeleton--text");
    expect(skeleton).toHaveClass("my-skeleton");
  });

  it("renders shimmer element inside skeleton", () => {
    const { container } = render(<SkeletonLoader />);

    const shimmer = container.querySelector(".skeleton__shimmer");
    expect(shimmer).toBeInTheDocument();
  });

  it("renders shimmer element in all skeletons when count > 1", () => {
    const { container } = render(<SkeletonLoader count={3} />);

    const shimmers = container.querySelectorAll(".skeleton__shimmer");
    expect(shimmers).toHaveLength(3);
  });

  it("wraps skeletons in skeleton-wrapper", () => {
    const { container } = render(<SkeletonLoader count={2} />);

    const wrapper = container.querySelector(".skeleton-wrapper");
    expect(wrapper).toBeInTheDocument();

    const skeletons = wrapper.querySelectorAll(".skeleton");
    expect(skeletons).toHaveLength(2);
  });

  it("renders no skeletons when count is 0", () => {
    const { container } = render(<SkeletonLoader count={0} />);

    const skeletons = container.querySelectorAll(".skeleton");
    expect(skeletons).toHaveLength(0);
  });

  it("trims className to avoid extra whitespace", () => {
    const { container } = render(<SkeletonLoader className="" />);

    const skeleton = container.querySelector(".skeleton");
    const className = skeleton.getAttribute("class");

    // Should not have trailing space
    expect(className).not.toMatch(/\s$/);
  });
});
