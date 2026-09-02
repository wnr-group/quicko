// Metro config that lets the mobile app import the SHARED core/ layer that lives
// in the sibling web project (quiko-app/core) — no code duplication.
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const sharedCore = path.resolve(projectRoot, "..", "quiko-app", "core");

const config = getDefaultConfig(projectRoot);

// Watch the shared folder so Metro picks up changes to core/.
config.watchFolders = [sharedCore];

// Resolve the @core/* alias to the shared directory.
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  "@core": sharedCore,
};

// The shared files live outside this project, so bare imports they pull in
// (e.g. Babel's @babel/runtime helpers) must still resolve to THIS app's
// node_modules — add it explicitly to the resolver search paths.
config.resolver.nodeModulesPaths = [path.resolve(projectRoot, "node_modules")];

module.exports = config;
