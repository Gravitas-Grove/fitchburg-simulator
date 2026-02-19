import { useMemo, useCallback, useEffect, useRef } from 'react';
import { GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useParcelStore } from '@/stores/parcelStore';
import { useScenarioStore } from '@/stores/scenarioStore';
import { useMapStore } from '@/stores/mapStore';
import type { ScenarioParcel } from '@/lib/api';
import type { Feature, FeatureCollection } from 'geojson';

function parcelToFeature(p: ScenarioParcel): Feature {
  return {
    type: 'Feature',
    properties: {
      parcelNo: p.parcelNo,
      address: p.address,
      owner: p.owner,
      schoolDistrict: p.schoolDistrict,
      areaAcres: p.areaAcres,
      landValue: p.landValue,
      developYear: p.developYear,
      priorityScore: p.priorityScore,
      scenarioReason: p.scenarioReason,
      centroid: p.centroid,
    },
    geometry: {
      type: 'Polygon',
      coordinates: p.coordinates,
    },
  };
}

export function ParcelLayer() {
  const parcels = useParcelStore((s) => s.parcels);
  const selectedParcelNo = useParcelStore((s) => s.selectedParcelNo);
  const hoveredParcelNo = useParcelStore((s) => s.hoveredParcelNo);
  const setSelectedParcel = useParcelStore((s) => s.setSelectedParcel);
  const setHoveredParcel = useParcelStore((s) => s.setHoveredParcel);
  const activeScenario = useScenarioStore((s) => s.activeScenario);
  const currentYear = useMapStore((s) => s.currentYear);
  const map = useMap();

  const color = activeScenario?.color || '#4ecdc4';

  // Build GeoJSON feature collection from parcels
  const geojsonData = useMemo<FeatureCollection>(() => {
    return {
      type: 'FeatureCollection',
      features: parcels.map(parcelToFeature),
    };
  }, [parcels]);

  // Style function based on development year and selection state
  const styleFunction = useCallback(
    (feature: Feature | undefined) => {
      if (!feature?.properties) return {};
      const { developYear, parcelNo } = feature.properties;
      const isDeveloped = developYear <= currentYear;
      const isSelected = parcelNo === selectedParcelNo;
      const isHovered = parcelNo === hoveredParcelNo;

      if (isSelected) {
        return {
          color: '#ffffff',
          weight: 3,
          fillColor: color,
          fillOpacity: 0.7,
          opacity: 1,
        };
      }

      if (isHovered) {
        return {
          color: '#ffffff',
          weight: 2,
          fillColor: color,
          fillOpacity: 0.6,
          opacity: 0.8,
        };
      }

      if (isDeveloped) {
        return {
          color: color,
          weight: 1,
          fillColor: color,
          fillOpacity: 0.5,
          opacity: 0.8,
        };
      }

      // Future parcel
      return {
        color: color,
        weight: 0.5,
        fillColor: color,
        fillOpacity: 0.08,
        opacity: 0.3,
        dashArray: '3,3',
      };
    },
    [currentYear, selectedParcelNo, hoveredParcelNo, color]
  );

  // Attach event handlers per feature
  const onEachFeature = useCallback(
    (feature: Feature, layer: L.Layer) => {
      const props = feature.properties;
      if (!props) return;

      // Tooltip on hover
      const tooltipContent = `
        <div style="font-family: 'IBM Plex Mono', monospace; font-size: 11px; line-height: 1.5;">
          <div style="font-weight: 600; color: #e8edf3;">${props.address || 'Unknown'}</div>
          <div style="color: #8a9ab0;">${props.owner || ''}</div>
          <div style="color: #5a6a7d; margin-top: 2px;">
            ${props.areaAcres?.toFixed(1) || '?'} ac · Dev. year: ${props.developYear} · Score: ${props.priorityScore?.toFixed(0) || '?'}
          </div>
        </div>
      `;
      (layer as L.Path).bindTooltip(tooltipContent, {
        sticky: true,
        direction: 'top',
        className: 'parcel-tooltip',
      });

      (layer as L.Path).on({
        mouseover: () => setHoveredParcel(props.parcelNo),
        mouseout: () => setHoveredParcel(null),
        click: () => setSelectedParcel(props.parcelNo),
      });
    },
    [setHoveredParcel, setSelectedParcel]
  );

  const geoJsonRef = useRef<L.GeoJSON | null>(null);

  // Update styles reactively without destroying/recreating the layer
  useEffect(() => {
    if (!geoJsonRef.current) return;
    geoJsonRef.current.eachLayer((layer) => {
      const feature = (layer as any).feature;
      if (feature) {
        (layer as L.Path).setStyle(styleFunction(feature));
      }
    });
  }, [currentYear, selectedParcelNo, hoveredParcelNo, styleFunction]);

  // Fly to parcels when loaded
  useEffect(() => {
    if (parcels.length > 0 && map) {
      const bounds = L.latLngBounds(
        parcels.slice(0, 100).map((p) => L.latLng(p.centroid[1], p.centroid[0]))
      );
      if (bounds.isValid()) {
        map.flyToBounds(bounds, { padding: [50, 50], maxZoom: 14, duration: 0.8 });
      }
    }
  }, [parcels, map]);

  if (parcels.length === 0) return null;

  return (
    <GeoJSON
      ref={geoJsonRef}
      key={activeScenario?.id}
      data={geojsonData}
      style={styleFunction}
      onEachFeature={onEachFeature}
    />
  );
}
