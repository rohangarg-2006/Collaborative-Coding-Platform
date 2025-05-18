// Fallback answers for when the AI API is unavailable
// These are used when the Gemini API can't be reached or returns an error

const FALLBACK_ANSWERS = {
  'react component': `
# Creating React Components

React components are the building blocks of React applications. They let you split the UI into independent, reusable pieces.

## Function Component (Modern approach):

\`\`\`jsx
import React from 'react';

function Welcome(props) {
  return <h1>Hello, {props.name}</h1>;
}

export default Welcome;
\`\`\`

## Class Component:

\`\`\`jsx
import React from 'react';

class Welcome extends React.Component {
  render() {
    return <h1>Hello, {this.props.name}</h1>;
  }
}

export default Welcome;
\`\`\`

## Using a Component:

\`\`\`jsx
import Welcome from './Welcome';

function App() {
  return (
    <div>
      <Welcome name="Sara" />
      <Welcome name="Cahal" />
      <Welcome name="Edite" />
    </div>
  );
}
\`\`\`

Remember, component names must start with a capital letter!
`,

  'var let const': `
# Differences between var, let, and const in JavaScript

## var
- Function-scoped (or globally-scoped if declared outside a function)
- Can be redeclared and updated
- Hoisted to the top of its scope and initialized with undefined

\`\`\`javascript
var x = 1;
if (true) {
  var x = 2;  // same variable!
}
console.log(x);  // Outputs: 2
\`\`\`

## let
- Block-scoped (only available within the block it's defined)
- Can be updated but not redeclared in the same scope
- Hoisted but not initialized (Temporal Dead Zone applies)

\`\`\`javascript
let y = 1;
if (true) {
  let y = 2;  // different variable
}
console.log(y);  // Outputs: 1
\`\`\`

## const
- Block-scoped
- Cannot be updated or redeclared
- Must be initialized at declaration
- For objects and arrays, the content can be modified but the reference cannot be changed

\`\`\`javascript
const z = 1;
// z = 2; // Error: Assignment to constant variable

const obj = { name: 'John' };
obj.name = 'Jane'; // This is allowed
// obj = { name: 'Jane' }; // Error: Assignment to constant variable
\`\`\`

## Best practices
- Use \`const\` by default
- Use \`let\` if you need to reassign the variable
- Avoid \`var\` in modern JavaScript
`,

  'recursion': `
# Recursion in Programming

Recursion is a technique where a function calls itself to solve a smaller instance of the same problem.

## Basic Example:

\`\`\`javascript
function factorial(n) {
  // Base case
  if (n === 0 || n === 1) {
    return 1;
  }
  // Recursive case
  else {
    return n * factorial(n - 1);
  }
}

console.log(factorial(5)); // Outputs: 120
\`\`\`

## Key Components:
1. **Base case** - The condition that stops the recursion
2. **Recursive case** - The function calling itself with a smaller problem

## Fibonacci Example:

\`\`\`javascript
function fibonacci(n) {
  if (n <= 1) {
    return n;
  } else {
    return fibonacci(n - 1) + fibonacci(n - 2);
  }
}

console.log(fibonacci(7)); // Outputs: 13
\`\`\`

## Important Considerations:
- Always include a base case to prevent infinite recursion
- Recursion can lead to stack overflow if too deep
- Sometimes, iterative solutions are more efficient

## When to use:
- Problems that can be broken down into similar sub-problems
- Tree/graph traversals
- Divide and conquer algorithms
`,

  'sort array': `
# Sorting Arrays in JavaScript

## Basic Sorting:

\`\`\`javascript
const numbers = [3, 1, 4, 1, 5, 9];

// Default sort (converts elements to strings and sorts lexicographically)
numbers.sort();
console.log(numbers); // Might not work as expected for numbers!

// For numerical sorting:
numbers.sort((a, b) => a - b); // Ascending
console.log(numbers); // [1, 1, 3, 4, 5, 9]

numbers.sort((a, b) => b - a); // Descending
console.log(numbers); // [9, 5, 4, 3, 1, 1]
\`\`\`

## Sorting Objects:

\`\`\`javascript
const people = [
  { name: 'John', age: 30 },
  { name: 'Alice', age: 25 },
  { name: 'Bob', age: 35 }
];

// Sort by age
people.sort((a, b) => a.age - b.age);
console.log(people); // Sorted by age ascending

// Sort by name
people.sort((a, b) => a.name.localeCompare(b.name));
console.log(people); // Sorted alphabetically by name
\`\`\`

## Other Sorting Algorithms:

JavaScript's built-in \`sort()\` method typically uses a variation of quicksort or mergesort, depending on the browser implementation.

For custom sorting needs, you can implement algorithms like:
- Bubble Sort
- Selection Sort
- Insertion Sort
- Merge Sort
- Quick Sort
- Heap Sort

## Stable vs Unstable Sort:
\`Array.sort()\` is not guaranteed to be stable in all browsers, meaning equal elements may not maintain their relative order.
`
};

export default FALLBACK_ANSWERS;
