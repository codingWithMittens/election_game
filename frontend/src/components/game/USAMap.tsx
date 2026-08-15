import { useEffect, useRef, useState } from 'react';
import { State } from '../../types';

interface GameStateData {
  state_abbr: string;
  current_lean: number;
  controlling_player_id: string | null;
}

interface USAMapProps {
  gameStates: GameStateData[];
  statesData: (State & { currentLean: number })[];
  onStateClick?: (stateAbbr: string) => void;
  selectedStates?: string[];
  getStateColor: (lean: number) => string;
}

interface TooltipData {
  name: string;
  abbreviation: string;
  electoralVotes: number;
  lean: number;
  x: number;
  y: number;
}

function USAMap({ statesData, onStateClick, selectedStates = [], getStateColor }: USAMapProps) {
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  useEffect(() => {
    // Load the SVG and manipulate it
    const loadSVG = async () => {
      try {
        const response = await fetch('/us_map.svg');
        const svgText = await response.text();

        if (svgContainerRef.current) {
          svgContainerRef.current.innerHTML = svgText;

          const svgElement = svgContainerRef.current.querySelector('svg');
          if (svgElement) {
            // Make SVG responsive and properly sized
            svgElement.setAttribute('width', '100%');
            svgElement.setAttribute('height', '100%');
            svgElement.setAttribute('viewBox', '0 0 959 593');
            svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet');
            svgElement.style.minHeight = '550px';
            svgElement.style.maxHeight = '700px';
            svgElement.style.display = 'block';

            // Apply colors and interactivity to each state
            statesData.forEach(state => {
              const stateAbbr = state.abbreviation.toLowerCase();
              const statePath = svgElement.querySelector(`.${stateAbbr}`);

              if (statePath) {
                const lean = state.currentLean;
                const color = getStateColor(lean);
                const isSelected = selectedStates.includes(state.abbreviation);

                // Apply fill color
                (statePath as SVGElement).style.fill = color;

                // Apply stroke for selected states
                if (isSelected) {
                  (statePath as SVGElement).style.stroke = '#facc15';
                  (statePath as SVGElement).style.strokeWidth = '3';
                } else {
                  (statePath as SVGElement).style.stroke = '#ffffff';
                  (statePath as SVGElement).style.strokeWidth = '1';
                }

                // Add hover effect and tooltip (always enabled)
                (statePath as SVGElement).style.transition = 'opacity 0.2s';

                statePath.addEventListener('mouseenter', (e: Event) => {
                  (statePath as SVGElement).style.opacity = '0.8';
                  const mouseEvent = e as MouseEvent;
                  setTooltip({
                    name: state.name,
                    abbreviation: state.abbreviation,
                    electoralVotes: state.electoral_votes,
                    lean,
                    x: mouseEvent.clientX,
                    y: mouseEvent.clientY
                  });
                });

                statePath.addEventListener('mousemove', (e: Event) => {
                  const mouseEvent = e as MouseEvent;
                  setTooltip(prev => prev ? {
                    ...prev,
                    x: mouseEvent.clientX,
                    y: mouseEvent.clientY
                  } : null);
                });

                statePath.addEventListener('mouseleave', () => {
                  (statePath as SVGElement).style.opacity = '1';
                  setTooltip(null);
                });

                // Add click handler if clicking is enabled
                if (onStateClick) {
                  (statePath as SVGElement).style.cursor = 'pointer';

                  statePath.addEventListener('click', () => {
                    onStateClick(state.abbreviation);
                  });
                }

                // Update title for tooltip
                const titleElement = statePath.querySelector('title');
                if (titleElement) {
                  titleElement.textContent = `${state.name} - ${state.electoral_votes} EV - Lean: ${lean > 0 ? '+' : ''}${lean}`;
                }

                // Add state abbreviation text label
                const bbox = (statePath as SVGPathElement).getBBox();
                const centerX = bbox.x + bbox.width / 2;
                const centerY = bbox.y + bbox.height / 2;

                // Create text element for state abbreviation
                const textElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                textElement.setAttribute('x', centerX.toString());
                textElement.setAttribute('y', centerY.toString());
                textElement.setAttribute('text-anchor', 'middle');
                textElement.setAttribute('dominant-baseline', 'middle');
                textElement.setAttribute('class', 'state-label');
                textElement.setAttribute('pointer-events', 'none');
                textElement.style.fill = '#ffffff';
                textElement.style.fontSize = '10px';
                textElement.style.fontWeight = 'bold';
                textElement.style.textShadow = '0 0 3px rgba(0,0,0,0.8)';
                textElement.textContent = state.abbreviation.toUpperCase();

                svgElement.appendChild(textElement);
              }
            });
          }
        }
      } catch (error) {
        console.error('Error loading SVG map:', error);
      }
    };

    loadSVG();
  }, [statesData, selectedStates, getStateColor, onStateClick]);

  return (
    <div className="w-full relative">
      <div ref={svgContainerRef} className="w-full overflow-visible" style={{ minHeight: '500px' }} />

      {/* Hover tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg pointer-events-none"
          style={{
            left: `${tooltip.x + 15}px`,
            top: `${tooltip.y + 15}px`,
          }}
        >
          <div className="font-bold">{tooltip.name} ({tooltip.abbreviation})</div>
          <div className="text-sm">Electoral Votes: {tooltip.electoralVotes}</div>
          <div className="text-sm">Lean: {tooltip.lean > 0 ? '+' : ''}{tooltip.lean}</div>
        </div>
      )}
    </div>
  );
}

export default USAMap;
