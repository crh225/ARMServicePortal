import React from "react";
import "../styles/SkeletonLoader.css";

/**
 * Skeleton loader component with shimmer animation
 * Used for loading states throughout the app
 */
function SkeletonLoader({ type = "text", count = 1, width, height, className = "" }) {
  const skeletons = Array(count).fill(null);

  const renderSkeleton = (index) => {
    let skeletonClass = "skeleton";

    switch (type) {
      case "text":
        skeletonClass = "skeleton skeleton--text";
        break;
      case "title":
        skeletonClass = "skeleton skeleton--title";
        break;
      case "card":
        skeletonClass = "skeleton skeleton--card";
        break;
      case "button":
        skeletonClass = "skeleton skeleton--button";
        break;
      case "input":
        skeletonClass = "skeleton skeleton--input";
        break;
      case "badge":
        skeletonClass = "skeleton skeleton--badge";
        break;
      case "circle":
        skeletonClass = "skeleton skeleton--circle";
        break;
      default:
        skeletonClass = "skeleton";
    }

    const style = {};
    if (width) style.width = width;
    if (height) style.height = height;

    return (
      <div key={index} className={`${skeletonClass} ${className}`.trim()} style={style}>
        <div className="skeleton__shimmer" />
      </div>
    );
  };

  return (
    <div className="skeleton-wrapper">
      {skeletons.map((_, index) => renderSkeleton(index))}
    </div>
  );
}

export default SkeletonLoader;
