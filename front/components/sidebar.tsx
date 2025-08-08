"use client";

import { useState, useEffect } from "react";
import { Page, pageApi } from "../api";
import { io } from "socket.io-client";

interface SidebarProps {
  currentPageId?: string;
  onPageSelect: (pageId: string) => void;
}

export function Sidebar({ currentPageId, onPageSelect }: SidebarProps) {
  const [pages, setPages] = useState<Page[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPages();

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001";
    const socket = io(wsUrl);

    socket.on("page-created", (newPage: Page) => {
      setPages((prev) => [newPage, ...prev]);
    });

    socket.on("page-deleted", (deletedPageId: string) => {
      setPages((prev) => prev.filter((p) => p._id !== deletedPageId));
    });

    socket.on("page-updated", (updatedPage: Page) => {
      setPages((prev) =>
        prev.map((p) => (p._id === updatedPage._id ? updatedPage : p))
      );
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const loadPages = async () => {
    try {
      setIsLoading(true);
      const pagesData = await pageApi.getAll();
      setPages(pagesData);
    } catch (error) {
      console.error("Failed to load pages:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const createNewPage = async () => {
    try {
      const newPage = await pageApi.create("Untitled");
      onPageSelect(newPage._id);
    } catch (error) {
      console.error("Failed to create page:", error);
    }
  };

  const deletePage = async (pageId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this page?")) return;

    try {
      await pageApi.delete(pageId);

      if (currentPageId === pageId && pages.length > 1) {
        const remainingPages = pages.filter((p) => p._id !== pageId);
        if (remainingPages.length > 0) {
          onPageSelect(remainingPages[0]._id);
        }
      }
    } catch (error) {
      console.error("Failed to delete page:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="w-64 bg-gray-50 border-r p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 bg-gray-50 border-r flex flex-col">
      <div className="p-4 border-b">
        <button
          onClick={createNewPage}
          className="w-full flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <span className="text-lg">+</span>
          New Page
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-1">
          {pages.map((page) => (
            <div
              key={page._id}
              className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors ${
                currentPageId === page._id ? "bg-blue-100 text-blue-900" : ""
              }`}
              onClick={() => onPageSelect(page._id)}
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">
                  {page.title || "Untitled"}
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(page.updatedAt).toLocaleDateString()}
                </div>
              </div>

              <button
                onClick={(e) => deletePage(page._id, e)}
                className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>

        {pages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <div className="text-2xl mb-2">📝</div>
            <div>No pages yet</div>
            <div className="text-sm">Create your first page</div>
          </div>
        )}
      </div>
    </div>
  );
}
