import * as turf from '@turf/turf';

const PROXIMITY_METERS = 50;

function classifyFeature(props) {
  const type = (props?.TYPE_CODE || props?.type_code || props?.CLASS || props?.class || '').toUpperCase();
  const name = (props?.NAME || props?.name || '').toUpperCase();

  if (type === 'TFR' || name.includes('TFR')) return 'tfr';
  if (type === 'P' || type === 'PROHIBITED' || name.includes('PROHIBITED')) return 'prohibited';
  if (type === 'R' || type === 'RESTRICTED') return 'restricted';
  if (name.includes('NATIONAL PARK') || type === 'NATIONAL PARK') return 'nationalpark';
  if (type === 'B' || type === 'CLASS B' || name.includes('CLASS B')) return 'classb';
  if (type === 'C' || type === 'CLASS C' || name.includes('CLASS C')) return 'classc';
  if (type === 'D' || type === 'CLASS D' || name.includes('CLASS D')) return 'classd';
  if (type === 'E' || type === 'CLASS E' || name.includes('CLASS E')) return 'classe';
  return 'classg';
}

const PRIORITY = ['tfr', 'prohibited', 'restricted', 'nationalpark', 'classb', 'classc', 'classd', 'classe', 'classg'];

const STATUS_MAP = {
  tfr:         { status: 'DO NOT FLY',             label: 'Active TFR' },
  prohibited:  { status: 'DO NOT FLY',             label: 'Prohibited Airspace' },
  restricted:  { status: 'DO NOT FLY',             label: 'Restricted Airspace' },
  nationalpark:{ status: 'DO NOT FLY',             label: 'National Park' },
  classb:      { status: 'AUTHORIZATION REQUIRED', label: 'Class B Airspace' },
  classc:      { status: 'AUTHORIZATION REQUIRED', label: 'Class C Airspace' },
  classd:      { status: 'AUTHORIZATION REQUIRED', label: 'Class D Airspace' },
  classe:      { status: 'AUTHORIZATION REQUIRED', label: 'Class E Airspace' },
  classg:      { status: 'CLEAR',                  label: 'Class G Airspace' },
};

export function checkAirspace(lat, lng, features = []) {
  const point = turf.point([lng, lat]);

  let hitClass = null;
  let hitName = 'Unknown Zone';
  let proximityWarning = null;

  for (const feature of features) {
    if (!feature.geometry) continue;
    let inside = false;
    try {
      inside = turf.booleanPointInPolygon(point, feature);
    } catch {
      continue;
    }

    if (inside) {
      const cls = classifyFeature(feature.properties);
      const idx = PRIORITY.indexOf(cls);
      const currentIdx = hitClass ? PRIORITY.indexOf(hitClass) : Infinity;
      if (idx < currentIdx) {
        hitClass = cls;
        hitName = feature.properties?.NAME || feature.properties?.name || STATUS_MAP[cls]?.label || cls;
      }
    } else {
      // proximity check
      try {
        const boundary = turf.polygonToLine(feature);
        const dist = turf.nearestPointOnLine(boundary, point);
        if (dist.properties.dist !== undefined) {
          const distM = dist.properties.dist * 1000;
          if (distM <= PROXIMITY_METERS) {
            proximityWarning = `Within ${Math.round(distM)}m of airspace boundary`;
          }
        }
      } catch {
        // skip proximity for non-polygon geometry
      }
    }
  }

  if (!hitClass) {
    return { status: 'CLEAR', zone: 'Class G Airspace', warning: proximityWarning };
  }

  const { status, label } = STATUS_MAP[hitClass];
  return { status, zone: hitName || label, warning: proximityWarning };
}
