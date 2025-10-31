"use client";
import React from "react";
import Head from "next/head";
import Image from "next/image";
import Resources from "../../components/Resources";
import ActivityGrid from "../../components/ActivityGrid";

export default function Dashboard() {
  return (
    <>
      <Head>
        <title>Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Lexend:wght@100..900&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"
          rel="stylesheet"
        />
        <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
      
        <style>{`
          .material-symbols-outlined {
            font-variation-settings:
              'FILL' 0,
              'wght' 400,
              'GRAD' 0,
              'opsz' 24;
          }
        `}</style>
      </Head>

      <div className="font-display bg-background-light dark:bg-background-dark text-gray-800 dark:text-gray-200">
        <div className="relative flex min-h-screen">
          {/* SideNavBar */}
          <aside className="absolute inset-y-0 left-0 z-20 w-64 flex-col bg-[#141118]/80 backdrop-blur-lg transform -translate-x-full transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:bg-background-dark md:dark:bg-background-dark border-r border-white/10">
            <div className="flex h-full flex-col justify-between p-4">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 p-2">
                  <div
                    className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10"
                   style={{
  backgroundImage: 'url("/profile-picture.png")',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
}}

                  ></div>
                  <div className="flex flex-col">
                    
                    <h1 className="text-white text-base font-medium leading-normal">
                      Olivia Chen
                    </h1>
                    <p className="text-gray-400 dark:text-[#ab9db9] text-sm font-normal leading-normal">
                      olivia.c@example.com
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-2 mt-4">
                  <a className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/20 text-primary" href="#">
                     <Image
          src="/layout.png"
          alt="Dashboard Icon"
          width={20}
          height={20}
          className="object-contain"
        />
                    <p className="text-sm font-medium leading-normal">Dashboard</p>
                  </a>
                  <a className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-violet-500/10 transition-colors duration-200 text-white" href="#">
                     <Image
          src="/people(1).png"
          alt=" Icon"
          width={20}
          height={20}
          className="object-contain"
        />
                    <p className="text-sm font-medium leading-normal">Profile</p>
                  </a>
                  <a className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-violet-500/10 transition-colors duration-200 text-white" href="#">
                     <Image
          src="/setting.png"
          alt=" Icon"
          width={20}
          height={20}
          className="object-contain"
        />
                    <p className="text-sm font-medium leading-normal">Settings</p>
                  </a>
                </div>
              </div>
              <div className="border-t border-violet-500/10 pt-4">
                <a className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-900/10 transition-colors duration-200 text-white" href="#">
                  
                  <p className="text-sm font-medium leading-normal">Logout</p>
                </a>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {/* TopNavBar */}
            <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-white/10 px-6 py-3 md:hidden sticky top-0 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-lg z-10">
              <button className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 text-gray-800 dark:text-white gap-2 text-sm font-bold leading-normal tracking-[0.015em] min-w-0 px-2.5">
                <span className="material-symbols-outlined text-2xl">menu</span>
              </button>
              <div className="text-lg font-bold">Dashboard</div>
            </header>

            {/* Page Content */}
            <main className="flex-1 p-4 sm:p-6 lg:p-8">
              <div className="flex flex-wrap justify-between gap-3 items-center mb-6">
                <p className="text-gray-900 dark:text-white text-4xl font-black leading-tight tracking-[-0.033em] min-w-72">
                  Dashboard
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Timetable Section */}
                <div className="bg-white/5 dark:bg-[#141118] rounded-xl p-6 flex flex-col">
                  <h3 className="text-white text-lg font-bold leading-tight tracking-[-0.015em] pb-4">
                    Today's Timetable
                  </h3>
                  <div className="grid grid-cols-[40px_1fr] gap-x-2">
                    <div className="flex flex-col items-center gap-1 pt-3">
                      <Image
          src="/people(2).png"
          alt=" Icon"
          width={30}
          height={30}
          className="object-contain"
        />
                      <div className="w-[1.5px] bg-primary/30 h-2 grow"></div>
                    </div>
                    <div className="flex flex-1 flex-col py-3 border-b border-white/10">
                      <p className="text-white text-base font-medium leading-normal">
                        Project Standup
                      </p>
                      <p className="text-[#ab9db9] text-sm font-normal leading-normal">
                        10:00 AM - 10:30 AM
                      </p>
                    </div>

                    <div className="flex flex-col items-center gap-1">
                      <div className="w-[1.5px] bg-primary/30 h-2"></div>
                      <Image
          src="/design.png"
          alt=" Icon"
          width={30}
          height={30}
          className="object-contain"
        />
                      <div className="w-[1.5px] bg-primary/30 h-2 grow"></div>
                    </div>
                    <div className="flex flex-1 flex-col py-3 border-b border-white/10">
                      <p className="text-white text-base font-medium leading-normal">
                        Design Review
                      </p>
                      <p className="text-[#ab9db9] text-sm font-normal leading-normal">
                        1:00 PM - 2:00 PM
                      </p>
                    </div>

                    <div className="flex flex-col items-center gap-1 pb-3">
                      <div className="w-[1.5px] bg-primary/30 h-2"></div>
                       <Image
          src="/bullseye.png"
          alt=" Icon"
          width={30}
          height={30}
          className="object-contain"
        />
                    </div>
                    <div className="flex flex-1 flex-col py-3">
                      <p className="text-white text-base font-medium leading-normal">
                        Focus Work: Component Dev
                      </p>
                      <p className="text-[#ab9db9] text-sm font-normal leading-normal">
                        3:00 PM - 5:00 PM
                      </p>
                    </div>
                  </div>
                </div>

                {/* Resources Section */}
                <Resources/>

                {/* Quiz Section */}
                <div className="bg-white/5 dark:bg-[#141118] rounded-xl p-6">
                  <h3 className="text-white text-lg font-bold leading-tight tracking-[-0.015em] pb-4">
                    Daily Quiz
                  </h3>
                  <p className="text-gray-200 dark:text-white mb-4">
                    What is the primary function of the <code>getStaticProps</code> in Next.js?
                  </p>
                  <div className="space-y-3">
                    {["To fetch data at request time.", "To fetch data at build time.", "To handle API routes."].map((text, idx) => (
                      <label key={idx} className="flex items-center gap-3 p-3 border border-white/10 rounded-lg cursor-pointer hover:border-primary transition-colors has-[:checked]:bg-violet/20 has-[:checked]:border-violet">
                        <input
  type="radio"
  name="quiz-option"
  className="form-radio appearance-none h-4 w-4 border border-violet/20 rounded-full bg-transparent checked:bg-violet-600 checked:border-violet-600 focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-background-dark cursor-pointer"
/>

                        <span>{text}</span>
                      </label>
                    ))}
                  </div >
                  <div className="flex justify-center mt-5">
                      <button className=" flex justify-center bg-violet-800 hover:bg-violet-700 text-white font-large px-4 py-2 rounded-lg transition-colors duration-200">
                    Submit Answer
                  </button>
                  </div>
                  
                </div>

                {/* Progress Section */}
                <div className="bg-white/5 dark:bg-[#141118] rounded-xl p-6">
                  <h3 className="text-white text-lg font-bold leading-tight tracking-[-0.015em] pb-4">
                    My Progress
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-sm font-medium text-white">Courses Completed</p>
                        <p className="text-sm font-medium text-primary">5 / 12</p>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2.5">
                        <div className="bg-violet-600 h-2.5 rounded-full" style={{ width: "42%" }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-sm font-medium text-white">Quizzes Passed</p>
                        <p className="text-sm font-medium text-primary">85%</p>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2.5">
                        <div className="bg-violet-600 h-2.5 rounded-full" style={{ width: "85%" }}></div>
                      </div>
                    </div>
                  </div>
                 <ActivityGrid/>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </>
  );
}
