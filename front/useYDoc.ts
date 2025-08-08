import { useEffect, useRef, useState } from "react";
import * as Y from "yjs";
import { SocketIOProvider } from "y-socket.io";
import { Block } from "./api";

export function useYDoc(pageId: string) {
  const [isConnected, setIsConnected] = useState(false);
  const ydocRef = useRef<Y.Doc>();
  const providerRef = useRef<SocketIOProvider>();
  const blocksMapRef = useRef<Y.Map<any>>();

  useEffect(() => {
    if (!pageId) return;

    const ydoc = new Y.Doc();
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001";
    const provider = new SocketIOProvider(wsUrl, `page-${pageId}`, ydoc, {
      autoConnect: true,
      awareness: undefined,
      resyncInterval: 5000,
      disableBc: false,
      auth: undefined,
    });
    const blocksMap = ydoc.getMap("blocks");

    ydocRef.current = ydoc;
    providerRef.current = provider;
    blocksMapRef.current = blocksMap;

    provider.on("status", (event: { status: string }) => {
      setIsConnected(event.status === "connected");
    });

    return () => {
      provider.destroy();
      ydoc.destroy();
    };
  }, [pageId]);

  const updateBlock = (blockId: string, content: string) => {
    if (!blocksMapRef.current) return;
    blocksMapRef.current.set(blockId, { content, updatedAt: Date.now() });
  };

  const getBlocks = (): Block[] => {
    if (!blocksMapRef.current) return [];
    const blocks: Block[] = [];
    blocksMapRef.current.forEach((value, key) => {
      blocks.push({
        id: key,
        type: value.type || "text",
        content: value.content || "",
        position: value.position || 0,
      });
    });
    return blocks.sort((a, b) => a.position - b.position);
  };

  const addBlock = (block: Block) => {
    if (!blocksMapRef.current) return;
    blocksMapRef.current.set(block.id, block);
  };

  const deleteBlock = (blockId: string) => {
    if (!blocksMapRef.current) return;
    blocksMapRef.current.delete(blockId);
  };

  return {
    isConnected,
    updateBlock,
    getBlocks,
    addBlock,
    deleteBlock,
    ydoc: ydocRef.current,
    blocksMap: blocksMapRef.current,
  };
}
