// Sample starter code templates for each language
export const STARTER_CODE = {
  javascript: "// Start coding in JavaScript!\nconsole.log('Hello, world!');\n\n// Write your code here...",
  python: "# Start coding in Python!\nprint('Hello, world!')\n\n# Write your code here...",
  cpp: "// Start coding in C++!\n#include <iostream>\n\nint main() {\n  std::cout << \"Hello, world!\" << std::endl;\n  return 0;\n}",
  java: "// Start coding in Java!\npublic class Main {\n  public static void main(String[] args) {\n    System.out.println(\"Hello, world!\");\n  }\n}",
  typescript: "// Start coding in TypeScript!\ninterface Person {\n  name: string;\n  age: number;\n}\n\nconst greeting = (person: Person): string => {\n  return `Hello ${person.name}, you are ${person.age} years old!`;\n};\n\nconsole.log(greeting({ name: 'John', age: 30 }));",
  csharp: "// Start coding in C#!\nusing System;\n\nclass Program {\n  static void Main() {\n    Console.WriteLine(\"Hello, world!\");\n  }\n}",
  go: "// Start coding in Go!\npackage main\n\nimport \"fmt\"\n\nfunc main() {\n  fmt.Println(\"Hello, world!\")\n}",
  php: "<?php\n// Start coding in PHP!\necho \"Hello, world!\";\n\n// Write your code here...\n?>",
  ruby: "# Start coding in Ruby!\nputs 'Hello, world!'\n\n# Write your code here...",
  rust: "// Start coding in Rust!\nfn main() {\n  println!(\"Hello, world!\");\n}\n",
};

export const LANGUAGES = [
  { label: "JavaScript", value: "javascript" },
  { label: "Python", value: "python" },
  { label: "C++", value: "cpp" },
  { label: "Java", value: "java" },
  { label: "TypeScript", value: "typescript" },
  { label: "C#", value: "csharp" },
  { label: "Go", value: "go" },
  { label: "PHP", value: "php" },
  { label: "Ruby", value: "ruby" },
  { label: "Rust", value: "rust" },
  // ...add more as needed
];
