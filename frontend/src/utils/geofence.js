import { getItem, setItem } from '../services/storage';

export const loadGeofences = () => getItem('geofences') || [];

export const saveGeofence = (geofence) => {
  const fences = loadGeofences();
  fences.push(geofence);
  setItem('geofences', fences);
};

export const isOutsideGeofence = (lat, lng, fence) => {
  const R = 6371e3;
  const toRad = (v) => v * Math.PI / 180;
  const φ1 = toRad(lat);
  const φ2 = toRad(fence.lat);
  const Δφ = toRad(fence.lat - lat);
  const Δλ = toRad(fence.lng - lng);
  const a = Math.sin(Δφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return distance > fence.radius;
};

export const checkGeofences = (lat, lng) => {
  const fences = loadGeofences();
  return fences.filter(f => isOutsideGeofence(lat, lng, f));
};
