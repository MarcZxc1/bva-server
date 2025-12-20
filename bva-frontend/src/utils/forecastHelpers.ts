/**
 * Forecast Helpers
 * Utility functions for event forecasting and calendar data
 */

export interface EventForecast {
  eventName: string;
  trendingKeywords: string[];
  expectedTraffic: "High" | "Normal" | "Low";
  demandIncrease?: number; // Percentage increase in demand
  description?: string;
}

export interface CalendarEvent {
  date: Date;
  eventName: string;
  type: "holiday" | "payday" | "sale" | "seasonal";
  color: string;
  priority: "high" | "medium" | "low";
}

/**
 * Get event forecast for a specific date
 */
export function getEventForecast(date: Date): EventForecast | null {
  const month = date.getMonth() + 1; // 1-12
  const day = date.getDate();
  const dayOfWeek = date.getDay(); // 0 = Sunday

  // Check for paydays (15th and 30th/31st)
  if (day === 15 || day === 30 || (day === 31 && [1, 3, 5, 7, 8, 10, 12].includes(month))) {
    return {
      eventName: "Payday",
      trendingKeywords: ["Electronics", "Fashion", "Home & Living", "Beauty"],
      expectedTraffic: "High",
      demandIncrease: 20,
      description: "Increased purchasing power leads to higher demand for lifestyle products"
    };
  }

  // Major holidays and events
  if (month === 1 && day === 1) {
    return {
      eventName: "New Year",
      trendingKeywords: ["Fitness Wear", "Healthy Food", "Supplements", "Gym Equipment"],
      expectedTraffic: "High",
      demandIncrease: 45,
      description: "New Year resolutions drive demand for health and fitness products"
    };
  }

  if (month === 2 && day === 14) {
    return {
      eventName: "Valentine's Day",
      trendingKeywords: ["Chocolates", "Flowers", "Jewelry", "Romantic Gifts", "Perfume"],
      expectedTraffic: "High",
      demandIncrease: 60,
      description: "Romantic gifts and treats see significant demand spike"
    };
  }

  if (month === 11 && day === 11) {
    return {
      eventName: "11.11 Mega Sale",
      trendingKeywords: ["Electronics", "Fashion", "Home Appliances", "Beauty Products"],
      expectedTraffic: "High",
      demandIncrease: 80,
      description: "Largest e-commerce sale event with massive traffic and demand"
    };
  }

  if (month === 12 && day === 25) {
    return {
      eventName: "Christmas",
      trendingKeywords: ["Toys", "Gift Sets", "Decorations", "Food & Beverages", "Clothing"],
      expectedTraffic: "High",
      demandIncrease: 70,
      description: "Holiday shopping season peaks with gift purchases"
    };
  }

  if (month === 12 && day === 31) {
    return {
      eventName: "New Year's Eve",
      trendingKeywords: ["Party Supplies", "Alcohol", "Food", "Fireworks", "Entertainment"],
      expectedTraffic: "High",
      demandIncrease: 50,
      description: "Celebration items and party supplies in high demand"
    };
  }

  // Summer season (June-August in Northern Hemisphere, Dec-Feb in Southern)
  if ((month >= 6 && month <= 8) || (month === 12 || month <= 2)) {
    if (day >= 1 && day <= 7) {
      return {
        eventName: "Summer Sale",
        trendingKeywords: ["Swimwear", "Sunblock", "Beach Accessories", "Cooling Products"],
        expectedTraffic: "Normal",
        demandIncrease: 30,
        description: "Summer essentials see increased demand"
      };
    }
  }

  // Back to School (August-September)
  if (month === 8 || month === 9) {
    if (day >= 15 && day <= 30) {
      return {
        eventName: "Back to School",
        trendingKeywords: ["School Supplies", "Backpacks", "Uniforms", "Electronics"],
        expectedTraffic: "High",
        demandIncrease: 40,
        description: "Students and parents stock up on school essentials"
      };
    }
  }

  // Chinese New Year (varies, but typically late January to mid-February)
  if (month === 1 && day >= 20 && day <= 31) {
    return {
      eventName: "Chinese New Year",
      trendingKeywords: ["Red Envelopes", "Traditional Foods", "Decorations", "Gifts"],
      expectedTraffic: "High",
      demandIncrease: 55,
      description: "Traditional celebration drives demand for cultural items"
    };
  }

  // Philippines National Holidays
  // January
  if (month === 1 && day === 1) {
    // Already handled as New Year above
  }
  
  // February
  if (month === 2 && day === 25) {
    return {
      eventName: "People Power Revolution Day",
      trendingKeywords: ["Patriotic Items", "Books", "Educational Materials", "Flags"],
      expectedTraffic: "Normal",
      demandIncrease: 25,
      description: "National holiday commemorating the People Power Revolution"
    };
  }

  // April
  if (month === 4 && day === 9) {
    return {
      eventName: "Araw ng Kagitingan (Day of Valor)",
      trendingKeywords: ["Patriotic Items", "Books", "Historical Items", "Flags"],
      expectedTraffic: "Normal",
      demandIncrease: 30,
      description: "National holiday honoring Filipino heroes and veterans"
    };
  }
  
  // Calculate Easter dates (Good Friday and Easter Sunday vary)
  // Using 2024-2025 approximations
  const year = date.getFullYear();
  const easterDate = calculateEaster(year);
  const goodFriday = new Date(easterDate);
  goodFriday.setDate(goodFriday.getDate() - 2);
  
  if (month === goodFriday.getMonth() + 1 && day === goodFriday.getDate()) {
    return {
      eventName: "Good Friday",
      trendingKeywords: ["Religious Items", "Food & Beverages", "Candles", "Prayer Books"],
      expectedTraffic: "High",
      demandIncrease: 40,
      description: "Religious holiday - increased demand for religious items and food"
    };
  }
  
  if (month === easterDate.getMonth() + 1 && day === easterDate.getDate()) {
    return {
      eventName: "Easter Sunday",
      trendingKeywords: ["Food & Beverages", "Gifts", "Easter Items", "Chocolates"],
      expectedTraffic: "High",
      demandIncrease: 45,
      description: "Religious holiday - celebration items and food in high demand"
    };
  }

  // May
  if (month === 5 && day === 1) {
    return {
      eventName: "Labor Day",
      trendingKeywords: ["Work Tools", "Uniforms", "Safety Equipment", "Electronics"],
      expectedTraffic: "Normal",
      demandIncrease: 20,
      description: "National holiday celebrating workers"
    };
  }

  // June
  if (month === 6 && day === 12) {
    return {
      eventName: "Independence Day",
      trendingKeywords: ["Patriotic Items", "Flags", "Food & Beverages", "Party Supplies"],
      expectedTraffic: "High",
      demandIncrease: 50,
      description: "Philippines Independence Day - celebration items in high demand"
    };
  }

  // August
  if (month === 8 && day === 21) {
    return {
      eventName: "Ninoy Aquino Day",
      trendingKeywords: ["Books", "Educational Materials", "Patriotic Items"],
      expectedTraffic: "Normal",
      demandIncrease: 20,
      description: "National holiday commemorating Ninoy Aquino"
    };
  }
  
  if (month === 8 && day === 26) {
    return {
      eventName: "National Heroes Day",
      trendingKeywords: ["Books", "Educational Materials", "Patriotic Items", "Flags"],
      expectedTraffic: "Normal",
      demandIncrease: 25,
      description: "National holiday honoring all Filipino heroes"
    };
  }

  // November
  if (month === 11 && day === 1) {
    return {
      eventName: "All Saints' Day",
      trendingKeywords: ["Candles", "Flowers", "Food & Beverages", "Religious Items"],
      expectedTraffic: "High",
      demandIncrease: 60,
      description: "Filipino tradition of visiting cemeteries - high demand for offerings and food"
    };
  }
  
  if (month === 11 && day === 30) {
    return {
      eventName: "Bonifacio Day",
      trendingKeywords: ["Patriotic Items", "Books", "Educational Materials", "Flags"],
      expectedTraffic: "Normal",
      demandIncrease: 25,
      description: "National holiday honoring Andres Bonifacio"
    };
  }

  // December
  if (month === 12 && day === 30) {
    return {
      eventName: "Rizal Day",
      trendingKeywords: ["Books", "Educational Materials", "Patriotic Items", "Flags"],
      expectedTraffic: "Normal",
      demandIncrease: 25,
      description: "National holiday honoring Dr. Jose Rizal"
    };
  }

  // No special event
  return null;
}

