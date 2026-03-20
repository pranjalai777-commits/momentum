import { useState, useRef } from "react";
import { Plus } from "lucide-react";

interface Props {
  onAdd: (text: string) => void;
}

export default function TaskInput({ onAdd }: Props) {
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setText("");
    inputRef.current?.focus();
  };

  return (
    <div className="w-full flex gap-2">
      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="Add a task to crush..."
        className="flex-1 h-11 px-4 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground text-sm font-sans outline-none border border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
      />
      <button
        onClick={submit}
        disabled={!text.trim()}
        className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0 disabled:opacity-30 hover:scale-105 active:scale-95 transition-all"
        style={{
          background: "linear-gradient(135deg, hsl(var(--neon-cyan)), hsl(var(--neon-purple)))",
        }}
      >
        <Plus className="w-5 h-5 text-primary-foreground" />
      </button>
    </div>
  );
}
