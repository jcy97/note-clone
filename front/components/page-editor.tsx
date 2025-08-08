"use client";

import { useState, useEffect, useCallback } from "react";
import { Page, Block, pageApi } from "../api";
import { useYDoc } from "../useYDoc";
import { TextBlock, CodeBlock, TableBlock } from "./blocks";

interface PageEditorProps {
  pageId: string;
}

export function PageEditor({ pageId }: PageEditorProps) {
  const [page, setPage] = useState<Page | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const {
    isConnected,
    updateBlock,
    getBlocks,
    addBlock,
    deleteBlock,
    blocksMap,
  } = useYDoc(pageId);

  useEffect(() => {
    loadPage();
  }, [pageId]);

  useEffect(() => {
    if (!blocksMap) return;

    const updateBlocks = () => {
      const yjsBlocks = getBlocks();
      if (yjsBlocks.length > 0) {
        setBlocks(yjsBlocks);
      }
    };

    blocksMap.observe(updateBlocks);
    updateBlocks();

    return () => {
      blocksMap.unobserve(updateBlocks);
    };
  }, [blocksMap, getBlocks]);

  const loadPage = async () => {
    try {
      const pageData = await pageApi.getById(pageId);
      setPage(pageData);
      setBlocks(pageData.blocks);

      pageData.blocks.forEach((block) => {
        addBlock(block);
      });
    } catch (error) {
      console.error("Failed to load page:", error);
    }
  };

  const handleBlockUpdate = useCallback(
    (blockId: string, content: string) => {
      updateBlock(blockId, content);

      setBlocks((prev) =>
        prev.map((block) =>
          block.id === blockId ? { ...block, content } : block
        )
      );

      if (page) {
        const updatedBlocks = blocks.map((block) =>
          block.id === blockId ? { ...block, content } : block
        );
        pageApi.update(pageId, { ...page, blocks: updatedBlocks });
      }
    },
    [updateBlock, blocks, page, pageId]
  );

  const createNewBlock = (
    afterBlockId: string,
    type: "text" | "code" | "table" = "text"
  ) => {
    const afterIndex = blocks.findIndex((b) => b.id === afterBlockId);
    const newBlock: Block = {
      id: `block-${Date.now()}`,
      type,
      content: type === "table" ? '{"rows":[["",""],["",""]]}' : "",
      position: afterIndex + 1,
    };

    const newBlocks = [...blocks];
    newBlocks.splice(afterIndex + 1, 0, newBlock);
    newBlocks.forEach((block, index) => {
      block.position = index;
    });

    setBlocks(newBlocks);
    addBlock(newBlock);
    setSelectedBlockId(newBlock.id);

    if (page) {
      pageApi.update(pageId, { ...page, blocks: newBlocks });
    }
  };

  const handleKeyDown = (blockId: string) => (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const block = blocks.find((b) => b.id === blockId);
      if (!block) return;

      const content = block.content.trim();

      if (content.startsWith("```")) {
        createNewBlock(blockId, "code");
        return;
      }

      if (content.startsWith("|") && content.includes("|")) {
        const cols = content.split("|").filter((cell) => cell.trim()).length;
        const tableData = {
          rows: [new Array(cols).fill(""), new Array(cols).fill("")],
        };
        handleBlockUpdate(blockId, JSON.stringify(tableData));

        setBlocks((prev) =>
          prev.map((b) =>
            b.id === blockId ? { ...b, type: "table" as const } : b
          )
        );
        return;
      }

      createNewBlock(blockId, "text");
    }

    if (e.key === "Backspace") {
      const block = blocks.find((b) => b.id === blockId);
      if (block && !block.content.trim() && blocks.length > 1) {
        e.preventDefault();
        const blockIndex = blocks.findIndex((b) => b.id === blockId);
        const newBlocks = blocks.filter((b) => b.id !== blockId);
        setBlocks(newBlocks);
        deleteBlock(blockId);

        if (blockIndex > 0) {
          setSelectedBlockId(newBlocks[blockIndex - 1].id);
        }

        if (page) {
          pageApi.update(pageId, { ...page, blocks: newBlocks });
        }
      }
    }
  };

  const updateTitle = async (title: string) => {
    if (!page) return;
    try {
      const updatedPage = await pageApi.update(pageId, { ...page, title });
      setPage(updatedPage);
    } catch (error) {
      console.error("Failed to update title:", error);
    }
  };

  if (!page) {
    return (
      <div className="flex items-center justify-center h-64">Loading...</div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-6 flex items-center gap-4">
        <div
          className={`w-3 h-3 rounded-full ${
            isConnected ? "bg-green-500" : "bg-red-500"
          }`}
        />
        <span className="text-sm text-gray-500">
          {isConnected ? "Connected" : "Disconnected"}
        </span>
      </div>

      <input
        type="text"
        value={page.title}
        onChange={(e) => updateTitle(e.target.value)}
        placeholder="Untitled"
        className="text-4xl font-bold mb-8 w-full outline-none border-none bg-transparent placeholder-gray-400"
      />

      <div className="space-y-2">
        {blocks.map((block) => {
          const isSelected = selectedBlockId === block.id;

          return (
            <div
              key={block.id}
              className={`group relative ${
                isSelected ? "ring-2 ring-blue-500 rounded-lg" : ""
              }`}
            >
              {block.type === "text" && (
                <TextBlock
                  block={block}
                  onUpdate={(content) => handleBlockUpdate(block.id, content)}
                  onKeyDown={handleKeyDown(block.id)}
                  onFocus={() => setSelectedBlockId(block.id)}
                />
              )}

              {block.type === "code" && (
                <CodeBlock
                  block={block}
                  onUpdate={(content) => handleBlockUpdate(block.id, content)}
                  onKeyDown={handleKeyDown(block.id)}
                  onFocus={() => setSelectedBlockId(block.id)}
                />
              )}

              {block.type === "table" && (
                <TableBlock
                  block={block}
                  onUpdate={(content) => handleBlockUpdate(block.id, content)}
                  onKeyDown={handleKeyDown(block.id)}
                  onFocus={() => setSelectedBlockId(block.id)}
                />
              )}
            </div>
          );
        })}

        <div
          className="block-selector p-8 text-center text-gray-400 cursor-pointer"
          onClick={() =>
            createNewBlock(blocks[blocks.length - 1]?.id || "block-1")
          }
        >
          Click to add a new block, or type '/' for commands
        </div>
      </div>
    </div>
  );
}
