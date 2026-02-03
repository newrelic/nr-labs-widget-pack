import React, { useMemo, useEffect, useRef, useCallback } from 'react';
import {
  Map,
  Marker,
  Popup,
  TileLayer,
  CircleMarker,
  GeoJSON
} from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import 'react-leaflet-markercluster/dist/styles.min.css';
import 'leaflet-color-markers';
import 'leaflet/dist/leaflet.css';
import { Icon } from 'leaflet';

import { Button } from 'nr1';
import { excludedKeys, excludedStrings, parseLatLngBounds } from '../utils';
import { useCustomColors, Status } from './hooks/useCustomColors';
import { useHeatmap } from './hooks/useHeatmap';
import { useOpenDashboard } from './hooks/useOpenDashboard';
import { findRegionFeature, useGeoDataLoader } from './hooks/useRegionFeature';
import { generateTooltipConfig, getTooltipHeader } from './tooltipUtils';
import {
  createClusterCustomIcon,
  createCustomIcon,
  formatMarkerValue
} from './utils';
import {
  DEFAULT_DISABLE_CLUSTER_ZOOM,
  HIGH_DENSITY_THRESHOLD,
  DEFAULT_HD_RADIUS
} from './constants';

// Wrapper that holds location data for cluster access
// eslint-disable-next-line no-unused-vars
const MarkerPopup = ({ location, children }) => {
  return children;
};

// Map common color names to hex values
const commonColorToHex = {
  blue: '#2A81CB',
  gold: '#FFD326',
  red: '#CB2B3E',
  green: '#2AAD27',
  orange: '#CB8427',
  yellow: '#CAC428',
  purple: '#9C2BCB',
  grey: '#7B7B7B',
  black: '#3D3D3D'
};

