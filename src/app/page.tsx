"use client";

import { useState, useEffect, Fragment } from "react";
import {
  ClockIcon,
  MapPinIcon,
  ArrowPathIcon,
  TruckIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  StopIcon,
  UserIcon,
  BoltIcon,
  ArrowRightCircleIcon,
} from "@heroicons/react/24/outline";

interface TramInfo {
  arrival: number;
  feasible: boolean;
  walk_time: number;
  wait_at_stop: number | null;
  raw_wait: number;
  station_idx: number;
  avg_travel_time: number;
  total_travel_time: number;
  final_walking_time: number;
  total_time: number;
}

interface TripPlan {
  [key: string]: TramInfo[];
}

interface BestTram {
  station_line: string;
  tram: TramInfo;
}

interface ApiResponse {
  trip_plan: TripPlan;
  best_tram: BestTram;
  execution_time: number;
}

interface TimeSegment {
  label: string;
  value: number;
  color: string;
  icon?: React.ElementType;
  description?: string;
}

const getTimeSegments = (tram: TramInfo): TimeSegment[] => {
  const segments: TimeSegment[] = [
    {
      label: "Initial Walk",
      value: tram.walk_time,
      color: "bg-gray-600",
      icon: UserIcon,
    },
  ];

  if (tram.wait_at_stop !== null) {
    segments.push({
      label: "Wait",
      value: tram.wait_at_stop,
      color: "bg-amber-500",
      icon: ClockIcon,
    });
  }

  segments.push({
    label: "Travel",
    value: tram.total_travel_time,
    color: "bg-violet-500",
    icon: TruckIcon,
  });

  segments.push({
    label: "Final Walk",
    value: tram.final_walking_time,
    color: "bg-gray-600",
    icon: UserIcon,
  });

  return segments;
};

