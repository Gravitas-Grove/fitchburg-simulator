import { Sidebar } from './Sidebar';
import { MapView } from '../map/MapView';
import { ParcelDetailPanel } from '../panels/ParcelDetailPanel';
import { useMapStore } from '@/stores/mapStore';

export function MainLayout() {
  const sidebarCollapsed = useMapStore((s) => s.sidebarCollapsed);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div
        className="flex-1 relative map-transition"
        style={{ marginLeft: sidebarCollapsed ? -392 : 0 }}
      >
        <MapView />
        <ParcelDetailPanel />
      </div>
    </div>
  );
}