/**
 * Calculate Easter date for a given year (approximation)
 * Uses simplified algorithm for 2024-2025
 */
function calculateEaster(year: number): Date {
  // Simplified Easter calculation (works for 2024-2025)
  // 2024: March 31, 2025: April 20
  if (year === 2024) {
    return new Date(2024, 2, 31); // March 31, 2024
  } else if (year === 2025) {
    return new Date(2025, 3, 20); // April 20, 2025
  } else {
    // Fallback: use March 31 for other years (approximation)
    return new Date(year, 2, 31);
  }
}

/**
 * Get all events for a given month
 */
export function getMonthEvents(year: number, month: number): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const daysInMonth = new Date(year, month, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const forecast = getEventForecast(date);

    if (forecast) {
      events.push({
        date,
        eventName: forecast.eventName,
        type: forecast.eventName === "Payday" ? "payday" : 
              forecast.eventName.includes("Sale") ? "sale" : "holiday",
        color: forecast.expectedTraffic === "High" ? "bg-red-500" : 
               forecast.expectedTraffic === "Normal" ? "bg-blue-500" : "bg-gray-500",
        priority: forecast.expectedTraffic === "High" ? "high" : 
                  forecast.expectedTraffic === "Normal" ? "medium" : "low"
      });
    }
  }

  return events;
}

/**
 * Check if a date is a payday
 */
export function isPayday(date: Date): boolean {
  const day = date.getDate();
  return day === 15 || day === 30 || day === 31;
}

/**
 * Get day name abbreviation
 */
export function getDayName(dayIndex: number): string {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return days[dayIndex];
}

/**
 * Get month name
 */
export function getMonthName(monthIndex: number): string {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return months[monthIndex];
}

