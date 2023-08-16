import { ModeToggle } from "@/components/ModeToggle";

export function Navbar() {
  return (
    <div className="flex py-2">
      <div className="container flex justify-between gap-2">
        <div className="flex flex-col">
          <h1 className="inline-block text-2xl font-bold tracking-tight">
            lexical-beautiful-mentions
          </h1>
          <div>
            <a
              className="text-slate-900 underline dark:text-white"
              href="https://github.com/sodenn/lexical-beautiful-mentions"
              target="_blank"
            >
              GitHub
            </a>
          </div>
        </div>
        <ModeToggle />
      </div>
    </div>
  );
}
