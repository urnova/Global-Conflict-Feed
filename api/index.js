// Stub — replaced at build time by:
// esbuild server/vercel-handler.ts --bundle --platform=node --format=cjs --packages=external --outfile=api/index.js
// DO NOT DELETE — Vercel validates this file exists before running the build.
module.exports = async (req, res) => {
  res.status(503).json({ error: 'Build not complete — run pnpm exec vite build first' });
};
