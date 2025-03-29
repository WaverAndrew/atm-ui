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
      color: "bg-emerald-500",
      icon: UserIcon,
      description: `Time to walk from your location to the station (${tram.walk_time} min)`,
    },
  ];

  if (tram.wait_at_stop !== null) {
    segments.push({
      label: "Wait",
      value: tram.wait_at_stop,
      color: "bg-amber-500",
      icon: ClockIcon,
      description: `Waiting at the stop (${tram.wait_at_stop.toFixed(
        1
      )} min) - Tram arrives in ${tram.arrival} min`,
    });
  }

  segments.push({
    label: "Travel",
    value: tram.total_travel_time,
    color: "bg-indigo-500",
    icon: TruckIcon,
    description: `Riding the tram (${tram.total_travel_time.toFixed(1)} min)`,
  });

  segments.push({
    label: "Final Walk",
    value: tram.final_walking_time,
    color: "bg-emerald-500",
    icon: UserIcon,
    description: `Time to walk from the station to your destination (${tram.final_walking_time} min)`,
  });

  return segments;
};

const Timeline = ({
  segments,
  totalTime,
  arrival,
}: {
  segments: TimeSegment[];
  totalTime: number;
  arrival: number;
}) => {
  const [hoveredSegment, setHoveredSegment] = useState<number | null>(null);

  return (
    <div className="relative pt-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex flex-wrap gap-2">
          {segments.map((segment, index) => (
            <div
              key={index}
              className="flex items-center group cursor-pointer"
              onMouseEnter={() => setHoveredSegment(index)}
              onMouseLeave={() => setHoveredSegment(null)}
            >
              <div
                className={`w-3 h-3 rounded-full ${segment.color} mr-1 transition-transform duration-200 group-hover:scale-125`}
              />
              <span className="text-xs text-gray-600 group-hover:text-gray-900 transition-colors duration-200">
                {segment.label}
              </span>
            </div>
          ))}
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 bg-blue-50 px-2 py-1 rounded-full">
            <ClockIcon className="w-4 h-4 text-blue-500" />
            <span className="text-xs text-blue-600">
              Arrives in {arrival} min
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <BoltIcon className="w-4 h-4 text-yellow-500 animate-pulse" />
            <span className="text-sm font-medium text-gray-900">
              {totalTime.toFixed(1)} min
            </span>
          </div>
        </div>
      </div>
      <div className="h-8 bg-gray-100 rounded-full overflow-hidden relative">
        {segments.map((segment, index) => (
          <div
            key={index}
            className={`absolute h-full ${
              segment.color
            } transition-all duration-500 ease-out transform origin-left ${
              hoveredSegment === index ? "brightness-110" : ""
            }`}
            style={{
              width: `${(segment.value / totalTime) * 100}%`,
              left: `${segments
                .slice(0, index)
                .reduce(
                  (acc, seg) => acc + (seg.value / totalTime) * 100,
                  0
                )}%`,
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center space-x-1">
              {segment.icon && (
                <div className="w-4 h-4 text-white">
                  {segment.icon === UserIcon && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                      />
                    </svg>
                  )}
                  {segment.icon === ClockIcon && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  )}
                  {segment.icon === TruckIcon && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
                      />
                    </svg>
                  )}
                </div>
              )}
              <span className="text-xs font-medium text-white">
                {segment.value.toFixed(1)}m
              </span>
            </div>
          </div>
        ))}
      </div>
      {hoveredSegment !== null && (
        <div className="absolute z-10 bg-white shadow-lg rounded-lg p-3 mt-2 transform -translate-x-1/2 left-1/2">
          <div className="flex items-center space-x-2">
            <div
              className={`w-4 h-4 rounded-full ${segments[hoveredSegment].color}`}
            />
            <div>
              <p className="text-sm font-medium text-gray-900">
                {segments[hoveredSegment].label}
              </p>
              <p className="text-xs text-gray-500">
                {segments[hoveredSegment].description}
              </p>
              <p className="text-xs font-medium text-gray-700">
                {segments[hoveredSegment].value.toFixed(1)} minutes
              </p>
            </div>
          </div>
        </div>
      )}
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
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Tram Finder</h1>
          <p className="text-gray-700 text-lg">
            Find the fastest tram to your destination
          </p>
        </div>

        <div className="flex justify-center mb-12">
          <button
            onClick={testApi}
            disabled={loading}
            className="group relative inline-flex items-center justify-center px-8 py-3 text-lg font-medium text-white bg-blue-600 rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
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
          <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center shadow-sm">
            <svg
              className="w-5 h-5 mr-2"
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
          <div className="mt-8 space-y-8">
            {result.best_tram && (
              <div className="bg-white shadow-lg rounded-2xl p-8 border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Best Option
                  </h2>
                  <div className="flex items-center space-x-2 text-green-600 bg-green-50 px-3 py-1 rounded-full">
                    <ArrowTrendingUpIcon className="w-5 h-5" />
                    <span className="font-medium">Fastest Route</span>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 shadow-sm">
                  <p className="text-lg font-semibold text-gray-900 mb-4">
                    {result.best_tram.station_line}
                  </p>
                  <Timeline
                    segments={getTimeSegments(result.best_tram.tram)}
                    totalTime={result.best_tram.tram.total_time}
                    arrival={result.best_tram.tram.arrival}
                  />
                  <div className="grid grid-cols-2 gap-6 mt-6">
                    <div className="flex items-center space-x-3">
                      <ClockIcon className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Total Time
                        </p>
                        <p className="text-lg font-semibold text-gray-900">
                          {result.best_tram.tram.total_time.toFixed(1)} minutes
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <MapPinIcon className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Walking Time
                        </p>
                        <div className="flex flex-col">
                          <p className="text-sm text-gray-600">
                            To station: {result.best_tram.tram.walk_time} min
                          </p>
                          <p className="text-sm text-gray-600">
                            From station:{" "}
                            {result.best_tram.tram.final_walking_time} min
                          </p>
                          <p className="text-lg font-semibold text-gray-900">
                            Total:{" "}
                            {result.best_tram.tram.walk_time +
                              result.best_tram.tram.final_walking_time}{" "}
                            min
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <TruckIcon className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Travel Time
                        </p>
                        <p className="text-lg font-semibold text-gray-900">
                          {result.best_tram.tram.total_travel_time.toFixed(1)}{" "}
                          minutes
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <ClockIcon className="w-5 h-5 text-orange-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Wait Time
                        </p>
                        <p className="text-lg font-semibold text-gray-900">
                          {result.best_tram.tram.wait_at_stop?.toFixed(1) ||
                            "N/A"}{" "}
                          minutes
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white shadow-lg rounded-2xl p-8 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  All Options
                </h2>
                <div className="text-sm text-gray-500">
                  Execution time: {result.execution_time.toFixed(2)}s
                </div>
              </div>
              <div className="space-y-6">
                {Object.entries(result.trip_plan).map(([station, trams]) => (
                  <div
                    key={station}
                    className="border-b border-gray-100 last:border-0 pb-6 last:pb-0"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      {station}
                    </h3>
                    <div className="grid gap-4">
                      {trams.map((tram, index) => (
                        <div
                          key={index}
                          className={`p-4 rounded-xl border shadow-sm transition-all duration-300 hover:shadow-md ${
                            tram.feasible
                              ? "bg-green-50 border-green-100 hover:bg-green-100"
                              : "bg-gray-50 border-gray-100 hover:bg-gray-100"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <div
                                className={`p-1 rounded-full ${
                                  tram.feasible ? "bg-green-100" : "bg-gray-100"
                                }`}
                              >
                                <TruckIcon
                                  className={`w-5 h-5 ${
                                    tram.feasible
                                      ? "text-green-600"
                                      : "text-gray-600"
                                  }`}
                                />
                              </div>
                              <span className="font-medium text-gray-900">
                                {tram.feasible
                                  ? "Feasible Route"
                                  : "Not Feasible"}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2 bg-white px-3 py-1 rounded-full shadow-sm">
                              <ClockIcon className="w-5 h-5 text-blue-600" />
                              <span className="font-medium text-gray-900">
                                Total: {tram.total_time.toFixed(1)} min
                              </span>
                            </div>
                          </div>
                          <Timeline
                            segments={getTimeSegments(tram)}
                            totalTime={tram.total_time}
                            arrival={tram.arrival}
                          />
                          <div className="grid grid-cols-2 gap-4 mt-4">
                            <div className="flex items-center space-x-2">
                              <MapPinIcon className="w-4 h-4 text-gray-600" />
                              <div>
                                <p className="text-xs font-medium text-gray-600">
                                  Walking
                                </p>
                                <div className="flex flex-col">
                                  <p className="text-xs text-gray-600">
                                    To: {tram.walk_time} min
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    From: {tram.final_walking_time} min
                                  </p>
                                  <p className="text-sm font-semibold text-gray-900">
                                    Total:{" "}
                                    {tram.walk_time + tram.final_walking_time}{" "}
                                    min
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <TruckIcon className="w-4 h-4 text-gray-600" />
                              <div>
                                <p className="text-xs font-medium text-gray-600">
                                  Travel
                                </p>
                                <p className="text-sm font-semibold text-gray-900">
                                  {tram.total_travel_time.toFixed(1)} min
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <ClockIcon className="w-4 h-4 text-gray-600" />
                              <div>
                                <p className="text-xs font-medium text-gray-600">
                                  Wait
                                </p>
                                <p className="text-sm font-semibold text-gray-900">
                                  {tram.wait_at_stop?.toFixed(1) || "N/A"} min
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <ArrowTrendingUpIcon className="w-4 h-4 text-gray-600" />
                              <div>
                                <p className="text-xs font-medium text-gray-600">
                                  Avg Speed
                                </p>
                                <p className="text-sm font-semibold text-gray-900">
                                  {tram.avg_travel_time.toFixed(2)} min/stop
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
