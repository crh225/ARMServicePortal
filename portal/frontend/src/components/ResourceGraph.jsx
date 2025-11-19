import React, { useEffect, useRef, useState } from "react";
import { fetchResourcesByRequestId } from "../services/resourcesApi";
import { OwnershipStatus } from "../hooks/useResources";
import "../styles/ResourceGraph.css";

/**
 * Simple force-directed graph for visualizing resources
 * This is a basic implementation - can be enhanced with D3 or react-force-graph later
 */
function ResourceGraph({ resource }) {
  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const canvasRef = useRef(null);

  // Fetch resources related to this request
  useEffect(() => {
    async function fetchGraphData() {
      if (!resource.requestId) {
        setError("No request ID available for this resource");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Fetch from backend API
        const response = await fetchResourcesByRequestId(resource.requestId);
        const resources = response.resources;

        // Build graph data
        const nodes = [
          {
            id: `request-${resource.requestId}`,
            label: `Request #${resource.requestId}`,
            type: "request",
            x: 0,
            y: 0
          }
        ];

        resources.forEach((r, index) => {
          nodes.push({
            id: r.id,
            label: r.name,
            type: "resource",
            resourceType: r.type,
            ownershipStatus: r.ownershipStatus || computeOwnershipStatus(r),
            x: Math.cos((index / resources.length) * 2 * Math.PI) * 150,
            y: Math.sin((index / resources.length) * 2 * Math.PI) * 150
          });
        });

        const edges = resources.map(r => ({
          from: `request-${resource.requestId}`,
          to: r.id
        }));

        setGraphData({ nodes, edges });
      } catch (err) {
        console.error("Failed to fetch graph data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchGraphData();
  }, [resource]);

  // Simple canvas rendering
  useEffect(() => {
    if (!graphData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw edges
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 2;
    graphData.edges.forEach(edge => {
      const fromNode = graphData.nodes.find(n => n.id === edge.from);
      const toNode = graphData.nodes.find(n => n.id === edge.to);

      if (fromNode && toNode) {
        ctx.beginPath();
        ctx.moveTo(centerX + fromNode.x, centerY + fromNode.y);
        ctx.lineTo(centerX + toNode.x, centerY + toNode.y);
        ctx.stroke();
      }
    });

    // Draw nodes
    graphData.nodes.forEach(node => {
      const x = centerX + node.x;
      const y = centerY + node.y;

      // Draw circle
      ctx.beginPath();
      ctx.arc(x, y, node.type === "request" ? 20 : 15, 0, 2 * Math.PI);

      if (node.type === "request") {
        ctx.fillStyle = "#3b82f6";
      } else {
        switch (node.ownershipStatus) {
          case OwnershipStatus.MANAGED:
            ctx.fillStyle = "#10b981";
            break;
          case OwnershipStatus.ORPHAN:
            ctx.fillStyle = "#ef4444";
            break;
          case OwnershipStatus.STALE:
            ctx.fillStyle = "#f59e0b";
            break;
          default:
            ctx.fillStyle = "#94a3b8";
        }
      }

      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw label
      ctx.fillStyle = "#1e293b";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(
        node.label.length > 20 ? node.label.substring(0, 17) + "..." : node.label,
        x,
        y + (node.type === "request" ? 35 : 30)
      );
    });
  }, [graphData]);

  if (loading) {
    return (
      <div className="graph-container">
        <div className="graph-loading">Loading resource graph...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="graph-container">
        <div className="graph-error">
          <p><strong>Error loading graph:</strong></p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!graphData) {
    return (
      <div className="graph-container">
        <div className="graph-empty">No graph data available</div>
      </div>
    );
  }

  return (
    <div className="graph-container">
      <div className="graph-legend">
        <div className="legend-item">
          <div className="legend-dot legend-dot--request"></div>
          <span>Request</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot legend-dot--managed"></div>
          <span>Managed</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot legend-dot--orphan"></div>
          <span>Orphan</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot legend-dot--stale"></div>
          <span>Stale</span>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={500}
        height={400}
        className="graph-canvas"
      />

      <div className="graph-info">
        <p>Showing {graphData.nodes.length - 1} resources from request #{resource.requestId}</p>
      </div>
    </div>
  );
}

/**
 * Simple ownership status computation (duplicated for simplicity)
 */
function computeOwnershipStatus(resource) {
  const hasArmPortalTag = resource.tags &&
    Object.keys(resource.tags).some(key => key.startsWith("armportal"));

  if (!hasArmPortalTag) {
    return OwnershipStatus.UNMANAGED;
  }

  // Simplified - would need PR lookup for accurate status
  return OwnershipStatus.MANAGED;
}

export default ResourceGraph;
