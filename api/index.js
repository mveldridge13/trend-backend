// Vercel function entry. All routes are rewritten here by vercel.json.
// Requires the compiled Nest output (built by `nest build`) rather than the
// TypeScript source, because Nest's dependency injection needs the decorator
// metadata that the real TypeScript compiler emits.
const { handler } = require("../dist/serverless");

module.exports = handler;
