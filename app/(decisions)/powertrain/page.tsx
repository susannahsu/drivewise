import { DecisionStub } from "../_DecisionStub";

export default function Page() {
  return (
    <DecisionStub
      tag="US-1"
      title="Hybrid, gas, or electric?"
      summary="Given today's electricity and gas prices in your state, your real annual mileage, and no home charging, recommend the cheapest powertrain over your ownership horizon — plus the break-even mileage for the hybrid and EV premiums."
    />
  );
}
