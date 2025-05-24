"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function getAnalytics(period = "30days") {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) {
    throw new Error("User not found");
  }
  const startDate = new Date();
  switch (period) {
    case "7days":
      startDate.setDate(startDate.getDate() - 7);
      break;
    case "15days":
      startDate.setDate(startDate.getDate() - 15);
      break;
    case "30days":
    default:
      startDate.setDate(startDate.getDate() - 30);
      break;
  }
  const entries = await db.entry.findMany({
    where: {
      userId: user.id,
      createdAt: {
        gte: startDate,
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });
  const moodData = entries.reduce((acc, entry) => {
    const data = entry.createdAt.toISOString().split("T")[0];
    if (!acc[data]) {
      acc[data] = { totalScore: 0, count: 0, entries: [] };
    }
    acc[data].totalScore += entry.moodScore;
    acc[data].count += 1;
    acc[data].entries.push(entry);
    return acc;
  }, {});
  const analyticsData = Object.entries(moodData).map(([date, data]) => ({
    date,
    averageScore: Number((data.totalScore / data.count).toFixed(1)),
    entryCount: data.count,
  }));
  const overallStats = {
    totalEntries: entries.length,
    averageScore: Number(
      (
        entries.reduce((sum, entry) => sum + entry.moodScore, 0) /
        entries.length
      ).toFixed(1)
    ),
    mostFrequentMood: Object.entries(
      entries.reduce((acc, entry) => {
        acc[entry.mood] = (acc[entry.mood] || 0) + 1;
        return acc;
      }, {})
    ).sort((a, b) => b[1] - a[1])[0]?.[0],
    dailyAvergae: Number(
      (
        entries.length /
        (period === "7days" ? 7 : period === "15days" ? 15 : 30)
      ).toFixed(1)
    ),
  };
  return {
    success: true,
    data: {
      timeline: analyticsData,
      stats: overallStats,
    },
  };
}
