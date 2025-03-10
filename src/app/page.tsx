"use client";

import { useState, useEffect } from "react";
import {
  ClockIcon,
  MapPinIcon,
  ArrowPathIcon,
  TruckIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from "@heroicons/react/24/outline";

interface TramInfo {
  arrival: number;
  feasible: boolean;
  walk_time: number;
  wait_at_stop: number | null;
  raw_wait: number;
  station_idx: number;
}

interface TripPlan {
  [key: string]: TramInfo[];
}

interface BestTram {
  stationLine: string;
  info: TramInfo;
}

interface ApiResponse {
  tripPlan: TripPlan;
  bestTram: BestTram | null;
}

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
      const response = await fetch("/api/tram");
      if (!response.ok) {
        throw new Error("API request failed");
      }
      const data = await response.json();
      setResult(data);
    } catch (err) {
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
            {result.bestTram && (
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
                    {result.bestTram.stationLine}
                  </p>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="flex items-center space-x-3">
                      <ClockIcon className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Arrival Time
                        </p>
                        <p className="text-lg font-semibold text-gray-900">
                          {result.bestTram.info.arrival} minutes
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <MapPinIcon className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Walking Time
                        </p>
                        <p className="text-lg font-semibold text-gray-900">
                          {result.bestTram.info.walk_time} minutes
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <TruckIcon className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Wait at Stop
                        </p>
                        <p className="text-lg font-semibold text-gray-900">
                          {result.bestTram.info.wait_at_stop || "N/A"} minutes
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white shadow-lg rounded-2xl p-8 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                All Options
              </h2>
              <div className="space-y-6">
                {Object.entries(result.tripPlan).map(([station, trams]) => (
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
                          className={`p-4 rounded-xl border shadow-sm ${
                            tram.feasible
                              ? "bg-green-50 border-green-100"
                              : "bg-gray-50 border-gray-100"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <TruckIcon className="w-5 h-5 text-blue-600" />
                              <span className="font-medium text-gray-900">
                                {tram.feasible
                                  ? "Feasible Route"
                                  : "Not Feasible"}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <ClockIcon className="w-5 h-5 text-gray-600" />
                              <span className="font-medium text-gray-900">
                                {tram.arrival} min
                              </span>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center space-x-2">
                              <MapPinIcon className="w-4 h-4 text-gray-600" />
                              <div>
                                <p className="text-xs font-medium text-gray-600">
                                  Walking
                                </p>
                                <p className="text-sm font-semibold text-gray-900">
                                  {tram.walk_time} min
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <TruckIcon className="w-4 h-4 text-gray-600" />
                              <div>
                                <p className="text-xs font-medium text-gray-600">
                                  Wait
                                </p>
                                <p className="text-sm font-semibold text-gray-900">
                                  {tram.wait_at_stop || "N/A"} min
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
