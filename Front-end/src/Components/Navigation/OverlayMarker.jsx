import { useEffect, useRef } from 'react';

/**
 * OverlayMarker — renders custom HTML on the map using OverlayView.
 * Works WITHOUT mapId (unlike AdvancedMarkerElement).
 */
export default function OverlayMarker({ map, position, content, zIndex = 1, title = '' }) {
  const overlayRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!map || !window.google?.maps || !position) return;

    class HTMLOverlay extends window.google.maps.OverlayView {
      constructor(pos, htmlContent, z) {
        super();
        this.pos = pos;
        this.htmlContent = htmlContent;
        this.zIdx = z;
        this.div = null;
      }

      onAdd() {
        this.div = document.createElement('div');
        this.div.style.position = 'absolute';
        this.div.style.zIndex = String(this.zIdx);
        this.div.style.cursor = 'default';
        if (title) this.div.title = title;

        if (typeof this.htmlContent === 'string') {
          this.div.innerHTML = this.htmlContent;
        } else if (this.htmlContent instanceof HTMLElement) {
          this.div.appendChild(this.htmlContent);
        }

        const panes = this.getPanes();
        if (panes) panes.overlayMouseTarget.appendChild(this.div);
        containerRef.current = this.div;
      }

      draw() {
        if (!this.div || !this.pos) return;
        const projection = this.getProjection();
        if (!projection) return;
        const point = projection.fromLatLngToDivPixel(
          new window.google.maps.LatLng(this.pos.lat, this.pos.lng)
        );
        if (point) {
          this.div.style.left = `${point.x}px`;
          this.div.style.top = `${point.y}px`;
        }
      }

      onRemove() {
        if (this.div?.parentNode) {
          this.div.parentNode.removeChild(this.div);
          this.div = null;
        }
      }

      updatePosition(newPos) {
        this.pos = newPos;
        this.draw();
      }

      updateContent(htmlContent) {
        if (!this.div) return;
        this.htmlContent = htmlContent;
        if (typeof htmlContent === 'string') {
          this.div.innerHTML = htmlContent;
        } else if (htmlContent instanceof HTMLElement) {
          this.div.innerHTML = '';
          this.div.appendChild(htmlContent);
        }
      }
    }

    const overlay = new HTMLOverlay(position, content, zIndex);
    overlay.setMap(map);
    overlayRef.current = overlay;

    return () => {
      overlay.setMap(null);
      overlayRef.current = null;
    };
    // Only re-create on map change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  // Update position
  useEffect(() => {
    if (overlayRef.current && position) {
      overlayRef.current.updatePosition(position);
    }
  }, [position?.lat, position?.lng]);

  // Update content
  useEffect(() => {
    if (overlayRef.current && content) {
      overlayRef.current.updateContent(content);
    }
  }, [content]);

  return null;
}
