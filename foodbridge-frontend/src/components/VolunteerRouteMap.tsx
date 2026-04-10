import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";

interface Donation {
  id: number;
  food: string;
  quantity: string;
  expiry: string;
  status: string;
  latitude: number;
  longitude: number;
}

interface Props {
  donations: Donation[];
}

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function distance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const R = 6371;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function optimizeRoute(donations: Donation[]) {
  if (donations.length <= 1) return donations;

  const remaining = [...donations];
  const route: Donation[] = [];

  let current = remaining.shift()!;
  route.push(current);

  while (remaining.length > 0) {
    let nearestIndex = 0;
    let nearestDistance = Infinity;

    remaining.forEach((donation, index) => {
      const dist = distance(
        current.latitude,
        current.longitude,
        donation.latitude,
        donation.longitude
      );

      if (dist < nearestDistance) {
        nearestDistance = dist;
        nearestIndex = index;
      }
    });

    current = remaining.splice(nearestIndex, 1)[0];
    route.push(current);
  }

  return route;
}

const VolunteerRouteMap = ({ donations }: Props) => {
  const optimized = optimizeRoute(donations);

  const center =
    optimized.length > 0
      ? [optimized[0].latitude, optimized[0].longitude]
      : [-1.2921, 36.8219];

  const polylinePositions = optimized.map((d) => [d.latitude, d.longitude] as [number, number]);

  return (
    <div className="card shadow-sm mt-4">
      <div className="card-body">
        <h4 className="mb-3">Pickup Route Map</h4>

        <MapContainer
          center={center as [number, number]}
          zoom={12}
          style={{ height: "450px", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />

          {optimized.map((donation, index) => {
            const markerProps = {
              position: [donation.latitude, donation.longitude] as [number, number],
              icon: markerIcon,
            };

            return (
              <Marker key={donation.id} {...markerProps}>
                <Popup>
                  <strong>Stop {index + 1}</strong>
                  <br />
                  {donation.food}
                  <br />
                  Quantity: {donation.quantity}
                  <br />
                  Status: {donation.status}
                </Popup>
              </Marker>
            );
          })}

          {polylinePositions.length > 1 && (
            <Polyline positions={polylinePositions} />
          )}
        </MapContainer>

        <div className="mt-3">
          <h6>Optimized Route Order</h6>
          <ol className="mb-0">
            {optimized.map((donation) => (
              <li key={donation.id}>
                {donation.food} ({donation.quantity})
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
};

export default VolunteerRouteMap;