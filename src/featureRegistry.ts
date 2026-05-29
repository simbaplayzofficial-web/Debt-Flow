export type Feature = {
  id: string;
  title: string;
  description: string;
  route: string;
  roleAccess: string[];
  selector?: string; // Optional CSS selector for spotlight
};

export const featureRegistry: Feature[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    description: "Your central dashboard. Monitor real-time debt status and recent activity.",
    route: "/dashboard",
    roleAccess: ["user", "monitor", "admin"],
    selector: '[data-tab="dashboard"]'
  },
  {
    id: "profile",
    title: "Profile",
    description: "Manage your account details, view transaction history, and check your net ledger balance.",
    route: "/profile",
    roleAccess: ["user", "monitor", "admin"],
    selector: '[data-tab="profile"]'
  },
  {
    id: "groups",
    title: "Groups",
    description: "Collaborate within shared community workspaces.",
    route: "/groups",
    roleAccess: ["user", "monitor", "admin"],
    selector: '[data-tab="groups"]'
  },
  {
    id: "blackbox",
    title: "Black Box",
    description: "Submit anonymous complaints and communicate anonymously with monitors.",
    route: "/blackbox",
    roleAccess: ["user", "monitor", "admin"]
  },
  {
    id: "monitor",
    title: "Monitor Workspace",
    description: "Monitor complaints, manage warnings, and review submitted bills.",
    route: "/monitor",
    roleAccess: ["monitor", "admin"],
    selector: '[data-tab="monitor"]'
  },
  {
    id: "control",
    title: "Control Panel",
    description: "Admin panel to validate signups, manage system configurations, and edit user records.",
    route: "/control",
    roleAccess: ["admin"],
    selector: '[data-tab="control"]'
  }
];
