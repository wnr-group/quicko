import { PhoneFrame } from "@/components/PhoneFrame";
import { TourCarousel } from "@/components/TourCarousel";

// Public sender-lifecycle walkthrough shown from the splash "Get Started".
export default function TourPage() {
  return (
    <PhoneFrame>
      <TourCarousel />
    </PhoneFrame>
  );
}
