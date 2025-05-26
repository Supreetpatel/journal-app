"use client";

import { MOODS } from "@/app/lib/moods";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar1Icon, Search } from "lucide-react";
import { useState } from "react";

const JournalFilters = ({ entries }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectMood, setSelectMood] = useState("");
  const [date, setDate] = useState("");
  const [filteredEntries, setFilteredEntries] = useState(entries);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectMood("");
    setDate(null);
  };
  return (
    <>
      <div className="flex flex-wrap gap-4">
        <div className="flex min-w-[200px]">
          <Input
            placeholder="Search Entries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
            prefix={<Search className="h-4 w-4 text-gray-500" />}
          />
        </div>

        <Select value={selectMood} onValueChange={setSelectMood}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Filter by mood" />
          </SelectTrigger>
          <SelectContent>
            {Object.values(MOODS).map((mood) => (
              <SelectItem key={mood.id} value={mood.id}>
                <span className="flex items-center gap-2">
                  {mood.emoji} {mood.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <Calendar1Icon className="h-4 w-4" />
              {date ? format(date, "PPP") : <span>Select a Date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {(searchQuery || selectMood || date) && (
          <Button
            variant="ghost"
            className="text-orange-600"
            onClick={clearFilters}
          >
            Clear Filters
          </Button>
        )}
      </div>
      <div className="text-sm text-gray-500">
        Showing {filteredEntries.length} of {entries.length} entries
      </div>
    </>
  );
};

export default JournalFilters;
