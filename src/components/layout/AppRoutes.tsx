import { lazy, Suspense } from 'react';
import type { AppTab, SetActiveTab } from '../../types/navigation';
import PageLoading from './PageLoading';

const Dashboard = lazy(() => import('../Dashboard'));
const GalleryView = lazy(() => import('../GalleryView'));
const TripDetail = lazy(() => import('../TripDetail'));
const Archives = lazy(() => import('../Archives'));
const AdminPanel = lazy(() => import('../AdminPanel'));
const Stats = lazy(() => import('../Stats'));

type AppRoutesProps = {
  activeTab: AppTab;
  locationId: string;
  setActiveTab: SetActiveTab;
  onImageModalChange: (open: boolean) => void;
  onSlideshowChange: (active: boolean) => void;
};

export default function AppRoutes({ activeTab, locationId, setActiveTab, onImageModalChange, onSlideshowChange }: AppRoutesProps) {
  return (
    <Suspense fallback={<PageLoading />}>
      {activeTab === 'Dashboard' && <Dashboard setActiveTab={setActiveTab} />}
      {activeTab === 'Journal' && <Archives setActiveTab={setActiveTab} />}
      {activeTab === 'Gallery' && <GalleryView setActiveTab={setActiveTab} locationId={locationId} onImageModalChange={onImageModalChange} onSlideshowChange={onSlideshowChange} />}
      {activeTab === 'Destinations' && <TripDetail setActiveTab={setActiveTab} locationId={locationId} />}
      {activeTab === 'Admin' && <AdminPanel />}
      {activeTab === 'Stats' && <Stats setActiveTab={setActiveTab} />}
    </Suspense>
  );
}
