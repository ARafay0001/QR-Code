import { useState } from "react";

import ResumeProgress from "./ResumeProgress";
import SectionNavigation from "./SectionNavigation";
import EditorPanel from "./EditorPanel";

export default function Sidebar() {

  const [activeSection, setActiveSection] =
    useState("personal");

  return (
    <div className="sticky top-28 space-y-6">

      <ResumeProgress />

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">

        <SectionNavigation
          activeSection={activeSection}
          setActiveSection={setActiveSection}
        />

      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

        <EditorPanel
          activeSection={activeSection}
        />

      </div>

    </div>
  );
}