function LeafletRoot(props) {
  const {
    initialLat,
    initialLong,
    initialZoom,
    defaultMarkerColor,
    defaultMarkerImgURL,
    defaultImgWidth,
    defaultImgHeight,
    markerStyle,
    mapLocations,
    maxBoundsSouthWest,
    maxBoundsNorthEast,
    setWorkloadStatus,
    markerAggregation,
    markerColors,
    enableClustering = false,
    disableClusterZoom,
    heatmapSteps,
    highDensityMode,
    highDensityRadius,
    regionColors,
    regionHeatmapSteps,
    regionData,
    enableAutoTooltip = false,
    hideMarkers = false
  } = props;

  const { openDashboard, hasDashboardLink } = useOpenDashboard();
  const { customColors } = useCustomColors(markerColors);
  const customColorsRef = useRef(customColors);

  // Lazily load GeoJSON data only when region heatmaps are enabled
  const geoDataLoaded = useGeoDataLoader(regionHeatmapSteps);

  const {
    heatmapSteps: effectiveHeatmapSteps,
    setMarkerRange,
    getMarkerGradientColor,
    regionHeatmapSteps: effectiveRegionHeatmapSteps,
    setRegionRange,
    getRegionGradientColor,
    regionGradient
  } = useHeatmap(heatmapSteps, regionHeatmapSteps, markerColors, regionColors);

  // Update colors ref when colors change
  useEffect(() => {
    customColorsRef.current = customColors;
  }, [customColors]);

  // Process locations and format values
  // Status is derived from markerThresholds evaluation (if set) for cluster aggregation
  const processedLocations = useMemo(() => {
    if (!mapLocations || mapLocations.length === 0) return [];

    return mapLocations.map(mapData => {
      const { data, marker } = mapData;
      const formattedValue = formatMarkerValue(data);

      // Use status from markerThresholds if set, otherwise default to NONE
      const derivedStatus =
        marker?.status && Status[marker.status]
          ? Status[marker.status]
          : Status.NONE;

      return {
        ...mapData,
        status: derivedStatus,
        formattedValue,
        value: data.value
      };
    });
  }, [mapLocations]);

  // Set marker range for heatmap calculations
  useEffect(() => {
    if (effectiveHeatmapSteps > 0 && processedLocations.length > 0) {
      setMarkerRange(processedLocations);
    }
  }, [processedLocations, effectiveHeatmapSteps, setMarkerRange]);

  // Set region range for heatmap calculations
  useEffect(() => {
    if (
      effectiveRegionHeatmapSteps > 0 &&
      regionData &&
      regionData.length > 0
    ) {
      setRegionRange(regionData);
    }
  }, [regionData, effectiveRegionHeatmapSteps, setRegionRange]);

  // Determines if high density mode should be used
  const useHighDensity = useMemo(() => {
    return (
      highDensityMode ||
      processedLocations.length >= HIGH_DENSITY_THRESHOLD ||
      effectiveHeatmapSteps > 0
    );
  }, [highDensityMode, processedLocations.length, effectiveHeatmapSteps]);

  // Determine effective cluster zoom level
  const effectiveDisableClusterZoom = useMemo(() => {
    // If heatmap is enabled, disable clustering at zoom 1 to show individual markers
    if (effectiveHeatmapSteps > 0) return 1;
    return disableClusterZoom || DEFAULT_DISABLE_CLUSTER_ZOOM;
  }, [disableClusterZoom, effectiveHeatmapSteps]);

  // Determine if clustering should be used
  const shouldCluster = useMemo(() => {
    if (!enableClustering) return false;
    return enableClustering !== false && !useHighDensity;
  }, [enableClustering, useHighDensity]);

  const position = [
    !initialLat || isNaN(initialLat)
      ? 37.791536840426495
      : parseFloat(initialLat),

    !initialLong || isNaN(initialLong)
      ? -122.3929926594833
      : parseFloat(initialLong)
  ];

  const maxBounds =
    !maxBoundsNorthEast && !maxBoundsSouthWest
      ? undefined
      : parseLatLngBounds(maxBoundsSouthWest, maxBoundsNorthEast);

  const polygonOptions = useMemo(
    () => ({
      fillColor: customColors[Status.CLUSTER].borderColor,
      color: customColors[Status.CLUSTER].color,
      weight: 3,
      opacity: 0.9,
      fillOpacity: 0.4
    }),
    [customColors]
  );

  // Render a single marker popup
  const renderPopupContent = useCallback(
    (popupData, workloadStatusSetter) => {
      // Tooltip configuration
      const tooltipConfig = enableAutoTooltip
        ? generateTooltipConfig(popupData)
        : [];
      const tooltipHeader = enableAutoTooltip
        ? getTooltipHeader(popupData)
        : null;
      const displayHeader =
        tooltipHeader !== null ? tooltipHeader : popupData.locName;

      return (
        <div>
          {displayHeader && (
            <>
              <span style={{ fontWeight: 'bold' }}>{displayHeader}</span>
              <br />
            </>
          )}
          {tooltipConfig.length > 0
            ? tooltipConfig.map(({ label, queryField }) => (
                <React.Fragment key={queryField}>
                  {label}: {popupData[queryField]}
                  <br />
                </React.Fragment>
              ))
            : // tooltip field rendering
              Object.keys(popupData).map(key => {
                const containsExcludedString = excludedStrings.some(str =>
                  key.includes(str)
                );
                if (!excludedKeys.includes(key) && !containsExcludedString) {
                  return (
                    <React.Fragment key={key}>
                      {key}: {popupData[key]}
                      <br />
                    </React.Fragment>
                  );
                }
                return null;
              })}
          {(popupData['entity.guid'] || popupData.entityGuid) && (
            <div className="drilldown-btn">
              <Button
                type={Button.TYPE.PRIMARY}
                onClick={() => {
                  window.open(
                    `https://one.newrelic.com/redirect/entity/${popupData[
                      'entity.guid'
                    ] || popupData.entityGuid}`
                  );
                }}
              >
                Open Entity
              </Button>
            </div>
          )}
          {hasDashboardLink(popupData) && (
            <div className="drilldown-btn">
              <Button
                type={Button.TYPE.PRIMARY}
                onClick={() => openDashboard(popupData)}
              >
                Open Dashboard
              </Button>
            </div>
          )}

          {popupData.isWorkload && (
            <div className="drilldown-btn">
              <Button
                type={Button.TYPE.PRIMARY}
                onClick={() => workloadStatusSetter(popupData)}
              >
                View Workload
              </Button>
            </div>
          )}
          {popupData.link && (
            <div className="drilldown-btn">
              <Button
                type={Button.TYPE.PRIMARY}
                onClick={() => window.open(popupData.link, '_blank')}
              >
                Open Link
              </Button>
            </div>
          )}
        </div>
      );
    },
    [enableAutoTooltip, hasDashboardLink, openDashboard]
  );

  const renderMarkers = useCallback(() => {
    return processedLocations.map((processedData, mapIndex) => {
      const {
        data,
        marker,
        targetName,
        targetRotate,
        status,
        formattedValue,
        value
      } = processedData;

      const locName = data[`name:${targetName}`];
      const rotate = data[`rotate:${targetRotate}`];
      const coordinates = data['mapWidget.coordinates'];

      if (!coordinates || isNaN(coordinates.lat) || isNaN(coordinates.lng)) {
        // eslint-disable-next-line no-console
        console.warn('Invalid coordinates for marker:', mapIndex, data);
        return null;
      }

      const { lat, lng } = coordinates;
      const popupData = { ...data, locName, lng, lat };

      // Determine color based on heatmap or status
      let markerColor;
      if (effectiveHeatmapSteps > 0 && value !== undefined) {
        markerColor = getMarkerGradientColor(value);
      } else {
        markerColor =
          customColors[status]?.color || customColors[Status.NONE].color;
      }

      // High density mode - CircleMarkers
      if (useHighDensity) {
        const radius =
          data.icon_radius || highDensityRadius || DEFAULT_HD_RADIUS;

        return (
          <CircleMarker
            key={`hd-${mapIndex}`}
            center={[lat, lng]}
            radius={radius}
            color={markerColor}
            fillColor={markerColor}
            stroke={radius >= 8}
            fillOpacity={radius < 8 ? 1 : 0.7}
          >
            <Popup position={[lat, lng]}>
              {renderPopupContent(popupData, setWorkloadStatus)}
            </Popup>
          </CircleMarker>
        );
      }

      // Standard marker with custom icon
      const location = {
        status,
        value,
        formatted_value: formattedValue,
        icon_label: data.icon_label,
        icon_url: marker?.imgUrl || defaultMarkerImgURL || data.icon_url,
        icon_svg: data.icon_svg,
        icon_size: data.icon_size,
        cluster_label_prefix: data.icon_label_prefix,
        cluster_label_suffix: data.icon_label_suffix,
        cluster_label_precision: data.icon_label_precision
      };

      // Determine which icon style to use
      const hasCustomImage = marker?.imgUrl || defaultMarkerImgURL;
      const useCircleStyle = !hasCustomImage && markerStyle === 'circle';

      let icon;
      if (useCircleStyle) {
        let circleColor = null;

        if (effectiveHeatmapSteps > 0) {
          // Heatmap mode - use gradient color
          circleColor = getMarkerGradientColor(value);
        } else if (marker?.markerColor) {
          // Explicit markerColor from threshold config
          circleColor =
            commonColorToHex[marker.markerColor] || marker.markerColor;
        } else if (status && status !== Status.NONE) {
          // Status-based coloring takes precedence over defaultMarkerColor
          circleColor = null;
        } else if (defaultMarkerColor) {
          // Fallback to defaultMarkerColor only when no status is set
          circleColor =
            commonColorToHex[defaultMarkerColor] || defaultMarkerColor;
        }

        icon = createCustomIcon(location, customColors, circleColor);
      } else if (hasCustomImage) {
        // Custom image icon
        const iconUrl = marker?.imgUrl || defaultMarkerImgURL;

        icon = new Icon({
          iconColor: marker?.markerColor || defaultMarkerColor,
          iconUrl,
          iconSize: [
            marker?.imgWidth || defaultImgWidth || 25,
            marker?.imgHeight || defaultImgHeight || 41
          ]
        });
      } else {
        // Current pin marker style
        let colorName;
        if (marker?.markerColor) {
          colorName = marker.markerColor;
        } else if (status && status !== Status.NONE) {
          // Map status to pin color names
          const statusColorMap = {
            [Status.OK]: 'green',
            [Status.WARNING]: 'orange',
            [Status.CRITICAL]: 'red'
          };
          colorName = statusColorMap[status] || 'blue';
        } else {
          colorName = defaultMarkerColor || 'blue';
        }
        const validColors = Object.keys(commonColorToHex);
        const pinColor = validColors.includes(colorName) ? colorName : 'blue';
        const iconUrl = `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${pinColor}.png`;

        icon = new Icon({
          iconColor: colorName,
          iconUrl,
          iconSize: [25, 41]
        });
      }

      return (
        <Marker
          icon={icon}
          key={mapIndex}
          style={{
            transform: rotate ? `rotate(${rotate}deg)` : undefined
          }}
          position={[lat, lng]}
        >
          <MarkerPopup location={location}>
            <Popup position={[lat, lng]}>
              {renderPopupContent(popupData, setWorkloadStatus)}
            </Popup>
          </MarkerPopup>
        </Marker>
      );
    });
  }, [
    processedLocations,
    useHighDensity,
    effectiveHeatmapSteps,
    getMarkerGradientColor,
    customColors,
    highDensityRadius,
    defaultMarkerImgURL,
    defaultMarkerColor,
    defaultImgWidth,
    defaultImgHeight,
    markerStyle,
    renderPopupContent,
    setWorkloadStatus
  ]);

  // Process region data to include GeoJSON features only when geoDataLoaded is true
  const processedRegionData = useMemo(() => {
    if (!regionData || regionData.length === 0 || !geoDataLoaded) return [];

    return regionData
      .map(region => {
        if (region.geometry) {
          return region;
        }

        // Try to find GeoJSON feature from lookup tables
        const regionFeature = findRegionFeature(region);

        if (regionFeature) {
          return {
            ...region,
            geometry: regionFeature,
            name:
              region.name ||
              regionFeature.name ||
              regionFeature.properties?.NAME
          };
        }

        return region;
      })
      .filter(region => region.geometry);
  }, [regionData, geoDataLoaded]);

  // Region heatmaps
  const renderRegions = useCallback(() => {
    if (
      !processedRegionData ||
      processedRegionData.length === 0 ||
      effectiveRegionHeatmapSteps <= 0
    ) {
      return null;
    }

    return processedRegionData.map((region, index) => {
      if (!region.geometry) return null;

      const gradientColor = getRegionGradientColor(region.value);
      const customColor = region.custom_color;

      const style = {
        color: customColor || gradientColor,
        fillColor: customColor || gradientColor,
        weight: 2,
        opacity: 0.7,
        fillOpacity: 0.5
      };

      // Tooltip config
      const tooltipConfig = enableAutoTooltip
        ? generateTooltipConfig(region)
        : [];
      const regionHeader = enableAutoTooltip ? getTooltipHeader(region) : null;

      // Include gradient info in key to force re-render when colors change
      // react-leaflet v2 GeoJSON doesn't update styles dynamically
      const gradientKey =
        regionGradient.length > 0
          ? `${regionGradient[0]}-${regionGradient[regionGradient.length - 1]}`
          : 'no-gradient';
      const regionKey = `${region.geoISOCountry ||
        region.geoUSState ||
        region.geoUKRegion ||
        region.name ||
        `region-${index}`}-${gradientKey}`;

      return (
        <GeoJSON key={regionKey} data={region.geometry} style={style}>
          <Popup>
            <div>
              <strong>
                {regionHeader || region.name || `Region ${index + 1}`}
              </strong>
              <br />
              {tooltipConfig.length > 0 ? (
                tooltipConfig.map(({ label, queryField }) => (
                  <React.Fragment key={queryField}>
                    {label}: {region[queryField]}
                    <br />
                  </React.Fragment>
                ))
              ) : (
                <>Value: {region.value}</>
              )}
              {hasDashboardLink(region) && (
                <div style={{ marginTop: '8px' }}>
                  <Button
                    type={Button.TYPE.NORMAL}
                    sizeType={Button.SIZE_TYPE.SMALL}
                    onClick={() => openDashboard(region)}
                  >
                    Open Dashboard
                  </Button>
                </div>
              )}
            </div>
          </Popup>
        </GeoJSON>
      );
    });
  }, [
    processedRegionData,
    effectiveRegionHeatmapSteps,
    getRegionGradientColor,
    regionGradient,
    enableAutoTooltip,
    hasDashboardLink,
    openDashboard
  ]);

  return (
    <>
      <Map
        style={{ height: '100vh', width: '100vw' }}
        center={position}
        zoom={!initialZoom || isNaN(initialZoom) ? 4 : parseFloat(initialZoom)}
        maxBounds={maxBounds}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {renderRegions()}
        {!hideMarkers &&
          (shouldCluster ? (
            <MarkerClusterGroup
              key={`cluster-${markerAggregation}`}
              singleMarkerMode
              spiderfyOnMaxZoom={7}
              disableClusteringAtZoom={effectiveDisableClusterZoom}
              iconCreateFunction={cluster =>
                createClusterCustomIcon(
                  cluster,
                  customColorsRef.current,
                  markerAggregation
                )
              }
              polygonOptions={polygonOptions}
            >
              {renderMarkers()}
            </MarkerClusterGroup>
          ) : (
            renderMarkers()
          ))}
      </Map>
    </>
  );
}

export default LeafletRoot;
