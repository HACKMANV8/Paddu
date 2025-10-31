'use client'
import { useState } from "react";
import Image from "next/image";

function ResourceSection({ title }) {
  const [activeTab, setActiveTab] = useState("Videos");

  return (
    <div className="bg-white/5 dark:bg-[#141118] rounded-xl p-6 flex-1">
      <h3 className="text-white text-lg font-bold leading-tight tracking-[-0.015em] pb-4">
        {title}
      </h3>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-white/10">
        <button
          onClick={() => setActiveTab("Videos")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "Videos"
              ? "text-violet-500 border-b-2 border-violet-600"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Videos
        </button>

        <button
          onClick={() => setActiveTab("Documents")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "Documents"
              ? "text-violet-500 border-b-2 border-violet-600"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Documents
        </button>
      </div>

      {/* Conditional Content */}
      {activeTab === "Videos" ? (
        <ul className="space-y-3">
          <li className="flex items-center justify-between p-2 rounded-md hover:bg-white/5">
            <div className="flex items-center gap-3">
              <Image src="/play-button.png" alt="Icon" width={30} height={30} className="object-contain" />
              <p className="text-sm font-medium">Intro to Next.js</p>
            </div>
            <span className="text-xs text-gray-400">23:10</span>
          </li>
          <li className="flex items-center justify-between p-2 rounded-md hover:bg-white/5">
            <div className="flex items-center gap-3">
              <Image src="/play-button.png" alt="Icon" width={30} height={30} className="object-contain" />
              <p className="text-sm font-medium">State Management</p>
            </div>
            <span className="text-xs text-gray-400">18:20</span>
          </li>
        </ul>
      ) : (
        <ul className="space-y-3">
          <li className="flex items-center justify-between p-2 rounded-md hover:bg-white/5">
            <div className="flex items-center gap-3">
              <Image src="/google-docs.png" alt="PDF" width={30} height={30} className="object-contain" />
              <p className="text-sm font-medium">Next.js Documentation.pdf</p>
            </div>
            <span className="text-xs text-gray-400">2.4 MB</span>
          </li>
          <li className="flex items-center justify-between p-2 rounded-md hover:bg-white/5">
            <div className="flex items-center gap-3">
              <Image src="/google-docs.png" alt="PDF" width={30} height={30} className="object-contain" />
              <p className="text-sm font-medium">React Hooks Explained.pdf</p>
            </div>
            <span className="text-xs text-gray-400">1.8 MB</span>
          </li>
        </ul>
      )}
    </div>
  );
}

export default function Resources() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <ResourceSection title="Task 1" />
      <ResourceSection title="Task 2" />
    </div>
  );
}
