import { useMemo, useState, useEffect } from 'react';

// Lazy-loaded geo data/lookups - only loads when regionHeadmapSteps prop > 0
let geoDataLoaded = false;
let geoDataLoading = false;
let geoDataPromise = null;

// Lookup maps
let countryByISO = new Map();
let usStateByIdentifier = new Map();
let ukRegionByName = new Map();
let canProvinceByIdentifier = new Map();

// Build from static GeoJSON data
const buildLookupMaps = (countries, usStates, ukRegions, canProvinces) => {
  // Country lookup
  countryByISO = new Map();
  countries.features.forEach(f => {
    if (f.properties?.ISO_A3) {
      countryByISO.set(f.properties.ISO_A3, f);
    }
    if (f.properties?.ISO_A2) {
      countryByISO.set(f.properties.ISO_A2, f);
    }
  });

  // US State lookup
  usStateByIdentifier = new Map();
  usStates.features.forEach(f => {
    if (f.properties?.STATECODE) {
      usStateByIdentifier.set(f.properties.STATECODE, f);
    }
    if (f.properties?.STATE) {
      usStateByIdentifier.set(f.properties.STATE, f);
    }
    if (f.properties?.NAME) {
      usStateByIdentifier.set(f.properties.NAME, f);
    }
  });

  // UK Region lookup
  ukRegionByName = new Map();
  ukRegions.forEach(r => {
    if (r.name) {
      ukRegionByName.set(r.name, r);
    }
  });

  // Canada Province lookup
  canProvinceByIdentifier = new Map();
  canProvinces.features.forEach(f => {
    if (f.properties?.id) {
      canProvinceByIdentifier.set(f.properties.id, f);
    }

    if (f.properties?.code) {
      canProvinceByIdentifier.set(f.properties.code, f);
    }

    if (f.properties?.name) {
      canProvinceByIdentifier.set(f.properties.name, f);
    }
  });
  geoDataLoaded = true;
};

// Lazy load GeoJSON data using dynamic imports
const loadGeoData = async () => {
  if (geoDataLoaded) return true;
  if (geoDataLoading) return geoDataPromise;

  geoDataLoading = true;
  geoDataPromise = (async () => {
    try {
      const [
        countriesModule,
        usStatesModule,
        ukRegionsModule,
        canProvincesModule
      ] = await Promise.all([
        import('../geo/countries.geojson.json'),
        import('../geo/us-states'),
        import('../geo/uk-regions/all-uk-regions'),
        import('../geo/can-provinces/ca.geojson.json')
      ]);

      buildLookupMaps(
        countriesModule.default,
        usStatesModule.default,
        ukRegionsModule.default,
        canProvincesModule.default
      );

      return true;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to load GeoJSON data:', error);
      geoDataLoading = false;
      return false;
    }
  })();

  return geoDataPromise;
};

// Lazy loading hook
export function useGeoDataLoader(regionHeatmapSteps) {
  const [loaded, setLoaded] = useState(geoDataLoaded);

  useEffect(() => {
    if (regionHeatmapSteps > 0 && !geoDataLoaded) {
      loadGeoData().then(success => {
        if (success) setLoaded(true);
      });
    }
  }, [regionHeatmapSteps]);

  return loaded;
}

/**
 * Hook to find a GeoJSON feature based on region identifiers
 *
 * Supports:
 * - geoISOCountry: ISO 3166-1 alpha-2 or alpha-3 country codes (e.g., "USA" or "US")
 * - geoUSState: US state 2 letter code, number or name (e.g., "CA", "06", "California")
 * - geoUKRegion: UK region name (e.g., "London", "Scotland")
 * - geoCANProvince: Canada province code, number or name (e.g., "ON", "08", "Ontario")
 */
export function useRegionFeature(location) {
  return useMemo(() => {
    if (!location || !geoDataLoaded) return null;

    // Country lookup by ISO A3 or ISO A2 code (O(1) using Map)
    if (location.geoISOCountry) {
      const feature = countryByISO.get(location.geoISOCountry);
      if (feature) {
        return { ...feature, name: feature.properties?.ADMIN || '' };
      }
    }
    // US State lookup by state code, number, or name (O(1) using Map)
    else if (location.geoUSState) {
      const feature = usStateByIdentifier.get(location.geoUSState);
      if (feature) {
        return { ...feature, name: feature.properties?.NAME || '' };
      }
    }
    // UK Region lookup by name (O(1) using Map)
    else if (location.geoUKRegion) {
      const feature = ukRegionByName.get(location.geoUKRegion);
      if (feature) {
        return feature;
      }
    }
    // Canada Province lookup by code, number, or name (O(1) using Map)
    else if (location.geoCANProvince) {
      const feature = canProvinceByIdentifier.get(location.geoCANProvince);
      if (feature) {
        return feature;
      }
    }

    return null;
  }, [
    location?.geoISOCountry,
    location?.geoUSState,
    location?.geoUKRegion,
    location?.geoCANProvince
  ]);
}

// Find a region feature by identifier (non-hook version for batch processing)
export function findRegionFeature(location) {
  if (!location || !geoDataLoaded) return null;

  // Country lookup by ISO A3 or ISO A2 code (O(1) using Map)
  if (location.geoISOCountry) {
    const feature = countryByISO.get(location.geoISOCountry);
    if (feature) {
      return { ...feature, name: feature.properties?.ADMIN || '' };
    }
  }

  // US State lookup by state code, number, or name (O(1) using Map)
  if (location.geoUSState) {
    const feature = usStateByIdentifier.get(location.geoUSState);
    if (feature) {
      return { ...feature, name: feature.properties?.NAME || '' };
    }
  }

  // UK Region lookup by name (O(1) using Map)
  if (location.geoUKRegion) {
    const feature = ukRegionByName.get(location.geoUKRegion);
    if (feature) {
      return feature;
    }
  }

  // Canada Province lookup by code, number, or name (O(1) using Map)
  if (location.geoCANProvince) {
    const feature = canProvinceByIdentifier.get(location.geoCANProvince);
    if (feature) {
      return feature;
    }
  }

  return null;
}

// Check if geo data is loaded
export function isGeoDataLoaded() {
  return geoDataLoaded;
}

export default useRegionFeature;
