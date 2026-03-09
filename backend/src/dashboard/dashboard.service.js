const { prisma } = require("../config/database");
const { ROLES } = require("../utils/roles");

const DAY_MS = 24 * 60 * 60 * 1000;

const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfDay = (date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

const isSuperAdmin = (actor) => actor.role === ROLES.SUPER_ADMIN;

const userWhereForActor = (actor) =>
  isSuperAdmin(actor) ? {} : { organizationId: actor.organizationId };

const projectWhereForActor = (actor) =>
  isSuperAdmin(actor) ? {} : { organizationId: actor.organizationId };

const taskWhereForActor = (actor) =>
  isSuperAdmin(actor) ? {} : { project: { organizationId: actor.organizationId } };

const timeEntryWhereForActor = (actor) =>
  isSuperAdmin(actor) ? {} : { user: { organizationId: actor.organizationId } };

const activityWhereForActor = (actor) =>
  isSuperAdmin(actor) ? {} : { user: { organizationId: actor.organizationId } };

const emptySummary = () => ({
  totalEmployees: 0,
  activeProjects: 0,
  activeSessions: 0,
  totalHours: 0,
  productiveApps: 0,
  idleAlerts: 0,
  productivityScore: 0
});

const emptyTrackedTime = () => ({
  totalTrackedMinutes: 0,
  avgPerEmployeeMinutes: 0,
  totalIdleMinutes: 0,
  excessiveIdleEmployees: 0,
  hourlyDistribution: [],
  employeeBreakdown: []
});

const buildProductivityScore = ({ totalMinutes, totalEmployees }) => {
  if (!totalEmployees) return 0;
  const expectedMinutes = totalEmployees * 8 * 60;
  if (!expectedMinutes) return 0;
  return Math.max(0, Math.min(100, Math.round((totalMinutes / expectedMinutes) * 100)));
};

const getSummary = async (actor) => {
  const [totalEmployees, activeProjects, activeSessions, totalDuration, distinctActivityTypes, idleAlerts] =
    await Promise.all([
      prisma.user.count({ where: userWhereForActor(actor) }),
      prisma.project.count({ where: projectWhereForActor(actor) }),
      prisma.timeEntry.count({
        where: {
          ...timeEntryWhereForActor(actor),
          endTime: null
        }
      }),
      prisma.timeEntry.aggregate({
        where: timeEntryWhereForActor(actor),
        _sum: { duration: true }
      }),
      prisma.activity.findMany({
        where: activityWhereForActor(actor),
        select: { type: true },
        distinct: ["type"]
      }),
      prisma.activity.count({
        where: {
          ...activityWhereForActor(actor),
          OR: [{ type: { contains: "idle", mode: "insensitive" } }, { description: { contains: "idle", mode: "insensitive" } }]
        }
      })
    ]);

  const totalMinutes = totalDuration._sum.duration || 0;
  return {
    totalEmployees,
    activeProjects,
    activeSessions,
    totalHours: Number((totalMinutes / 60).toFixed(2)),
    productiveApps: distinctActivityTypes.filter((a) => !a.type.toLowerCase().includes("idle")).length,
    idleAlerts,
    productivityScore: buildProductivityScore({ totalMinutes, totalEmployees })
  };
};

const getActivityInsights = async (actor) => {
  const now = new Date();
  const windowStart = startOfDay(new Date(now.getTime() - 6 * DAY_MS));

  const [summary, activities, weeklyTimeEntries, weeklyIdleActivities] = await Promise.all([
    getSummary(actor),
    prisma.activity.findMany({
      where: activityWhereForActor(actor),
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        user: { select: { name: true } }
      }
    }),
    prisma.timeEntry.findMany({
      where: {
        ...timeEntryWhereForActor(actor),
        startTime: { gte: windowStart }
      },
      select: {
        startTime: true,
        duration: true
      }
    }),
    prisma.activity.findMany({
      where: {
        ...activityWhereForActor(actor),
        createdAt: { gte: windowStart },
        OR: [{ type: { contains: "idle", mode: "insensitive" } }, { description: { contains: "idle", mode: "insensitive" } }]
      },
      select: {
        createdAt: true
      }
    })
  ]);

  const timelineMap = new Map();
  for (let i = 0; i < 7; i += 1) {
    const date = new Date(windowStart.getTime() + i * DAY_MS);
    const key = date.toISOString().slice(0, 10);
    timelineMap.set(key, {
      day: date.toLocaleDateString("en-IN", { weekday: "short" }),
      productive: 0,
      idle: 0
    });
  }

  weeklyTimeEntries.forEach((entry) => {
    const key = entry.startTime.toISOString().slice(0, 10);
    const day = timelineMap.get(key);
    if (day) day.productive += Number((entry.duration || 0) / 60);
  });

  weeklyIdleActivities.forEach((entry) => {
    const key = entry.createdAt.toISOString().slice(0, 10);
    const day = timelineMap.get(key);
    if (day) day.idle += 1;
  });

  return {
    activeSessions: summary.activeSessions,
    totalActiveHours: summary.totalHours,
    productiveApps: summary.productiveApps,
    idleAlerts: summary.idleAlerts,
    activityTimeline: Array.from(timelineMap.values()).map((d) => ({
      ...d,
      productive: Number(d.productive.toFixed(2))
    })),
    recentActivities: activities.map((activity) => ({
      id: activity.id,
      userName: activity.user?.name || "Unknown",
      type: activity.type,
      description: activity.description,
      timestamp: activity.createdAt,
      category: activity.type.toLowerCase().includes("idle") ? "idle" : "productive"
    }))
  };
};

