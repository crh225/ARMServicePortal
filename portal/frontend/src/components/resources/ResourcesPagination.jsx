import React from "react";
import "../../styles/resources/ResourcesPagination.css";

/**
 * ResourcesPagination component
 * Pagination controls for resources table
 */
function ResourcesPagination({
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
  onPageChange
}) {
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems);

  if (totalPages <= 1) {
    return (
      <div className="resources-count">
        Showing {startIndex}-{endIndex} of {totalItems} resources
      </div>
    );
  }

  return (
    <>
      <div className="resources-count">
        Showing {startIndex}-{endIndex} of {totalItems} resources
      </div>
      <div className="pagination">
        <button
          className="nav-pill"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          ← Prev
        </button>
        <span className="pagination-info">
          Page {currentPage} of {totalPages}
        </span>
        <button
          className="nav-pill"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next →
        </button>
      </div>
    </>
  );
}

export default ResourcesPagination;
