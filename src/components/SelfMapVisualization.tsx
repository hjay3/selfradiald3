import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { DataPoint } from '../types/selfMap';

interface SelfMapVisualizationProps {
  data: DataPoint[];
}

export const SelfMapVisualization: React.FC<SelfMapVisualizationProps> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    // Clear previous visualization
    d3.select(svgRef.current).selectAll('*').remove();

    const margin = { top: 40, right: 120, bottom: 50, left: 60 };
    const width = 800 - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Calculate positions based on value (closer to 10 = closer to center)
    const points = data.map((d, i) => {
      const angle = (i * 2 * Math.PI) / data.length;
      const radius = (10 - d.value) * (Math.min(width, height) / 20); // Inverse relationship
      return {
        ...d,
        x: width/2 + radius * Math.cos(angle),
        y: height/2 + radius * Math.sin(angle),
        angle
      };
    });

    // Add circles
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    const tooltip = d3.select('body')
      .append('div')
      .attr('class', 'absolute hidden bg-white p-4 rounded-lg shadow-lg border border-gray-200 max-w-xs')
      .style('pointer-events', 'none');

    // Add connecting lines to center
    svg.selectAll('line')
      .data(points)
      .enter()
      .append('line')
      .attr('x1', width/2)
      .attr('y1', height/2)
      .attr('x2', d => d.x)
      .attr('y2', d => d.y)
      .attr('stroke', '#e2e8f0')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4,4');

    // Add circles
    svg.selectAll('circle')
      .data(points)
      .enter()
      .append('circle')
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      .attr('r', 8)
      .attr('fill', d => colorScale(d.category))
      .attr('stroke', 'white')
      .attr('stroke-width', 2)
      .on('mouseover', (event, d) => {
        tooltip
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY - 10}px`)
          .html(`
            <div class="font-semibold">${d.label}</div>
            <div class="text-sm text-gray-600">Category: ${d.category}</div>
            <div class="text-sm text-gray-600">Value: ${d.value}/10</div>
            ${d.details ? `<div class="text-sm text-gray-600 mt-2">${JSON.stringify(d.details, null, 2)}</div>` : ''}
          `)
          .classed('hidden', false);
      })
      .on('mouseout', () => {
        tooltip.classed('hidden', true);
      });

    // Add labels
    svg.selectAll('text')
      .data(points)
      .enter()
      .append('text')
      .attr('x', d => d.x + 12)
      .attr('y', d => d.y)
      .text(d => d.label)
      .attr('font-size', '12px')
      .attr('fill', '#4b5563');

    // Add legend
    const legend = svg.append('g')
      .attr('transform', `translate(${width + 10}, 0)`);

    const categories = Array.from(new Set(data.map(d => d.category)));
    
    legend.selectAll('rect')
      .data(categories)
      .enter()
      .append('rect')
      .attr('x', 0)
      .attr('y', (d, i) => i * 25)
      .attr('width', 12)
      .attr('height', 12)
      .attr('fill', d => colorScale(d));

    legend.selectAll('text')
      .data(categories)
      .enter()
      .append('text')
      .attr('x', 20)
      .attr('y', (d, i) => i * 25 + 10)
      .text(d => d)
      .attr('font-size', '12px')
      .attr('fill', '#4b5563');

    // Cleanup
    return () => {
      tooltip.remove();
    };
  }, [data]);

  return (
    <div className="w-full overflow-x-auto">
      <svg ref={svgRef} className="mx-auto" />
    </div>
  );
};