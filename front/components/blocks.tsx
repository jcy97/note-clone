import { useState, useRef, useEffect } from "react";
import { Block } from "../api";
import { CommandMenu } from "./command-menu";

interface BlockProps {
  block: Block;
  onUpdate: (content: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onFocus: () => void;
  onTypeChange?: (type: "text" | "code" | "table") => void;
}

interface TableData {
  rows: string[][];
}

export function TextBlock({
  block,
  onUpdate,
  onKeyDown,
  onFocus,
  onTypeChange,
}: BlockProps) {
  const [showCommandMenu, setShowCommandMenu] = useState<boolean>(false);
  const [commandMenuPosition, setCommandMenuPosition] = useState<{
    x: number;
    y: number;
  }>({ x: 0, y: 0 });
  const ref = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && block.content !== (ref.current.textContent || "")) {
      updateDisplayContent(block.content);
    }
  }, [block.content]);

  const updateDisplayContent = (text: string): void => {
    if (!ref.current) return;

    if (text.startsWith("# ")) {
      ref.current.innerHTML = `<h1 class="text-3xl font-bold">${text.slice(
        2
      )}</h1>`;
    } else if (text.startsWith("## ")) {
      ref.current.innerHTML = `<h2 class="text-2xl font-bold">${text.slice(
        3
      )}</h2>`;
    } else if (text.startsWith("### ")) {
      ref.current.innerHTML = `<h3 class="text-xl font-bold">${text.slice(
        4
      )}</h3>`;
    } else {
      ref.current.textContent = text;
    }
  };

  const handleInput = (): void => {
    if (!ref.current) return;
    const newContent = ref.current.textContent || "";

    if (newContent === "/" && !showCommandMenu) {
      const rect = ref.current.getBoundingClientRect();
      const containerRect = containerRef.current?.getBoundingClientRect();
      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;

      setCommandMenuPosition({
        x: rect.left - (containerRect?.left || 0),
        y: rect.bottom - (containerRect?.top || 0) + scrollTop,
      });
      setShowCommandMenu(true);
    } else if (newContent !== "/" && showCommandMenu) {
      setShowCommandMenu(false);
    }

    onUpdate(newContent);
  };

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (showCommandMenu) {
      if (["ArrowUp", "ArrowDown", "Enter", "Escape"].includes(e.key)) {
        return;
      }
    }

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

  const handleCommandSelect = (type: "text" | "code" | "table"): void => {
    if (ref.current) {
      ref.current.textContent = "";
    }
    setShowCommandMenu(false);
    if (onTypeChange) {
      onTypeChange(type);
    }
  };

  return (
    <div ref={containerRef} className="relative">
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
      {showCommandMenu && (
        <CommandMenu
          position={commandMenuPosition}
          onSelect={handleCommandSelect}
          onClose={() => setShowCommandMenu(false)}
        />
      )}
    </div>
  );
}

export function CodeBlock({ block, onUpdate, onKeyDown, onFocus }: BlockProps) {
  const [content, setContent] = useState<string>(block.content);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (content !== block.content) {
      setContent(block.content);
    }
  }, [block.content]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    const newContent = e.target.value;
    setContent(newContent);
    onUpdate(newContent);
  };

  return (
    <div className="relative group">
      <div className="absolute top-2 right-2 text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded z-10">
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
  const [tableData, setTableData] = useState<TableData>(() => {
    try {
      return JSON.parse(
        block.content || '{"rows":[["",""],["",""]]}'
      ) as TableData;
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
      const parsed = JSON.parse(
        block.content || '{"rows":[["",""],["",""]]}'
      ) as TableData;
      if (JSON.stringify(parsed) !== JSON.stringify(tableData)) {
        setTableData(parsed);
      }
    } catch {
      const defaultData = {
        rows: [
          ["", ""],
          ["", ""],
        ],
      };
      if (JSON.stringify(defaultData) !== JSON.stringify(tableData)) {
        setTableData(defaultData);
      }
    }
  }, [block.content]);

  const updateCell = (
    rowIndex: number,
    colIndex: number,
    value: string
  ): void => {
    const newTableData: TableData = {
      rows: tableData.rows.map((row, rIdx) =>
        rIdx === rowIndex
          ? row.map((cell, cIdx) => (cIdx === colIndex ? value : cell))
          : [...row]
      ),
    };
    setTableData(newTableData);
    onUpdate(JSON.stringify(newTableData));
  };

  const addRow = (): void => {
    const newTableData: TableData = { ...tableData };
    const colCount = newTableData.rows[0]?.length || 2;
    newTableData.rows.push(new Array(colCount).fill(""));
    setTableData(newTableData);
    onUpdate(JSON.stringify(newTableData));
  };

  const addColumn = (): void => {
    const newTableData: TableData = {
      rows: tableData.rows.map((row) => [...row, ""]),
    };
    setTableData(newTableData);
    onUpdate(JSON.stringify(newTableData));
  };

  const deleteRow = (rowIndex: number): void => {
    if (tableData.rows.length <= 1) return;
    const newTableData: TableData = {
      rows: tableData.rows.filter((_, index) => index !== rowIndex),
    };
    setTableData(newTableData);
    onUpdate(JSON.stringify(newTableData));
  };

  const deleteColumn = (colIndex: number): void => {
    if (tableData.rows[0]?.length <= 1) return;
    const newTableData: TableData = {
      rows: tableData.rows.map((row) =>
        row.filter((_, index) => index !== colIndex)
      ),
    };
    setTableData(newTableData);
    onUpdate(JSON.stringify(newTableData));
  };

  return (
    <div className="p-2 rounded hover:bg-gray-50" onFocus={onFocus}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <tbody>
            {tableData.rows.map((row: string[], rowIndex: number) => (
              <tr key={rowIndex} className="group">
                {row.map((cell: string, colIndex: number) => (
                  <td
                    key={colIndex}
                    className="border border-gray-300 p-0 relative"
                  >
                    <input
                      type="text"
                      value={cell}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        updateCell(rowIndex, colIndex, e.target.value)
                      }
                      className="w-full p-2 outline-none bg-transparent min-w-[100px]"
                      placeholder={
                        rowIndex === 0 ? `Column ${colIndex + 1}` : ""
                      }
                    />
                    {colIndex === 0 && (
                      <button
                        onClick={() => deleteRow(rowIndex)}
                        className="absolute -left-6 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-50 w-5 h-5 rounded text-xs"
                      >
                        ×
                      </button>
                    )}
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              {tableData.rows[0]?.map((_: string, colIndex: number) => (
                <td key={colIndex} className="border-0 p-1 relative">
                  <button
                    onClick={() => deleteColumn(colIndex)}
                    className="w-full opacity-0 hover:opacity-100 text-red-500 hover:bg-red-50 rounded text-xs py-1"
                  >
                    ×
                  </button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <div className="flex gap-2 mt-2">
        <button
          onClick={addRow}
          className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1 rounded hover:bg-gray-100 border border-gray-200"
        >
          + Add Row
        </button>
        <button
          onClick={addColumn}
          className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1 rounded hover:bg-gray-100 border border-gray-200"
        >
          + Add Column
        </button>
      </div>
    </div>
  );
}
