import { useState, useEffect, useRef } from "react";

interface CommandMenuProps {
  position: { x: number; y: number };
  onSelect: (type: "text" | "code" | "table") => void;
  onClose: () => void;
}

const commands = [
  { type: "text" as const, icon: "📝", label: "Text", desc: "Plain text" },
  { type: "code" as const, icon: "💻", label: "Code", desc: "Code block" },
  {
    type: "table" as const,
    icon: "📊",
    label: "Table",
    desc: "Table with rows and columns",
  },
];

export function CommandMenu({ position, onSelect, onClose }: CommandMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % commands.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(
          (prev) => (prev - 1 + commands.length) % commands.length
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        onSelect(commands[selectedIndex].type);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, onSelect, onClose]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-64"
      style={{ left: position.x, top: position.y + 20 }}
    >
      {commands.map((command, index) => (
        <div
          key={command.type}
          className={`px-4 py-2 cursor-pointer flex items-center gap-3 ${
            index === selectedIndex
              ? "bg-blue-50 text-blue-900"
              : "hover:bg-gray-50"
          }`}
          onClick={() => onSelect(command.type)}
        >
          <span className="text-lg">{command.icon}</span>
          <div>
            <div className="font-medium">{command.label}</div>
            <div className="text-sm text-gray-500">{command.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
