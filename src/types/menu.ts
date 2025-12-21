export interface MenuItem {
    id: string;
    title: string;
    path: string;
    icon: JSX.Element;
    permission?: string;
    submenu?: SubMenuItem[];
}

export interface SubMenuItem {
    id: string;
    title: string;
    path: string;
    icon: JSX.Element;
    permission?: string;
}
