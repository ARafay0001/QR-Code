export default function Badge({ children }) {
  return (
    <span className="inline-flex rounded-full border border-brand/30 bg-brand/10 px-4 py-2 text-sm font-medium text-brand">
      {children}
    </span>
  );
}