"use client";

import dynamic from "next/dynamic";

const ForestMap = dynamic(() => import("./ForestMap"), {
  ssr: false,
  loading: () => (
    <div className="map">
      <p>Loading forest map…</p>
    </div>
  ),
});

export default ForestMap;
