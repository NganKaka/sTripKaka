export type AppTab = 'Dashboard' | 'Journal' | 'Gallery' | 'Destinations' | 'Admin' | 'Stats';

export type AppRouteState = {
  activeTab: AppTab;
  locationId: string;
};

export type SetActiveTab = (tab: string) => void;
