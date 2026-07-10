"use client";

import { useState, useRef, useEffect } from "react";

interface Option {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "-- Select --",
  className = "",
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.value === value);

  const filtered = search
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(val: string) {
    onChange(val);
    setOpen(false);
    setSearch("");
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div
        onClick={() => {
          setOpen(true);
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
        className="flex items-center cursor-pointer"
      >
        {open ? (
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={selected ? selected.label : placeholder}
            className="w-full rounded px-2 py-1 text-sm focus:outline-none bg-transparent"
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setOpen(false);
                setSearch("");
              }
              if (e.key === "Enter" && filtered.length === 1) {
                handleSelect(filtered[0].value);
              }
            }}
          />
        ) : (
          <span className={`block w-full px-2 py-1 text-sm truncate ${value ? "text-gray-900" : "text-gray-400"}`}>
            {selected ? selected.label : placeholder}
          </span>
        )}
        <svg className="h-4 w-4 text-gray-400 mr-1 shrink-0" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </div>
      {open && (
        <ul className="absolute z-50 mt-1 w-full max-h-48 overflow-auto bg-white border border-gray-300 rounded shadow-lg text-sm">
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-gray-400">No results</li>
          ) : (
            filtered.map((o) => (
              <li
                key={o.value}
                onClick={() => handleSelect(o.value)}
                className={`px-3 py-1.5 cursor-pointer hover:bg-blue-50 ${o.value === value ? "bg-blue-100 font-medium" : ""}`}
              >
                {o.label}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
