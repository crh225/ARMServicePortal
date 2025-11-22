import LogsViewer from "./LogsViewer";
import "../../styles/ResourceDetailDrawer.css";

/**
 * Logs Tab Content - Display resource logs
 */
function ResourceLogsTab({ resource }) {
  return (
    <div className="drawer-sections">
      <div className="drawer-section">
        <LogsViewer resource={resource} />
      </div>
    </div>
  );
}

export default ResourceLogsTab;
