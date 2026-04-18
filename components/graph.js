import {useEffect, useRef} from 'react'; 
import * as d3 from 'd3';
import { getNodes } from '../utils/getNodes';
import { getLinks } from '../utils/getLinks';   
import {drag} from '../utils/drag';


export function Graph(props) {
        const { margin, svg_width, svg_height, data } = props;

        const nodes = getNodes({rawData: data});
        const links = getLinks({rawData: data});
    
        const width = svg_width - margin.left - margin.right;
        const height = svg_height - margin.top - margin.bottom;

        const lineWidth = d3.scaleLinear().range([2, 6]).domain([d3.min(links, d => d.value), d3.max(links, d => d.value)]);
        const radius = d3.scaleLinear().range([10, 50])
                .domain([d3.min(nodes, d => d.value), d3.max(nodes, d => d.value)]);
        const color = d3.scaleOrdinal().range(d3.schemeCategory10).domain(nodes.map( d => d.name));
        
        const d3Selection = useRef();
        useEffect( ()=>{
            d3.select(d3Selection.current).selectAll("*").remove();
            d3.select(d3Selection.current.parentNode).select(".legend").remove();
            let g = d3.select(d3Selection.current);

            const tooltip = g.append("g")
                .attr("class", "node-tooltip")
                .style("display", "none")
                .style("pointer-events", "none");

            const tooltipBox = tooltip.append("rect")
                .attr("fill", "white")
                .attr("stroke", "black")
                .attr("rx", 4);

            const tooltipText = tooltip.append("text")
                .attr("x", 8)
                .attr("y", 16)
                .style("font-size", "12px")
                .style("fill", "black");

            const showTooltip = (event, d) => {
                const [x, y] = d3.pointer(event, d3Selection.current);
                tooltipText.text(d.name);
                const textWidth = tooltipText.node().getComputedTextLength();
                tooltipBox
                    .attr("width", textWidth + 16)
                    .attr("height", 24);
                tooltip
                    .style("display", null)
                    .raise()
                    .attr("transform", `translate(${x + 12}, ${y - 28})`);
            };

            const moveTooltip = (event) => {
                const [x, y] = d3.pointer(event, d3Selection.current);
                tooltip
                    .raise()
                    .attr("transform", `translate(${x + 12}, ${y - 28})`);
            };

            const hideTooltip = () => {
                tooltip.style("display", "none");
            };

            const simulation =  d3.forceSimulation(nodes)
                .force("link", d3.forceLink(links).id(d => d.name).distance(d => 20/d.value))
                .force("charge", d3.forceManyBody())
                .force("centrer", d3.forceCenter(width/2, height/2))
                .force("y", d3.forceY([height/2]).strength(0.02))
                .force("collide", d3.forceCollide().radius(d => radius(d.value)+20))
                .tick(3000);

            const link = g.append("g")
                .attr("stroke", "#999")
                .attr("stroke-opacity", 0.6)
                .selectAll("line")
                .data(links)
                .join("line")
                .attr("stroke-width", d => lineWidth(d.value));

            const node = g.append("g")
                .attr("stroke", "#fff")
                .attr("stroke-width", 1.5)
                .selectAll("circle")
                .data(nodes)
                .enter();

            const point = node.append("circle")
                .attr("r", d => radius(d.value))
                .attr("fill", d => color(d.name))
                .call(drag(simulation))
                .on("mouseover", showTooltip)
                .on("mousemove", moveTooltip)
                .on("mouseout", hideTooltip);

            point.append("title")
                .text(d => d.name);

            simulation.on("tick", () => {
                link
                    .attr("x1", d => d.source.x)
                    .attr("y1", d => d.source.y)
                    .attr("x2", d => d.target.x)
                    .attr("y2", d => d.target.y);

                point
                    .attr("cx", d => d.x)
                    .attr("cy", d => d.y);
            });

            let legend = d3.select(d3Selection.current.parentNode).append("g")
                .attr("class", "legend")
                .attr("transform", "translate(10,10)");
            const legendItems = legend.selectAll(".legend-item")
                .data(color.domain())
                .enter().append("g")
                .attr("class", "legend-item")
                .attr("transform", (d, i) => `translate(0, ${i * 20})`);
            legendItems.append("circle")
                .attr("r", 5)
                .attr("fill", d => color(d));
            legendItems.append("text")
                .attr("x", 10)
                .attr("y", 5)
                .text(d => d)
                .style("font-size", "12px");

            return () => {
                simulation.stop();
            };

        }, [width, height, nodes, links])


        return <svg 
            viewBox={`0 0 ${svg_width} ${svg_height}`}
            preserveAspectRatio="xMidYMid meet"
            style={{ width: "100%", height: "100%" }}
            > 
                <g ref={d3Selection} transform={`translate(${margin.left}, ${margin.top})`}>
                </g>
            </svg>
    };
