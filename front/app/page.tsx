"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "../components/sidebar";
import { PageEditor } from "../components/page-editor";
import { pageApi } from "../api";

export default function HomePage() {
  const [currentPageId, setCurrentPageId] = useState<string | null>(null);

  useEffect(() => {
    initializePage();
  }, []);

  const initializePage = async () => {
    try {
      const pages = await pageApi.getAll();
      if (pages.length > 0) {
        setCurrentPageId(pages[0]._id);
      } else {
        const newPage = await pageApi.create("Welcome to Notion Clone");
        setCurrentPageId(newPage._id);
      }
    } catch (error) {
      console.error("Failed to initialize page:", error);
    }
  };

  return (
    <div className="h-screen flex bg-white">
      <Sidebar
        currentPageId={currentPageId || undefined}
        onPageSelect={setCurrentPageId}
      />

      <div className="flex-1 overflow-hidden">
        {currentPageId ? (
          <div className="h-full overflow-y-auto">
            <PageEditor pageId={currentPageId} />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-6xl mb-4">📝</div>
              <div className="text-xl font-semibold text-gray-700 mb-2">
                Welcome to Notion Clone
              </div>
              <div className="text-gray-500">
                Create your first page to get started
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
