import React from 'react';
import { Link } from 'react-router-dom';

// This component will be used to represent shared projects
const ProjectCard = ({ name, language, lastUpdated, participants }) => {
  return (
    <Link to="/editor" className="block bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-lg text-gray-900 dark:text-white">{name}</h3>
        <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 text-xs rounded-full">
          {language}
        </span>
      </div>
      <div className="flex justify-between items-center">
        <div className="flex -space-x-2">
          {participants.map((participant, index) => (
            <div 
              key={index} 
              className={`w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center text-xs font-medium bg-${participant.color}-500`}
              title={participant.name}
            >
              {participant.name.charAt(0)}
            </div>
          ))}
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Updated {lastUpdated}
        </span>
      </div>
    </Link>
  );
};

// This component can be used to display recent projects or sessions
const RecentProjects = () => {
  const projects = [
    {
      name: "Sorting Algorithm",
      language: "JavaScript",
      lastUpdated: "2 hours ago",
      participants: [
        { name: "You", color: "green" },
        { name: "John", color: "blue" },
        { name: "Sarah", color: "red" }
      ]
    },
    {
      name: "API Server",
      language: "Python",
      lastUpdated: "Yesterday",
      participants: [
        { name: "You", color: "green" },
        { name: "Mike", color: "yellow" }
      ]
    },
    {
      name: "Web App",
      language: "TypeScript",
      lastUpdated: "Last week",
      participants: [
        { name: "You", color: "green" }
      ]
    }
  ];

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Projects</h2>
        <Link to="/projects" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
          View all
        </Link>
      </div>
      <div className="grid gap-4">
        {projects.map((project, index) => (
          <ProjectCard key={index} {...project} />
        ))}
      </div>
    </div>
  );
};

export default RecentProjects;
