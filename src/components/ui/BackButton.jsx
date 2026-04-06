import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import clsx from "clsx";

export function BackButton({ to = "/", className }) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate(to)}
      aria-label="Back"
      className={clsx(
        "inline-flex items-center justify-center rounded-full w-[44px] h-[44px]",
        "text-sm font-medium text-zinc-700 bg-white/80 backdrop-blur-sm",
        "border border-zinc-200",
        "hover:-translate-y-0.5 hover:shadow-md",
        "active:scale-[0.97] active:shadow-sm",
        "transition-all duration-150 ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2",
        "cursor-pointer",
        className,
      )}
    >
      <ArrowLeft className="size-4 shrink-0" />
    </button>
  );
}
