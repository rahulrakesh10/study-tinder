/**
 * Calculates the great-circle distance between two points on a sphere
 * given their longitudes and latitudes.
 * 
 * @param {number} lat1 Latitude of point 1
 * @param {number} lon1 Longitude of point 1
 * @param {number} lat2 Latitude of point 2
 * @param {number} lon2 Longitude of point 2
 * @returns {number} Distance in meters
 */
export const calculateDistanceMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180; // lat1 in radians
  const φ2 = lat2 * Math.PI / 180; // lat2 in radians
  const Δφ = (lat2 - lat1) * Math.PI / 180; // lat diff in radians
  const Δλ = (lon2 - lon1) * Math.PI / 180; // lon diff in radians

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  const distance = R * c; // in meters
  return distance;
};