const getOrganizationSummary = async (actor) => {
  const [summary, organizations, users, activities] = await Promise.all([
    getSummary(actor),
    prisma.organization.findMany({
      where: isSuperAdmin(actor) ? {} : { id: actor.organizationId || undefined },
      select: { id: true, name: true }
    }),
    prisma.user.findMany({
      where: userWhereForActor(actor),
      select: { role: true }
    }),
    prisma.activity.findMany({
      where: activityWhereForActor(actor),
      select: { type: true, description: true },
      take: 500
    })
  ]);

  const usageCounter = new Map();
  activities.forEach((activity) => {
    const label = activity.description?.trim() || activity.type;
    const entry = usageCounter.get(label) || { count: 0, type: activity.type };
    entry.count += 1;
    usageCounter.set(label, entry);
  });

  const topUsage = Array.from(usageCounter.entries())
    .map(([name, value]) => ({
      name,
      category: value.type,
      usage: value.count
    }))
    .sort((a, b) => b.usage - a.usage);

  const roleCounts = users.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {});

  return {
    totalDepartments: 0,
    activeEmployees: summary.totalEmployees,
    activeProjects: summary.activeProjects,
    avgHoursPerDay: summary.totalEmployees ? Number((summary.totalHours / summary.totalEmployees).toFixed(2)) : 0,
    productivityScore: summary.productivityScore,
    topSites: topUsage.filter((u) => u.category.toLowerCase().includes("site")).slice(0, 5),
    topApps: topUsage.filter((u) => u.category.toLowerCase().includes("app")).slice(0, 5),
    departments: Object.entries(roleCounts).map(([name, members]) => ({
      name,
      members,
      productivity: summary.productivityScore
    })),
    organizations
  };
};

const getTrackedTime = async (actor) => {
  const [timeEntries, idleActivities, users] = await Promise.all([
    prisma.timeEntry.findMany({
      where: timeEntryWhereForActor(actor),
      select: {
        id: true,
        userId: true,
        duration: true,
        startTime: true,
        endTime: true,
        user: { select: { name: true, email: true } }
      },
      orderBy: { startTime: "desc" }
    }),
    prisma.activity.findMany({
      where: {
        ...activityWhereForActor(actor),
        OR: [{ type: { contains: "idle", mode: "insensitive" } }, { description: { contains: "idle", mode: "insensitive" } }]
      },
      select: { id: true, userId: true, createdAt: true }
    }),
    prisma.user.findMany({
      where: userWhereForActor(actor),
      select: { id: true, name: true, email: true }
    })
  ]);

  if (!users.length) return emptyTrackedTime();

  const hourlyMap = new Map();
  for (let hour = 0; hour < 24; hour += 1) {
    const label = `${String(hour).padStart(2, "0")}:00`;
    hourlyMap.set(hour, { hour: label, active: 0, idle: 0 });
  }

  const perUser = new Map(
    users.map((user) => [
      user.id,
      {
        id: user.id,
        name: user.name,
        email: user.email,
        activeMinutes: 0,
        idleMinutes: 0,
        awayMinutes: 0,
        efficiency: 0
      }
    ])
  );

  let totalTrackedMinutes = 0;
  timeEntries.forEach((entry) => {
    const duration = entry.duration || 0;
    totalTrackedMinutes += duration;
    const hour = entry.startTime.getHours();
    const hourly = hourlyMap.get(hour);
    if (hourly) hourly.active += duration / 60;

    const user = perUser.get(entry.userId);
    if (user) user.activeMinutes += duration;
  });

  idleActivities.forEach((entry) => {
    const hour = entry.createdAt.getHours();
    const hourly = hourlyMap.get(hour);
    if (hourly) hourly.idle += 1;

    const user = perUser.get(entry.userId);
    if (user) user.idleMinutes += 5;
  });

  const employeeBreakdown = Array.from(perUser.values()).map((user) => {
    const total = user.activeMinutes + user.idleMinutes + user.awayMinutes;
    const efficiency = total > 0 ? Math.round((user.activeMinutes / total) * 100) : 0;
    return {
      ...user,
      efficiency
    };
  });

  const excessiveIdleEmployees = employeeBreakdown.filter((u) => u.idleMinutes >= 60).length;

  return {
    totalTrackedMinutes,
    avgPerEmployeeMinutes: users.length ? Math.round(totalTrackedMinutes / users.length) : 0,
    totalIdleMinutes: employeeBreakdown.reduce((acc, user) => acc + user.idleMinutes, 0),
    excessiveIdleEmployees,
    hourlyDistribution: Array.from(hourlyMap.values()).map((entry) => ({
      ...entry,
      active: Number(entry.active.toFixed(2)),
      idle: Number(entry.idle.toFixed(2))
    })),
    employeeBreakdown
  };
};