const Timeline = ({
  segments,
  totalTime,
  arrival,
  tram,
}: {
  segments: TimeSegment[];
  totalTime: number;
  arrival: number;
  tram: TramInfo;
}) => {
  return (
    <div className="space-y-3">
      {/* Timeline segments */}
      <div className="flex justify-center items-center">
        <div className="flex items-center gap-1.5">
          {segments.map((segment, index) => (
            <Fragment key={`segment-${index}`}>
              <div className="flex items-center whitespace-nowrap">
                <div className="flex items-center">
                  {segment.icon && (
                    <segment.icon
                      className={`w-3.5 h-3.5 ${segment.color.replace(
                        "bg-",
                        "text-"
                      )} stroke-[1.5] opacity-90`}
                    />
                  )}
                  <span
                    className={`ml-1 text-xs font-medium ${segment.color.replace(
                      "bg-",
                      "text-"
                    )} opacity-90`}
                  >
                    {Math.round(segment.value)}m
                  </span>
                </div>
              </div>
              {index < segments.length - 1 && (
                <div className="w-4 h-px border-t border-dashed border-gray-300" />
              )}
            </Fragment>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="flex flex-row gap-1.5 w-full">
        <div className="flex-1 flex flex-col items-center justify-center bg-white/50 rounded-xl px-2 py-1.5">
          <div className="flex items-center space-x-1 whitespace-nowrap">
            <BoltIcon className="w-3.5 h-3.5 text-violet-500 stroke-[1.5] opacity-90" />
            <span className="text-sm font-semibold text-gray-900">
              {Math.round(totalTime)}m
            </span>
          </div>
          <span className="text-[10px] text-gray-500 mt-0.5">Total</span>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center bg-white/50 rounded-xl px-2 py-1.5">
          <div className="flex items-center space-x-1 whitespace-nowrap">
            <ArrowRightCircleIcon className="w-3.5 h-3.5 text-blue-500 stroke-[1.5] opacity-90" />
            <span className="text-sm font-semibold text-blue-500">
              {Math.round(arrival)}m
            </span>
          </div>
          <span className="text-[10px] text-gray-500 mt-0.5">Arrival</span>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center bg-white/50 rounded-xl px-2 py-1.5">
          <div className="flex items-center space-x-1 whitespace-nowrap">
            <ClockIcon className="w-3.5 h-3.5 text-amber-500 stroke-[1.5] opacity-90" />
            <span className="text-sm font-semibold text-gray-900">
              {Math.round(tram.wait_at_stop || 0)}m
            </span>
          </div>
          <span className="text-[10px] text-gray-500 mt-0.5">Wait</span>
        </div>
      </div>
    </div>
  );
};

const loadingMessages = [
  "Fetching real-time tram data...",
  "Computing optimal routes...",
  "Calculating walking times...",
  "Analyzing wait times...",
  "Finding the best option...",
];

function formatTramTitle(title: string) {
  // Extract route, tram number, and direction from the title
  const match = title.match(
    /(.*?) \((Tram|Bus) (\d+) (.*?), Direction (\d+)\)/
  );
  if (!match)
    return { route: title, type: "", number: "", fullRoute: "", direction: "" };

  return {
    route: match[1],
    type: match[2],
    number: match[3],
    fullRoute: match[4],
    direction: match[5],
  };
}

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setLoadingMessage((prev) => (prev + 1) % loadingMessages.length);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const testApi = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log(
        "Making API request to:",
        "https://dhlpmqvmd6lvc6m6tgij7jfgcq0fiypa.lambda-url.eu-west-3.on.aws/"
      );
      const requestBody = {
        start_candidates: {
          "15": {
            direction: "0",
            target_station_code: "15371",
            walking_time: 8,
          },
          "3": {
            direction: "0",
            target_station_code: "11139",
            walking_time: 4,
          },
          "59": {
            direction: "0",
            target_station_code: "11154",
            walking_time: 8,
          },
        },
        end_candidates: {
          "15": {
            direction: "0",
            target_station_code: "15379",
            walking_time: 4,
          },
          "3": {
            direction: "0",
            target_station_code: "11443",
            walking_time: 7,
          },
          "59": {
            direction: "0",
            target_station_code: "11459",
            walking_time: 3,
          },
        },
      };
      console.log("Request body:", JSON.stringify(requestBody, null, 2));

      const response = await fetch(
        "https://dhlpmqvmd6lvc6m6tgij7jfgcq0fiypa.lambda-url.eu-west-3.on.aws/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      console.log("Response status:", response.status);
      console.log(
        "Response headers:",
        Object.fromEntries(response.headers.entries())
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error(
          `API request failed with status ${response.status}: ${errorText}`
        );
      }

      const data: ApiResponse = await response.json();
      console.log("API response:", data);
      setResult(data);
    } catch (err) {
      console.error("API call failed:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f5f5f7] p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 mb-2 tracking-tight">
            Tram Finder
          </h1>
          <p className="text-gray-500 text-base sm:text-lg">
            Find the fastest tram to your destination
          </p>
        </div>

        {!result && (
          <div className="flex justify-center items-center min-h-[50vh]">
            <button
              onClick={testApi}
              disabled={loading}
              className="relative flex items-center justify-center w-32 h-32 sm:w-40 sm:h-40 text-white bg-gradient-to-br from-blue-500 to-blue-600 rounded-full hover:from-blue-600 hover:to-blue-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-[0_12px_24px_rgba(37,99,235,0.2)] hover:shadow-[0_16px_32px_rgba(37,99,235,0.25)] hover:scale-105 active:scale-95 group"
            >
              {loading ? (
                <div className="flex flex-col items-center space-y-3">
                  <ArrowPathIcon className="w-8 h-8 sm:w-10 sm:h-10 animate-spin" />
                  <span className="text-xs sm:text-sm text-center px-4">
                    {loadingMessages[loadingMessage]}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-2">
                  <TruckIcon className="w-10 h-10 sm:w-12 sm:h-12 group-hover:scale-110 transition-transform" />
                  <span className="text-sm sm:text-base font-medium">
                    Find Tram
                  </span>
                </div>
              )}
            </button>
          </div>
        )}

        {error && (
          <div className="mt-6 p-4 sm:p-5 bg-red-50 text-red-700 rounded-2xl flex items-center shadow-[0_2px_8px_rgba(0,0,0,0.05)] text-base">
            <svg
              className="w-6 h-6 mr-3 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {error}
          </div>
        )}

        {result && (
          <div className="mt-8 sm:mt-12 space-y-8">
            <div className="flex justify-end mb-4">
              <button
                onClick={testApi}
                disabled={loading}
                className="inline-flex items-center justify-center p-3 text-blue-600 bg-blue-50 rounded-full hover:bg-blue-100 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow hover:scale-105 active:scale-95"
                aria-label="Refresh tram times"
              >
                <ArrowPathIcon
                  className={`w-6 h-6 ${loading ? "animate-spin" : ""}`}
                />
              </button>
            </div>
            {result.best_tram && (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Best Option
                    </h2>
                    <div className="flex items-center space-x-1 bg-green-50 px-2 py-0.5 rounded-full">
                      <ArrowTrendingUpIcon className="w-3.5 h-3.5 text-green-600" />
                      <span className="text-xs font-medium text-green-600">
                        Fastest
                      </span>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-blue-50/90 via-white/50 to-indigo-50/90 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-blue-100/30 shadow-sm">
                  {(() => {
                    const { type, number, route, fullRoute } = formatTramTitle(
                      result.best_tram.station_line
                    );
                    return (
                      <div className="space-y-3 mb-6">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <span className="text-base sm:text-lg font-semibold text-blue-600">
                            {type} {number}
                          </span>
                          <span className="text-sm text-gray-500">
                            {fullRoute}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-900">
                          {route}
                        </p>
                      </div>
                    );
                  })()}
                  <Timeline
                    segments={getTimeSegments(result.best_tram.tram)}
                    totalTime={result.best_tram.tram.total_time}
                    arrival={result.best_tram.tram.arrival}
                    tram={result.best_tram.tram}
                  />
                </div>
              </div>
            )}

            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="bg-gray-900 rounded-full p-1.5">
                    <MapPinIcon className="w-4 h-4 text-white" />
                  </div>
                  <h2 className="text-lg font-medium text-gray-900">
                    All Options
                  </h2>
                </div>
              </div>
              <div className="space-y-6">
                {Object.entries(result.trip_plan).map(([station, trams]) => {
                  const { type, number, route, fullRoute } =
                    formatTramTitle(station);
                  const feasibleTrams = trams.filter((t) => t.feasible);
                  const nonFeasibleTrams = trams.filter((t) => !t.feasible);

                  return (
                    <div
                      key={station}
                      className="border-b border-gray-100/50 last:border-0 pb-6 last:pb-0"
                    >
                      <div className="space-y-3 mb-6">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <span className="text-base sm:text-lg font-semibold text-blue-600">
                            {type} {number}
                          </span>
                          <span className="text-sm text-gray-500">
                            {fullRoute}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-900">
                          {route}
                        </p>
                      </div>

                      {feasibleTrams.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-medium text-green-600 flex items-center space-x-1.5">
                            <div className="w-1 h-1 bg-green-600 rounded-full"></div>
                            <span>Available Options</span>
                          </h4>
                          <div className="grid gap-2">
                            {feasibleTrams.map((tram, index) => (
                              <div
                                key={index}
                                className="bg-gradient-to-br from-green-50/90 via-white/50 to-blue-50/90 backdrop-blur-sm rounded-xl p-3 border border-green-100/30 shadow-sm hover:shadow-md transition-all duration-200"
                              >
                                <Timeline
                                  segments={getTimeSegments(tram)}
                                  totalTime={tram.total_time}
                                  arrival={tram.arrival}
                                  tram={tram}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {nonFeasibleTrams.length > 0 && (
                        <div className="space-y-2 mt-3">
                          <h4 className="text-xs font-medium text-gray-500 flex items-center space-x-1.5">
                            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                            <span>Missed Options</span>
                          </h4>
                          <div className="grid gap-2">
                            {nonFeasibleTrams.map((tram, index) => (
                              <div
                                key={index}
                                className="bg-gradient-to-br from-gray-50/90 via-white/50 to-gray-50/90 backdrop-blur-sm rounded-xl p-3 border border-gray-200/30 shadow-sm hover:shadow-md transition-all duration-200"
                              >
                                <Timeline
                                  segments={getTimeSegments(tram)}
                                  totalTime={tram.total_time}
                                  arrival={tram.arrival}
                                  tram={tram}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
