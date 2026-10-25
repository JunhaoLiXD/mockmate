import { MockMateApp } from "@/components/mockmate/MockMateApp";
import { getDemoSample } from "@/lib/content";

export default function Home() {
  return <MockMateApp sample={getDemoSample()} />;
}
