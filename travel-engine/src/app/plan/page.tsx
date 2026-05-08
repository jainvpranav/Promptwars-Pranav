import { Suspense } from "react";
import PlanClient from "./PlanClient";

function PlanLoading() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
      }}
    >
      <div className="spinner" />
    </div>
  );
}

export default function PlanPage() {
  return (
    <Suspense fallback={<PlanLoading />}>
      <PlanClient />
    </Suspense>
  );
}
