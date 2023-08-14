import { NextPage } from "next";
import dynamic from "next/dynamic";
import Editor from "./Editor";

interface HomeProps {}

const ConfigurationProvider = dynamic(() => import("./ConfigurationProvider"), {
  ssr: false,
});

const Home: NextPage<HomeProps> = () => {
  return (
    <div className="container mx-auto px-3 py-4">
      <div className="mb-4 mt-3 flex flex-col justify-between sm:flex-row sm:items-end">
        <h1 className="inline-block text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-200">
          lexical-beautiful-mentions
        </h1>
        <a
          className="text-slate-900 underline dark:text-white"
          href="https://github.com/sodenn/lexical-beautiful-mentions"
          target="_blank"
        >
          GitHub
        </a>
      </div>
      <div className="flex flex-col items-center">
        <ConfigurationProvider>
          <Editor />
        </ConfigurationProvider>
      </div>
    </div>
  );
};

export default Home;
