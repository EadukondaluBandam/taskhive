import type { ComponentType } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Building2,
  CalendarClock,
  Camera,
  Clock3,
  Download,
  FileText,
  FolderKanban,
  LayoutDashboard,
  ListTodo,
  PlayCircle,
  TrendingUp,
  User,
  UserRound,
  Users
} from "lucide-react";

type PageModule = {
  default: ComponentType;
};

export type AppRouteItem = {
  path: string;
  label: string;
  icon: LucideIcon;
  component: ComponentType;
  fullPath: string;
  filePath: string;
};

type RouteDefinition = {
  file: string;
  path: string;
  label: string;
  icon: LucideIcon;
};

const pageModules = import.meta.glob("../pages/**/*.{tsx,jsx}", { eager: true }) as Record<string, PageModule>;

const adminRouteDefinitions: RouteDefinition[] = [
  { file: "AdminDashboard", path: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { file: "AdminUsers", path: "users", label: "Users", icon: Users },
  { file: "AdminProjects", path: "projects", label: "Projects", icon: FolderKanban },
  { file: "AdminTasks", path: "tasks", label: "Tasks", icon: ListTodo },
  { file: "AdminReports", path: "reports", label: "Reports", icon: FileText },
  { file: "AdminTrackedTime", path: "tracked-time", label: "Tracked Time", icon: Clock3 },
  { file: "AdminProductivity", path: "productivity", label: "Productivity", icon: TrendingUp },
  { file: "AdminScreenshots", path: "screenshots", label: "Screenshots", icon: Camera },
  { file: "AdminActivity", path: "activity", label: "Activity", icon: Activity },
  { file: "AdminOrganization", path: "organization", label: "Organization", icon: Building2 },
  { file: "AdminProfile", path: "profile", label: "Profile", icon: UserRound }
];

const employeeRouteDefinitions: RouteDefinition[] = [
  { file: "EmployeeDashboard", path: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { file: "EmployeeTimer", path: "timer", label: "Timer", icon: PlayCircle },
  { file: "EmployeeTimesheets", path: "timesheets", label: "Timesheets", icon: CalendarClock },
  { file: "EmployeeActivities", path: "activities", label: "Activity", icon: Activity },
  { file: "EmployeeProductivity", path: "productivity", label: "Productivity", icon: TrendingUp },
  { file: "EmployeeProfile", path: "profile", label: "Profile", icon: User }
];

function resolvePageModulePath(baseModulePath: string) {
  const supportedModulePath = [`${baseModulePath}.tsx`, `${baseModulePath}.jsx`].find((modulePath) => modulePath in pageModules);

  if (!supportedModulePath) {
    throw new Error(`Missing page module for ${baseModulePath}`);
  }

  return supportedModulePath;
}

function getPageComponent(baseModulePath: string) {
  const pageModule = pageModules[resolvePageModulePath(baseModulePath)];

  if (!pageModule?.default) {
    throw new Error(`Missing page component for ${baseModulePath}`);
  }

  return pageModule.default;
}

function toKebabCase(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
}

function formatLabelFromFile(fileName: string, prefix: "Admin" | "Employee") {
  const withoutPrefix = fileName.replace(new RegExp(`^${prefix}`), "");
  const words = withoutPrefix.replace(/([a-z0-9])([A-Z])/g, "$1 $2").trim();
  return words || fileName;
}

function buildSectionRoutes(
  section: "admin" | "employee",
  routeDefinitions: RouteDefinition[],
  prefix: "Admin" | "Employee"
) {
  const sectionDirectory = `../pages/${section}/`;
  const discoveredFiles = Object.keys(pageModules)
    .filter((modulePath) => modulePath.startsWith(sectionDirectory))
    .map((modulePath) => modulePath.slice(sectionDirectory.length).replace(/\.(tsx|jsx)$/, ""));

  const configuredRoutes = routeDefinitions.map((routeDefinition) => ({
    ...routeDefinition,
    component: getPageComponent(`${sectionDirectory}${routeDefinition.file}`),
    fullPath: `/${section}/${routeDefinition.path}`,
    filePath: resolvePageModulePath(`${sectionDirectory}${routeDefinition.file}`)
  }));

  const configuredFiles = new Set(routeDefinitions.map((routeDefinition) => routeDefinition.file));

  const discoveredRoutes = discoveredFiles
    .filter((fileName) => !configuredFiles.has(fileName))
    .sort((left, right) => left.localeCompare(right))
    .map((fileName) => {
      const routePath = toKebabCase(fileName.replace(new RegExp(`^${prefix}`), ""));

      return {
        path: routePath,
        label: formatLabelFromFile(fileName, prefix),
        icon: FileText,
        component: getPageComponent(`${sectionDirectory}${fileName}`),
        fullPath: `/${section}/${routePath}`,
        filePath: resolvePageModulePath(`${sectionDirectory}${fileName}`)
      };
    });

  return [...configuredRoutes, ...discoveredRoutes] satisfies AppRouteItem[];
}

export const adminRoutes = buildSectionRoutes("admin", adminRouteDefinitions, "Admin");
export const employeeRoutes = [
  ...buildSectionRoutes("employee", employeeRouteDefinitions, "Employee"),
  {
    path: "download",
    label: "Download",
    icon: Download,
    component: getPageComponent("../pages/Download"),
    fullPath: "/employee/download",
    filePath: resolvePageModulePath("../pages/Download")
  }
] satisfies AppRouteItem[];

export const publicPages = {
  home: getPageComponent("../pages/Index"),
  login: getPageComponent("../pages/Login"),
  setPassword: getPageComponent("../pages/SetPassword"),
  notFound: getPageComponent("../pages/NotFound")
};
