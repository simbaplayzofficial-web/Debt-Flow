export type Feature = {
  id: string;
  title: string;
  description: string;
  route: string;
  tutorialEnabled: boolean;
  roleAccess: string[];
  selector?: string; // Optional CSS selector for spotlight
};

export const featureRegistry: Feature[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    description: "Your central operational overview. Monitor real-time debt status and upcoming operational notifications.",
    route: "/dashboard",
    tutorialEnabled: true,
    roleAccess: ["user", "monitor", "admin"],
    selector: '[data-tab="dashboard"]'
  },
  {
    id: "profile",
    title: "Profile & Identity",
    description: "Manage your credentials, view your ledger history, and handle security settings.",
    route: "/profile",
    tutorialEnabled: true,
    roleAccess: ["user", "monitor", "admin"],
    selector: '[data-tab="profile"]'
  },
  {
    id: "groups",
    title: "Groups",
    description: "Collaborate within specialized community units.",
    route: "/groups",
    tutorialEnabled: true,
    roleAccess: ["user", "monitor", "admin"],
    selector: '[data-tab="groups"]'
  },
  {
    id: "blackbox",
    title: "Black Box",
    description: "Submit anonymous complaints and establish secure communication channels with monitors.",
    route: "/blackbox",
    tutorialEnabled: true,
    roleAccess: ["user", "monitor", "admin"]
  },
  {
    id: "monitor",
    title: "Council Workspace",
    description: "Monitor complaints, manage warnings, and resolve legislative bills.",
    route: "/monitor",
    tutorialEnabled: true,
    roleAccess: ["monitor", "admin"],
    selector: '[data-tab="monitor"]'
  },
  {
    id: "control",
    title: "Control Panel",
    description: "Advanced administrative oversight: validate users, enforce system-wide protocols, and manage ledger datasets.",
    route: "/control",
    tutorialEnabled: true,
    roleAccess: ["admin"],
    selector: '[data-tab="control"]'
  }
];
