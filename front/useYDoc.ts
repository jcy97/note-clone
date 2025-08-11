import { useEffect, useRef, useState } from "react";
import * as Y from "yjs";
import { SocketIOProvider } from "y-socket.io";
import { Block } from "./api";

const generateUserName = () => {
  const userNumber = Math.floor(Math.random() * 1000) + 1;
  return `user${userNumber}`;
};

export function useYDoc(pageId: string) {
  const [isConnected, setIsConnected] = useState(false);
  const ydocRef = useRef<Y.Doc>();
  const providerRef = useRef<SocketIOProvider>();
  const blocksMapRef = useRef<Y.Map<any>>();
  const awarenessRef = useRef<any>();
  const userNameRef = useRef<string>(generateUserName());

  useEffect(() => {
    if (!pageId) return;

    const ydoc = new Y.Doc();
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001";
    const provider = new SocketIOProvider(wsUrl, `page-${pageId}`, ydoc, {
      autoConnect: true,
      resyncInterval: 5000,
      disableBc: false,
    });

    const blocksMap = ydoc.getMap("blocks");
    const awareness = provider.awareness;

    ydocRef.current = ydoc;
    providerRef.current = provider;
    blocksMapRef.current = blocksMap;
    awarenessRef.current = awareness;

    awareness?.setLocalStateField("user", {
      name: userNameRef.current,
      color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`,
    });

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
    const existingBlock = blocksMapRef.current.get(blockId);
    if (existingBlock) {
      blocksMapRef.current.set(blockId, {
        id: blockId,
        type: existingBlock.type,
        content,
        position: existingBlock.position,
        updatedAt: Date.now(),
      });
    }
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
    blocksMapRef.current.set(block.id, {
      id: block.id,
      type: block.type,
      content: block.content,
      position: block.position,
    });
  };

  const deleteBlock = (blockId: string) => {
    if (!blocksMapRef.current) return;
    blocksMapRef.current.delete(blockId);
  };

  const getOnlineUsers = (): string[] => {
    if (!awarenessRef.current) return [];
    const users: string[] = [];
    awarenessRef.current.getStates().forEach((state: any) => {
      if (state.user?.name) {
        users.push(state.user.name);
      }
    });
    return [...new Set(users)];
  };

  return {
    isConnected,
    updateBlock,
    getBlocks,
    addBlock,
    deleteBlock,
    getOnlineUsers,
    ydoc: ydocRef.current,
    blocksMap: blocksMapRef.current,
  };
}
