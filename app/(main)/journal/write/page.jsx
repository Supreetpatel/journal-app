"use client";
import dynamic from "next/dynamic";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import "react-quill-new/dist/quill.snow.css";
import { zodResolver } from "@hookform/resolvers/zod";
import { journalSchema } from "@/app/lib/schema";
import { BarLoader } from "react-spinners";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MOODS } from "@/app/lib/moods";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

const JournalEntryPage = () => {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(journalSchema),
    defaultValues: {
      title: "",
      content: "",
      mood: "",
      collectionId: "",
    },
  });
  const isLoading = false;
  return (
    <div className="py-8">
      <form>
        <h1 className="text-5xl md:text-6xl gradient-title">
          What&apos;s on your mind?
        </h1>
        {isLoading && <BarLoader color="orange" width={"100%"} />}
        <div className="space-y-2">
          <label className="text-sm font-medium">Title</label>
          <Input
            {...register("title")}
            placeholder="Give your entry a title..."
            className={`py-5 md:text-md ${
              errors.title ? "border-red-500" : ""
            }`}
          />
        </div>
        <div className="space-y-2 mt-2">
          <label className="text-sm font-medium">How are you feeling?</label>
          <Controller
            name="mood"
            control={control}
            render={({ field }) => {
              return (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger
                    className={errors.mood ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder="Select a mood.." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(MOODS).map((mood) => {
                      return (
                        <SelectItem key={mood.id} value={mood.id}>
                          <span className="flex items-center gap-2">
                            {mood.emoji}
                            {mood.label}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              );
            }}
          />
        </div>
      </form>
    </div>
  );
};

export default JournalEntryPage;
