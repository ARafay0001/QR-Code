import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import { useParams } from "react-router-dom";

import Editor from "../components/resume/Editor";
import { ResumeProvider } from "../context/ResumeContext";

export default function ResumeEditor() {
  const { templateId } = useParams();

  return (
    <>
      <Navbar />

      <ResumeProvider templateId={templateId}>
        <Editor />
      </ResumeProvider>

      <Footer />
    </>
  );
}