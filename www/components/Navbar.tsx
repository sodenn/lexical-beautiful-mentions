import { GithubButton } from "@/components/GithubButton";
import { ModeToggle } from "@/components/ModeToggle";

export function Navbar() {
  return (
    <div className="flex py-2">
      <div className="container flex items-center justify-between gap-2 px-4 sm:mx-auto">
        <h1 className="inline-block text-lg font-bold tracking-tight sm:text-2xl">
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