const getProductivityOverview = async (actor) => {
  const [summary, users, roleTimeBuckets] = await Promise.all([
    getSummary(actor),
    prisma.user.findMany({
      where: userWhereForActor(actor),
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        _count: { select: { timeEntries: true } },
        timeEntries: {
          select: { duration: true }
        }
      }
    }),
    prisma.user.groupBy({
      by: ["role"],
      where: userWhereForActor(actor),
      _count: { role: true }
    })
  ]);

  const rankings = users.map((user) => {
    const totalMinutes = user.timeEntries.reduce((acc, entry) => acc + (entry.duration || 0), 0);
    const expected = 8 * 60;
    const productivity = expected ? Math.max(0, Math.min(100, Math.round((totalMinutes / expected) * 100))) : 0;
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      productivity,
      totalHours: Number((totalMinutes / 60).toFixed(2))
    };
  });

  const sorted = rankings.slice().sort((a, b) => b.productivity - a.productivity);
  const topPerformer = sorted[0] || null;
  const teamComparison = roleTimeBuckets.map((bucket) => {
    const roleUsers = rankings.filter((u) => u.role === bucket.role);
    const productivity =
      roleUsers.length > 0 ? Math.round(roleUsers.reduce((acc, user) => acc + user.productivity, 0) / roleUsers.length) : 0;
    return {
      team: bucket.role,
      productivity,
      members: bucket._count.role
    };
  });

  return {
    orgProductivity: summary.productivityScore,
    activeEmployees: summary.totalEmployees,
    topPerformer,
    targetGoal: 90,
    teamComparison,
    individualRankings: sorted.slice(0, 10)
  };
};

const getMonitoringSnapshot = async (actor) => {
  const [openEntries, idleActivities] = await Promise.all([
    prisma.timeEntry.findMany({
      where: {
        ...timeEntryWhereForActor(actor),
        endTime: null
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        task: { select: { id: true, name: true } }
      },
      orderBy: { startTime: "desc" },
      take: 100
    }),
    prisma.activity.findMany({
      where: {
        ...activityWhereForActor(actor),
        OR: [{ type: { contains: "idle", mode: "insensitive" } }, { description: { contains: "idle", mode: "insensitive" } }]
      },
      select: { userId: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 100
    })
  ]);

  const activeEmployees = openEntries.map((entry) => ({
    id: entry.user.id,
    userId: entry.user.id,
    name: entry.user.name,
    email: entry.user.email,
    task: entry.task?.name || null,
    status: "active",
    startedAt: entry.startTime,
    activity: 100
  }));

  const idleRecentCutoff = new Date(Date.now() - 30 * 60 * 1000);
  const idleUsers = new Set(idleActivities.filter((a) => a.createdAt >= idleRecentCutoff).map((a) => a.userId));
  const activeUserIds = new Set(activeEmployees.map((e) => e.userId));
  let idleCount = 0;
  idleUsers.forEach((userId) => {
    if (!activeUserIds.has(userId)) idleCount += 1;
  });

  const lastCapture = idleActivities[0]?.createdAt || openEntries[0]?.startTime || null;

  return {
    activeNow: activeEmployees.length,
    idle: idleCount,
    away: 0,
    lastCapture,
    employees: activeEmployees,
    message: activeEmployees.length ? null : "No active employees yet."
  };
};

module.exports = {
  emptySummary,
  emptyTrackedTime,
  getSummary,
  getActivityInsights,
  getOrganizationSummary,
  getTrackedTime,
  getProductivityOverview,
  getMonitoringSnapshot
};
