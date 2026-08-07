import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";

interface MatchingFiltersProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply?: (filters: FilterState) => void;
}

interface FilterState {
  genderFilter: string[];
  countryFilter: string;
  languageFilter: string[];
  ageMin: number;
  ageMax: number;
  interestTags: string[];
}

const GENDERS = ["Male", "Female", "Non-binary", "Prefer not to say"];
const COUNTRIES = [
  "United States",
  "Canada",
  "United Kingdom",
  "Australia",
  "India",
  "Germany",
  "France",
  "Japan",
  "Brazil",
  "Mexico",
];
const LANGUAGES = ["English", "Spanish", "French", "German", "Chinese", "Japanese", "Hindi"];
const INTERESTS = [
  "Gaming",
  "Music",
  "Sports",
  "Technology",
  "Art",
  "Travel",
  "Food",
  "Movies",
  "Books",
  "Fitness",
];

export default function MatchingFilters({
  open,
  onOpenChange,
  onApply,
}: MatchingFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    genderFilter: [],
    countryFilter: "",
    languageFilter: [],
    ageMin: 18,
    ageMax: 65,
    interestTags: [],
  });

  const handleGenderToggle = (gender: string) => {
    setFilters((prev) => ({
      ...prev,
      genderFilter: prev.genderFilter.includes(gender)
        ? prev.genderFilter.filter((g) => g !== gender)
        : [...prev.genderFilter, gender],
    }));
  };

  const handleLanguageToggle = (language: string) => {
    setFilters((prev) => ({
      ...prev,
      languageFilter: prev.languageFilter.includes(language)
        ? prev.languageFilter.filter((l) => l !== language)
        : [...prev.languageFilter, language],
    }));
  };

  const handleInterestToggle = (interest: string) => {
    setFilters((prev) => ({
      ...prev,
      interestTags: prev.interestTags.includes(interest)
        ? prev.interestTags.filter((i) => i !== interest)
        : [...prev.interestTags, interest],
    }));
  };

  const handleAgeChange = (values: number[]) => {
    setFilters((prev) => ({
      ...prev,
      ageMin: values[0],
      ageMax: values[1],
    }));
  };

  const handleApply = () => {
    onApply?.(filters);
    onOpenChange(false);
  };

  const handleReset = () => {
    setFilters({
      genderFilter: [],
      countryFilter: "",
      languageFilter: [],
      ageMin: 18,
      ageMax: 65,
      interestTags: [],
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-slate-900 border-purple-500/20">
        <DialogHeader>
          <DialogTitle className="text-white">Matching Preferences</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 max-h-96 overflow-y-auto">
          {/* Gender Filter */}
          <div className="space-y-3">
            <Label className="text-gray-300 font-semibold">Gender</Label>
            <div className="space-y-2">
              {GENDERS.map((gender) => (
                <div key={gender} className="flex items-center gap-2">
                  <Checkbox
                    id={`gender-${gender}`}
                    checked={filters.genderFilter.includes(gender)}
                    onCheckedChange={() => handleGenderToggle(gender)}
                    className="border-purple-500/30"
                  />
                  <Label htmlFor={`gender-${gender}`} className="text-gray-300 cursor-pointer">
                    {gender}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Country Filter */}
          <div className="space-y-3">
            <Label htmlFor="country" className="text-gray-300 font-semibold">
              Country
            </Label>
            <Select value={filters.countryFilter} onValueChange={(value) =>
              setFilters((prev) => ({ ...prev, countryFilter: value }))
            }>
              <SelectTrigger className="bg-slate-800/50 border-purple-500/30 text-white">
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-purple-500/30">
                <SelectItem value="">All Countries</SelectItem>
                {COUNTRIES.map((country) => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Language Filter */}
          <div className="space-y-3">
            <Label className="text-gray-300 font-semibold">Languages</Label>
            <div className="space-y-2">
              {LANGUAGES.map((language) => (
                <div key={language} className="flex items-center gap-2">
                  <Checkbox
                    id={`language-${language}`}
                    checked={filters.languageFilter.includes(language)}
                    onCheckedChange={() => handleLanguageToggle(language)}
                    className="border-purple-500/30"
                  />
                  <Label htmlFor={`language-${language}`} className="text-gray-300 cursor-pointer">
                    {language}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Age Range */}
          <div className="space-y-3">
            <Label className="text-gray-300 font-semibold">
              Age Range: {filters.ageMin} - {filters.ageMax}
            </Label>
            <Slider
              min={18}
              max={65}
              step={1}
              value={[filters.ageMin, filters.ageMax]}
              onValueChange={handleAgeChange}
              className="w-full"
            />
          </div>

          {/* Interest Tags */}
          <div className="space-y-3">
            <Label className="text-gray-300 font-semibold">Interests</Label>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map((interest) => (
                <button
                  key={interest}
                  onClick={() => handleInterestToggle(interest)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                    filters.interestTags.includes(interest)
                      ? "bg-purple-600 text-white"
                      : "bg-slate-800 text-gray-300 hover:bg-slate-700"
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            onClick={handleReset}
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-slate-800"
          >
            Reset
          </Button>
          <Button
            type="button"
            onClick={handleApply}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
          >
            Apply Filters
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
