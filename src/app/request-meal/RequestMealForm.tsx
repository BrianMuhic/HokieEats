"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DINING_LOCATIONS } from "@/lib/dining-config";

export default function RequestMealForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [diningHall, setDiningHall] = useState("");
  const [restaurant, setRestaurant] = useState("");
  const [mealDescription, setMealDescription] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedLocation = DINING_LOCATIONS.find(
    (d) => d.id === diningHall || d.name === diningHall
  ) ?? DINING_LOCATIONS.find((d) => d.id === diningHall);
  const restaurants = selectedLocation?.restaurants ?? [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const location = DINING_LOCATIONS.find((d) => d.id === diningHall || d.name === diningHall);
    if (!location) {
      setError("Please select a dining hall.");
      setLoading(false);
      return;
    }
    if (!restaurant || !restaurants.includes(restaurant)) {
      setError("Please select a restaurant.");
      setLoading(false);
      return;
    }
    const desc = mealDescription.trim();
    if (!desc || desc.length < 10) {
      setError("Please describe your meal (at least 10 characters).");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/meal-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          diningHall: location.name,
          restaurant,
          mealDescription: desc,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to create request.");
        setLoading(false);
        return;
      }

      router.push(`/pay/${data.id}`);
      router.refresh();
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-2">
          Dining Hall
        </label>
        <select
          value={diningHall}
          onChange={(e) => {
            setDiningHall(e.target.value);
            setRestaurant("");
          }}
          className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-vt-maroon focus:border-transparent"
          required
        >
          <option value="">Select a dining hall</option>
          {DINING_LOCATIONS.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      {restaurants.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">
            Restaurant
          </label>
          <select
            value={restaurant}
            onChange={(e) => setRestaurant(e.target.value)}
            className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-vt-maroon focus:border-transparent"
            required
          >
            <option value="">Select a restaurant</option>
            {restaurants.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-2">
          Describe your meal
        </label>
        <textarea
          value={mealDescription}
          onChange={(e) => setMealDescription(e.target.value)}
          placeholder="e.g., Chicken sandwich with waffle fries from Chick-fil-A, no pickle"
          rows={4}
          className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-vt-maroon focus:border-transparent"
          required
        />
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-vt-maroon hover:bg-vt-burgundy text-white py-3 rounded-lg font-medium disabled:opacity-50"
      >
        {loading ? "Submitting…" : "Request Meal ($6)"}
      </button>
    </form>
  );
}
