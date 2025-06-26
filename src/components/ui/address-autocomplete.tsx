"use client";

import { Loader } from "@googlemaps/js-api-loader";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";

interface AddressAutocompleteProps {
  id: string;
  label: string;
  value: string | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

interface PlacePrediction {
  description: string;
  place_id: string;
  text: {
    text: string;
  };
}

// Memoized cache for autocomplete results
const autocompleteCache = new Map<string, PlacePrediction[]>();

export function AddressAutocomplete({
  id,
  label,
  value,
  onChange,
  placeholder,
  required = false,
  className,
}: Readonly<AddressAutocompleteProps>) {
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Initialize Google Maps API
  useEffect(() => {
    const initGoogleMaps = async () => {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

      if (apiKey === "") {
        console.warn("Google Maps API key not found. Address autocomplete will be disabled.");
        return;
      }

      try {
        const loader = new Loader({
          apiKey,
          version: "weekly",
          libraries: ["places"],
        });

        await loader.load();
      } catch (error) {
        console.error("Failed to load Google Maps API:", error);
      }
    };

    initGoogleMaps();
  }, []);

  // Debounced search function
  const debouncedSearch = useMemo(() => {
    let timeoutId: NodeJS.Timeout;

    return (input: string) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (input.length >= 3) {
          performSearch(input);
        } else {
          setPredictions([]);
          setShowDropdown(false);
        }
      }, 300);
    };
  }, []);

  // Perform the actual search
  const performSearch = useCallback(async (input: string) => {
    // Check cache first
    const cacheKey = input.toLowerCase().trim();
    if (autocompleteCache.has(cacheKey)) {
      setPredictions(autocompleteCache.get(cacheKey) ?? []);
      setShowDropdown(true);
      return;
    }

    setIsLoading(true);

    try {
      const request = {
        input,
        includedPrimaryTypes: ["geocode"],
        includedRegionCodes: ["us"],
      };

      // NEW API: Promise-based
      // @ts-ignore
      const { suggestions } =
        await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions(request);
      // Each suggestion has a .placePrediction property
      const predictions = suggestions.map((s: any) => s.placePrediction);
      // Cache the results
      autocompleteCache.set(cacheKey, predictions);
      setPredictions(predictions);
      setShowDropdown(true);
      setSelectedIndex(-1);
    } catch (error) {
      console.error("Error fetching predictions:", error);
      setPredictions([]);
      setShowDropdown(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle input change
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      onChange(newValue);
      setShowDropdown(false);
      setSelectedIndex(-1);

      if (newValue.length >= 3) {
        debouncedSearch(newValue);
      } else {
        setPredictions([]);
      }
    },
    [onChange, debouncedSearch]
  );

  // Handle key navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!showDropdown || predictions.length === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => (prev < predictions.length - 1 ? prev + 1 : prev));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;
        case "Enter":
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < predictions.length) {
            selectPrediction(predictions[selectedIndex]);
          }
          break;
        case "Escape":
          setShowDropdown(false);
          setSelectedIndex(-1);
          inputRef.current?.blur();
          break;
      }
    },
    [showDropdown, predictions, selectedIndex]
  );

  // Select a prediction
  const selectPrediction = useCallback(
    (prediction: PlacePrediction) => {
      onChange(prediction.text.text);
      setShowDropdown(false);
      setSelectedIndex(-1);
      setPredictions([]);
    },
    [onChange]
  );

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current !== null &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current !== null &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className ?? ""}`}>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          ref={inputRef}
          id={id}
          type="text"
          value={value ?? ""}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (predictions.length > 0) {
              setShowDropdown(true);
            }
          }}
          placeholder={placeholder}
          required={required}
          className="pr-8"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
          </div>
        )}
      </div>

      {showDropdown && predictions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
        >
          {predictions.map((prediction, index) => (
            <button
              key={`${index}-${prediction.description}`}
              type="button"
              className={`w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 ${
                index === selectedIndex
                  ? "bg-blue-50 text-blue-900 dark:bg-blue-900/20 dark:text-blue-100"
                  : "text-gray-900 dark:text-gray-100"
              }`}
              onClick={() => selectPrediction(prediction)}
            >
              <div className="font-medium">{prediction.text.text}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {prediction.description}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
