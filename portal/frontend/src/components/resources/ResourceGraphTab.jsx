import ResourceGraph from "./ResourceGraph";
import "../../styles/ResourceDetailDrawer.css";

/**
 * Graph Tab Content - Force-directed graph visualization
 */
function ResourceGraphTab({ resource }) {
  return (
    <div className="drawer-sections">
      <div className="drawer-section">
        <h3 className="section-title">Resource Graph</h3>
        <ResourceGraph resource={resource} />
      </div>
    </div>
  );
}

export default ResourceGraphTab;
