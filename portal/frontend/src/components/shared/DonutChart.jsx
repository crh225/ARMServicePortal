import React, { useEffect, useRef } from "react";
import "../../styles/DonutChart.css";

/**
 * DonutChart Component
 * Displays a donut chart similar to Azure Cost Management portal
 * @param {Array} data - Array of {label, value, color} objects
 * @param {number} size - Size of the chart in pixels (default: 140)
 * @param {number} thickness - Thickness of the donut ring (default: 30)
 */
function DonutChart({ data, size = 140, thickness = 30 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !data || data.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // Support high-DPI displays
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = (size - thickness) / 2;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    // Calculate total
    const total = data.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) return;

    // Draw segments
    let currentAngle = -Math.PI / 2; // Start at top

    data.forEach((item) => {
      const sliceAngle = (item.value / total) * 2 * Math.PI;

      // Create gradient for this segment
      let strokeStyle;
      if (item.gradient) {
        // Create radial gradient
        const gradient = ctx.createRadialGradient(centerX, centerY, radius - thickness/2, centerX, centerY, radius + thickness/2);
        gradient.addColorStop(0, item.gradient.start);
        gradient.addColorStop(1, item.gradient.end);
        strokeStyle = gradient;
      } else {
        strokeStyle = item.color;
      }

      // Draw arc
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.lineWidth = thickness;
      ctx.strokeStyle = strokeStyle;
      ctx.lineCap = "butt";
      ctx.stroke();

      currentAngle += sliceAngle;
    });
  }, [data, size, thickness]);

  return (
    <div className="donut-chart">
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="donut-chart-canvas"
      />
    </div>
  );
}

export default DonutChart;
