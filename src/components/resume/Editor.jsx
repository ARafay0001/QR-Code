import Sidebar from "./Sidebar";
import ResumePreview from "./ResumePreview";
import BuilderToolbar from "./BuilderToolbar";

export default function Editor() {
  return (
    <div className="space-y-6 max-w-[1626px] m-auto px-16 ">
      <BuilderToolbar />

      <div className="grid gap-8 lg:grid-cols-[420px_1fr]">
        <div className="sticky top-28 rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <Sidebar />
        </div>

        <ResumePreview />
      </div>
    </div>
  );
}
