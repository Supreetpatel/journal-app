"use server";

import { MOODS } from "@/app/lib/moods";
import { auth } from "@clerk/nextjs/server";
import { getPixabayImage } from "./public";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/prisma";
import { request } from "@arcjet/next";
import aj from "@/lib/arcjet";

export async function createJournalEntry(data) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("User not authenticated");
    //Arcjet Rate Limiting factor
    const req = await request();
    const decision = await aj.protect(req, { userId, requested: 1 });
    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        const { remaining, reset } = decision.reason;
        console.error({
          code: "Rate_LIMIT_EXCEEDED",
          details: {
            remaining,
            resetInSeconds: reset,
          },
        });
        throw new Error("Too many requests. Please try again later");
      }
      throw new Error("Request Blocked");
    }
    const user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
    });
    if (!user) {
      throw new Error("User not found");
    }
    const mood = MOODS[data.mood.toUpperCase()];
    if (!mood) throw new Error("Invalid mood");
    const moodImageUrl = await getPixabayImage(data.moodQuery);
    const entry = await db.entry.create({
      data: {
        title: data.title,
        content: data.content,
        mood: mood.id,
        moodScore: mood.score,
        moodImageUrl,
        userId: user.id,
        collectionId: data.collectionId || null,
      },
    });
    await db.draft.deleteMany({
      where: {
        userId: user.id,
      },
    });
    revalidatePath("/dashboard");
    return entry;
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function getJournalEntries({
  collectionId,
  orderBy = "desc",
} = {}) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("User not authenticated");
    const user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
    });
    if (!user) {
      throw new Error("User not found");
    }
    const entries = await db.entry.findMany({
      where: {
        userId: user.id,
        ...(collectionId === "unorganized"
          ? { collectionId: null }
          : collectionId
          ? { collectionId }
          : {}),
      },
      include: {
        collection: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: orderBy,
      },
    });
    const entriesWithMoodData = entries.map((entry) => ({
      ...entry,
      moodData: getMoodById(entry.mood),
    }));
    return {
      success: true,
      data: {
        entries: entriesWithMoodData,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function getJournalEntry(id) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("User not authenticated");
    const user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
    });
    if (!user) {
      throw new Error("User not found");
    }

    const entry = await db.entry.findFirst({
      where: {
        id,
        userId: user.id,
      },
      include: {
        collection: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    if (!entry) throw new Error("Entry not found");
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function deleteJournalEntry(id) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });
    if (!user) {
      throw new Error("User not found");
    }
    const entry = await db.entry.findFirst({
      where: { userId: user.id, id },
    });
    if (!entry) throw new Error("entry not found");
    await db.entry.delete({
      where: {
        id,
      },
    });
    revalidatePath("/dashboard");
    return entry;
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function updateJournalEntry(data) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });
    if (!user) {
      throw new Error("User not found");
    }
    const existingEntry = await db.entry.findFirst({
      where: { userId: user.id, id: data.id },
    });
    if (!existingEntry) throw new Error("entry not found");
    const mood = MOODS[data.mood.toUpperCase()];
    if (!mood) throw new Error("Invalid mood");
    let moodImageUrl = existingEntry.moodImageUrl;
    if (existingEntry.mood !== mood.id) {
      moodImageUrl = await getPixabayImage(data.moodQuery);
    }
    const updatedEntry = await db.entry.update({
      where: { id: data.id },
      data: {
        title: data.title,
        content: data.content,
        mood: mood.id,
        moodScore: mood.score,
        moodImageUrl,
        collectionId: data.collectionId || null,
      },
    });
    revalidatePath(`/journal/${data.id}`);
    revalidatePath("/dashboard");
    return updatedEntry;
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function getDraft() {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });
    if (!user) {
      throw new Error("User not found");
    }
    const draft = await db.draft.findUnique({
      where: { userId: user.id },
    });
    return { success: true, data: draft };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function saveDraft(data) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });
    if (!user) {
      throw new Error("User not found");
    }
    const draft = await db.draft.upsert({
      where: { userId: user.id },
      create: {
        title: data.title,
        content: data.content,
        mood: data.mood,
        userId: user.id,
      },
      update: {
        title: data.title,
        content: data.content,
        mood: data.mood,
      },
    });
    revalidatePath("/dashboard");
    return { success: true, data: draft };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
