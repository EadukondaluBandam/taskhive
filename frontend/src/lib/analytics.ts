import { ActivityStorage, DateUtils, TimeEntryStorage, UserStorage } from "@/lib/storage";

export const getWeeklyData = () => {
  const dates = DateUtils.getWeekDates();
  const entries = TimeEntryStorage.getAll();
  const activities = ActivityStorage.getAll();

  return dates.map((date) => {
    const label = new Date(date).toLocaleDateString("en-US", { weekday: "short" });
    const dayEntries = entries.filter((entry) => entry.date === date);
    const dayActivities = activities.filter((activity) => activity.timestamp.startsWith(date));

    const productiveMinutes = dayActivities
      .filter((activity) => activity.category === "productive")
      .reduce((acc, activity) => acc + activity.duration, 0);
    const idleMinutes = dayActivities
      .filter((activity) => activity.type === "idle")
      .reduce((acc, activity) => acc + activity.duration, 0);
    const entryMinutes = dayEntries.reduce((acc, entry) => acc + entry.duration, 0);

    return {
      day: label,
      hours: Math.round((entryMinutes / 60) * 10) / 10,
      productive: Math.round(((productiveMinutes || entryMinutes) / 60) * 10) / 10,
      idle: Math.round((idleMinutes / 60) * 10) / 10
    };
  });
};

export const getProductivityByTeam = () => {
  const users = UserStorage.getAll();
  const byDepartment = users.reduce(
    (acc, user) => {
      if (!acc[user.department]) {
        acc[user.department] = { total: 0, count: 0 };
      }
      acc[user.department].total += user.productivity || 0;
      acc[user.department].count += 1;
      return acc;
    },
    {} as Record<string, { total: number; count: number }>
  );

  return Object.entries(byDepartment).map(([team, stats]) => ({
    team,
    productivity: Math.round(stats.total / Math.max(stats.count, 1))
  }));
};
