/**
 * ForecastCalendar Component
 * A monthly calendar grid showing holidays, paydays, and e-commerce events
 * Similar to Google Calendar layout
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { getMonthEvents, getDayName, getMonthName, getEventForecast, type CalendarEvent } from "@/utils/forecastHelpers";

interface ForecastCalendarProps {
  onDateClick?: (date: Date, event: CalendarEvent | null) => void;
  currentDate?: Date;
}

export function ForecastCalendar({ onDateClick, currentDate = new Date() }: ForecastCalendarProps) {
  const [viewDate, setViewDate] = useState(currentDate);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth(); // 0-11
  const monthName = getMonthName(month);
  
  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday

  // Get all events for this month
  const monthEvents = getMonthEvents(year, month + 1);

  // Get event for a specific date
  const getEventForDate = (day: number): CalendarEvent | null => {
    const date = new Date(year, month, day);
    return monthEvents.find(e => 
      e.date.getDate() === day && 
      e.date.getMonth() === month &&
      e.date.getFullYear() === year
    ) || null;
  };

  // Navigation
  const goToPreviousMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setViewDate(new Date());
  };

  // Generate calendar cells
  const calendarCells: (number | null)[] = [];
  
  // Add empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarCells.push(null);
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarCells.push(day);
  }

  const handleDateClick = (day: number) => {
    const date = new Date(year, month, day);
    const event = getEventForDate(day);
    onDateClick?.(date, event);
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            Smart Forecast Calendar
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousMonth}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="h-8 px-3"
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextMonth}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="text-lg font-semibold text-foreground">
          {monthName} {year}
        </div>
      </CardHeader>
      <CardContent>
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="text-center text-xs font-semibold text-muted-foreground py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarCells.map((day, index) => {
            if (day === null) {
              return (
                <div
                  key={`empty-${index}`}
                  className="aspect-square bg-muted/20 rounded-md"
                />
              );
            }

            const event = getEventForDate(day);
            const today = isToday(day);
            const date = new Date(year, month, day);
            const forecast = getEventForecast(date);
            const isUpcoming = date > new Date() && !today;
            const isHoliday = event?.type === "holiday" || event?.type === "sale";

            return (
              <button
                key={day}
                onClick={() => handleDateClick(day)}
                className={`
                  aspect-square rounded-md p-1 text-sm font-medium
                  transition-all hover:scale-105 hover:shadow-md
                  flex flex-col items-start justify-start gap-1
                  border-2
                  ${today 
                    ? "border-primary bg-primary/10 text-primary font-bold" 
                    : event && isUpcoming && isHoliday
                      ? "border-orange-500 bg-orange-500/20 hover:bg-orange-500/30 border-dashed"
                    : event 
                      ? "border-card-glass-border bg-card-glass hover:bg-card-glass-hover" 
                      : "border-transparent bg-muted/30 hover:bg-muted/50"
                  }
                `}
              >
                <span className={`${today ? "text-primary" : "text-foreground"}`}>
                  {day}
                </span>
                {event && (
                  <div className="w-full flex flex-col gap-0.5">
                    <Badge
                      variant={event.priority === "high" ? "destructive" : "secondary"}
                      className={`
                        text-[10px] px-1 py-0 h-auto leading-tight
                        ${event.type === "payday" ? "bg-blue-500 hover:bg-blue-600" : ""}
                        ${event.type === "sale" ? "bg-orange-500 hover:bg-orange-600" : ""}
                        ${event.type === "holiday" ? "bg-red-500 hover:bg-red-600" : ""}
                      `}
                    >
                      {event.eventName}
                    </Badge>
                    {forecast && (
                      <>
                        {forecast.expectedTraffic === "High" && (
                          <div className="text-[8px] text-muted-foreground">
                            🔥 High Traffic
                          </div>
                        )}
                        {forecast.demandIncrease && (
                          <div className="text-[8px] text-success font-semibold">
                            +{forecast.demandIncrease}% demand
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 pt-4 border-t border-card-glass-border">
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-red-500" />
              <span className="text-muted-foreground">Holiday</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-blue-500" />
              <span className="text-muted-foreground">Payday</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-orange-500" />
              <span className="text-muted-foreground">Sale Event</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded border-2 border-primary" />
              <span className="text-muted-foreground">Today</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

