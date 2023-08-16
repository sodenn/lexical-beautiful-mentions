import { NextPage } from "next";
import dynamic from "next/dynamic";
import Editor from "../components/Editor";

interface HomeProps {}

const ConfigurationProvider = dynamic(
  () => import("../components/ConfigurationProvider"),
  {
    ssr: false,
  },
);

const Home: NextPage<HomeProps> = () => {
  return (
    <ConfigurationProvider>
      <Editor />
    </ConfigurationProvider>
  );
};

export default Home;
