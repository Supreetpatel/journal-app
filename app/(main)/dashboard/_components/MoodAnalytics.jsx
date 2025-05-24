"use client";
import { getAnalytics } from "@/actions/analytics";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useFetch from "@/hooks/use-fetch";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import AnalyticsLoading from "./AnalyticsLoading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const timeOptions = [
  { value: "7days", label: "Last 7 Days" },
  { value: "15days", label: "Last 15 Days" },
  { value: "30days", label: "Last 30 Days" },
];

const MoodAnalytics = () => {
  const [period, setPeriod] = useState("7days");
  const {
    loading,
    data: analytics,
    fn: fetchAnalytics,
  } = useFetch(getAnalytics);
  const { isLoaded } = useUser();
  useEffect(() => {
    fetchAnalytics(period);
  }, [period]);
  if (loading || !analytics?.data || !isLoaded) {
    return <AnalyticsLoading />;
  }
  return (
    <>
      <div className="flex justify-between items-center">
        <h2 className="text-5xl font-bold gradient-title">Dashboard</h2>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Theme" />
          </SelectTrigger>
          <SelectContent>
            {timeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <div>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle></CardTitle>
            </CardHeader>
            <CardContent></CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default MoodAnalytics;
