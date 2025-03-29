"use client";

import { useState, useEffect } from "react";
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
    <div className="space-y-6">
      <div className="flex items-center space-x-3 py-4">
        {segments.map((segment, index) => (
          <>
            <div key={`segment-${index}`} className="flex items-center">
              <div className="flex items-center">
                {segment.icon && (
                  <segment.icon
                    className={`w-6 h-6 ${segment.color.replace(
                      "bg-",
                      "text-"
                    )} stroke-[1] opacity-90`}
                  />
                )}
                <span
                  className={`ml-2 text-lg font-medium ${segment.color.replace(
                    "bg-",
                    "text-"
                  )} opacity-90`}
                >
                  {Math.round(segment.value)} min
                </span>
              </div>
            </div>
            {index < segments.length - 1 && (
              <div className="w-6 h-0.5 bg-gray-200" />
            )}
          </>
        ))}
      </div>
      <div className="flex items-center space-x-12">
        <div className="flex flex-col items-center">
          <div className="flex items-center space-x-2">
            <BoltIcon className="w-6 h-6 text-violet-500 stroke-[1] opacity-90" />
            <span className="text-2xl font-semibold text-gray-900">
              {Math.round(totalTime)} min
            </span>
          </div>
          <span className="text-sm text-gray-500 mt-1">Total Journey</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="flex items-center space-x-2">
            <ClockIcon className="w-6 h-6 text-blue-500 stroke-[1] opacity-90" />
            <span className="text-2xl font-semibold text-blue-500">
              Arrives in {Math.round(arrival)} min
            </span>
          </div>
          <span className="text-sm text-gray-500 mt-1">Arrival Time</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="flex items-center space-x-2">
            <StopIcon className="w-6 h-6 text-amber-500 stroke-[1] opacity-90" />
            <span className="text-2xl font-semibold text-gray-900">
              {Math.round(tram.wait_at_stop || 0)} min wait
            </span>
          </div>
          <span className="text-sm text-gray-500 mt-1">Wait Time</span>
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
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Tram Finder
          </h1>
          <p className="text-gray-700 text-base sm:text-lg">
            Find the fastest tram to your destination
          </p>
        </div>

        <div className="flex justify-center mb-8 sm:mb-12">
          <button
            onClick={testApi}
            disabled={loading}
            className="w-full sm:w-auto group relative inline-flex items-center justify-center px-6 sm:px-8 py-3 text-base sm:text-lg font-medium text-white bg-blue-600 rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <ArrowPathIcon className="w-5 h-5 animate-spin" />
                <span>{loadingMessages[loadingMessage]}</span>
              </div>
            ) : (
              <>
                <TruckIcon className="w-5 h-5 mr-2" />
                Find Best Tram
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 sm:p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center shadow-sm text-sm sm:text-base">
            <svg
              className="w-5 h-5 mr-2 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {error}
          </div>
        )}

        {result && (
          <div className="mt-6 sm:mt-8 space-y-6 sm:space-y-8">
            {result.best_tram && (
              <div className="bg-white shadow-lg rounded-2xl p-4 sm:p-8 border border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 space-y-2 sm:space-y-0">
                  <div className="flex items-center space-x-3">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                      Best Option
                    </h2>
                    <div className="flex items-center space-x-2 text-green-600 bg-green-50 px-3 py-1 rounded-full">
                      <ArrowTrendingUpIcon className="w-5 h-5" />
                      <span className="font-medium">Fastest Route</span>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 sm:p-6 shadow-sm">
                  {(() => {
                    const { type, number, route, fullRoute } = formatTramTitle(
                      result.best_tram.station_line
                    );
                    return (
                      <div className="space-y-3 mb-6">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-1 rounded-full">
                            <TruckIcon className="w-5 h-5" />
                            <span className="font-medium">
                              {type} {number}
                            </span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {fullRoute}
                          </span>
                        </div>
                        <p className="text-lg font-medium text-gray-900">
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

            <div className="bg-white shadow-lg rounded-2xl p-4 sm:p-8 border border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 space-y-2 sm:space-y-0">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                  All Options
                </h2>
                <div className="text-sm text-gray-500">
                  Execution time: {result.execution_time.toFixed(2)}s
                </div>
              </div>
              <div className="space-y-8">
                {Object.entries(result.trip_plan).map(([station, trams]) => {
                  const { type, number, route, fullRoute } =
                    formatTramTitle(station);
                  const feasibleTrams = trams.filter((t) => t.feasible);
                  const nonFeasibleTrams = trams.filter((t) => !t.feasible);

                  return (
                    <div
                      key={station}
                      className="border-b border-gray-100 last:border-0 pb-8 last:pb-0"
                    >
                      <div className="space-y-3 mb-6">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2 bg-gray-900 text-white px-3 py-1 rounded-full">
                            <TruckIcon className="w-5 h-5" />
                            <span className="font-medium">
                              {type} {number}
                            </span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {fullRoute}
                          </span>
                        </div>
                        <p className="text-lg font-medium text-gray-900">
                          {route}
                        </p>
                      </div>

                      {feasibleTrams.length > 0 && (
                        <div className="space-y-4">
                          <h4 className="text-sm font-medium text-green-600 flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                            <span>Available Options</span>
                          </h4>
                          <div className="grid gap-4">
                            {feasibleTrams.map((tram, index) => (
                              <div
                                key={index}
                                className="bg-green-50 rounded-xl p-4 border border-green-100"
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
                        <div className="space-y-4 mt-4">
                          <h4 className="text-sm font-medium text-gray-500 flex items-center space-x-2">
                            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                            <span>Missed Options</span>
                          </h4>
                          <div className="grid gap-4">
                            {nonFeasibleTrams.map((tram, index) => (
                              <div
                                key={index}
                                className="bg-gray-50 rounded-xl p-4 border border-gray-100"
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
