import React, { useEffect, useRef } from 'react';

export default function AdvancedMarker({ map, position, title, content, zIndex }) {
  const markerRef = useRef(null);

  useEffect(() => {
    if (!map || !window.google) return;
    let markerInstance = null;
    const initMarker = async () => {
      try {
        const { AdvancedMarkerElement } = await window.google.maps.importLibrary("marker");
        let initialContent = null;
        if (content) {
          if (typeof content === 'string') {
            const div = document.createElement('div');
            div.innerHTML = content;
            initialContent = div.firstElementChild;
          } else if (content instanceof HTMLElement) {
            initialContent = content;
          }
        }
        markerInstance = new AdvancedMarkerElement({
          map,
          position: position || { lat: 0, lng: 0 },
          title: title || '',
          content: initialContent,
          zIndex: zIndex || 1,
        });
        markerRef.current = markerInstance;
      } catch (err) {
        console.error("AdvancedMarker error:", err);
      }
    };
    initMarker();
    return () => {
      if (markerInstance) {
        markerInstance.map = null;
        markerRef.current = null;
      }
    };
  }, [map, zIndex]);

  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.title = title || '';
    }
  }, [title]);

  useEffect(() => {
    if (markerRef.current && position) {
      markerRef.current.position = position;
    }
  }, [position]);

  useEffect(() => {
    if (!markerRef.current) return;
    let markerContent = null;
    if (content instanceof HTMLElement) {
      if (markerRef.current.content !== content) {
        markerRef.current.content = content;
      }
      return;
    }
    if (typeof content === 'string') {
      const div = document.createElement('div');
      div.innerHTML = content;
      markerContent = div.firstElementChild;
    }
    markerRef.current.content = markerContent;
  }, [content]);

  return null;
}
