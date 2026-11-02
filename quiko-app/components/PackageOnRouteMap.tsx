"use client";

// Traveller view: where a package's pickup/drop sit relative to the trip's
// route. Mounted on demand — each Mapbox map is a WebGL context, so a list of
// packages must not render one per row up front.
import { useState } from "react";
import type { LatLng } from "@/core/geo";
import { RouteMap } from "@/components/RouteMap";
import { IconMapPin } from "@/components/icons";

export function PackageOnRouteMap({
  tripFrom, tripTo, pickup, drop,
}: { tripFrom: LatLng; tripTo: LatLng; pickup: LatLng; drop: LatLng }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open}
        className="inline-flex items-center gap-1.5 text-[13px] font-bold underline underline-offset-2">
        <IconMapPin width={14} height={14} /> {open ? "Hide map" : "Show on my route"}
      </button>
      {open && (
        <div className="mt-2">
          <RouteMap from={tripFrom} to={tripTo} packageStops={{ pickup, drop }} heightClass="h-52" />
        </div>
      )}
    </div>
  );
}
