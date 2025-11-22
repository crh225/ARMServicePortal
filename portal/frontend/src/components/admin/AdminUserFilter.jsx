import "../../styles/AdminPanel.css";

/**
 * AdminUserFilter component
 * User filter dropdown for filtering resources by owner
 */
function AdminUserFilter({ availableUsers, userFilter, onFilterChange, allResourcesCount }) {
  if (availableUsers.length === 0) {
    return null;
  }

  return (
    <div className="admin-filters">
      <div className="filter-group">
        <label htmlFor="user-filter">Filter by User:</label>
        <select
          id="user-filter"
          value={userFilter}
          onChange={(e) => onFilterChange(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Users ({allResourcesCount} resources)</option>
          {availableUsers.map(({ owner, count }) => (
            <option key={owner} value={owner}>
              {owner} ({count} resources)
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default AdminUserFilter;
