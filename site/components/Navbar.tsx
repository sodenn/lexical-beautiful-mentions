import { GithubButton } from "@/components/GithubButton";
import { ModeToggle } from "@/components/ModeToggle";

export function Navbar() {
  return (
    <div className="flex py-2">
      <div className="container flex justify-between gap-2">
        <h1 className="inline-block text-2xl font-bold tracking-tight">
          lexical-beautiful-mentions
        </h1>
        <div className="flex gap-2">
          <GithubButton />
          <ModeToggle />
        </div>
      </div>
    </div>
  );
}
