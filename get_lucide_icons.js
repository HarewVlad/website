// get-lucide-keys.js
const fs = require('fs');
const path = require('path');

try {
  // Import all exports from lucide-react
  const lucideExports = require('lucide-react');

  // Determine the object containing the keys. Handle potential { default: ... } structure.
  const icons = (lucideExports && typeof lucideExports.default === 'object' && Object.keys(lucideExports).length === 1)
                ? lucideExports.default // Use default if it seems to be the main export container
                : lucideExports;        // Otherwise, use the top-level object

  // Get ALL keys from the determined icons object
  const allKeys = Object.keys(icons).sort(); // Sort alphabetically for consistency

  // Output *only* the list of keys as a JSON array to standard output
  console.log(JSON.stringify(allKeys, null, 2));

} catch (error) {
  // Use console.error for errors so they don't mix with the JSON output on stdout
  console.error("Error introspecting lucide-react:", error);
  console.error("Make sure 'lucide-react' is installed in this project (run: npm install lucide-react).");
  process.exit(1); // Exit with an error code
}