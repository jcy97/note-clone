import { useState, useRef, useEffect } from "react";
import { Block } from "../api";

interface BlockProps {
  block: Block;
  onUpdate: (content: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onFocus: () => void;
}

export function TextBlock({ block, onUpdate, onKeyDown, onFocus }: BlockProps) {
  const [content, setContent] = useState(block.content);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && content !== block.content) {
      setContent(block.content);
      ref.current.textContent = block.content;
    }
  }, [block.content]);

  const handleInput = () => {
    if (!ref.current) return;
    const newContent = ref.current.textContent || "";
    setContent(newContent);
    onUpdate(newContent);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!ref.current) return;

    const text = ref.current.textContent || "";

    if (text.startsWith("```") && e.key === "Enter") {
      e.preventDefault();
      onKeyDown(e);
      return;
    }

    if (text.startsWith("|") && text.includes("|") && e.key === "Enter") {
      e.preventDefault();
      onKeyDown(e);
      return;
    }

    onKeyDown(e);
  };

  return (
    <div
      ref={ref}
      contentEditable
      className="min-h-[1.5rem] p-2 rounded hover:bg-gray-50 focus:bg-white outline-none"
      data-placeholder="Type '/' for commands, '```' for code, '|' for table..."
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      onFocus={onFocus}
      suppressContentEditableWarning
    />
  );
}

export function CodeBlock({ block, onUpdate, onKeyDown, onFocus }: BlockProps) {
  const [content, setContent] = useState(block.content);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setContent(block.content);
  }, [block.content]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    onUpdate(newContent);
  };

  return (
    <div className="relative group">
      <div className="absolute top-2 right-2 text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">
        Code
      </div>
      <textarea
        ref={ref}
        value={content}
        onChange={handleChange}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
        placeholder="Enter your code..."
        className="w-full bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm resize-none outline-none min-h-[120px]"
        spellCheck={false}
      />
    </div>
  );
}

export function TableBlock({
  block,
  onUpdate,
  onKeyDown,
  onFocus,
}: BlockProps) {
  const [tableData, setTableData] = useState(() => {
    try {
      return JSON.parse(block.content || '{"rows":[["",""],["",""]]}');
    } catch {
      return {
        rows: [
          ["", ""],
          ["", ""],
        ],
      };
    }
  });

  useEffect(() => {
    try {
      const parsed = JSON.parse(block.content || '{"rows":[["",""],["",""]]}');
      setTableData(parsed);
    } catch {
      setTableData({
        rows: [
          ["", ""],
          ["", ""],
        ],
      });
    }
  }, [block.content]);

  const updateCell = (rowIndex: number, colIndex: number, value: string) => {
    const newTableData = { ...tableData };
    newTableData.rows[rowIndex][colIndex] = value;
    setTableData(newTableData);
    onUpdate(JSON.stringify(newTableData));
  };

  const addRow = () => {
    const newTableData = { ...tableData };
    const colCount = newTableData.rows[0]?.length || 2;
    newTableData.rows.push(new Array(colCount).fill(""));
    setTableData(newTableData);
    onUpdate(JSON.stringify(newTableData));
  };

  const addColumn = () => {
    const newTableData = { ...tableData };
    newTableData.rows.forEach((row) => row.push(""));
    setTableData(newTableData);
    onUpdate(JSON.stringify(newTableData));
  };

  return (
    <div className="p-2 rounded hover:bg-gray-50" onFocus={onFocus}>
      <table className="w-full">
        <tbody>
          {tableData.rows.map((row: string[], rowIndex: number) => (
            <tr key={rowIndex}>
              {row.map((cell: string, colIndex: number) => (
                <td key={colIndex} className="border p-2">
                  <input
                    type="text"
                    value={cell}
                    onChange={(e) =>
                      updateCell(rowIndex, colIndex, e.target.value)
                    }
                    className="w-full outline-none bg-transparent"
                    placeholder={rowIndex === 0 ? `Column ${colIndex + 1}` : ""}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex gap-2 mt-2">
        <button
          onClick={addRow}
          className="text-sm text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100"
        >
          + Add Row
        </button>
        <button
          onClick={addColumn}
          className="text-sm text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100"
        >
          + Add Column
        </button>
      </div>
    </div>
  );
}
