const mkdirp = require("mkdirp");
const simpleGit = require("simple-git");
const {
  readdirSync,
  existsSync,
  readFileSync,
  writeFileSync,
  rmSync,
} = require("fs");

module.exports = function (context, opts) {
  return {
    name: "fetch-external-docs",

    async loadContent() {
      console.log("Fetching examples docs");
      const {
        tmpDir,
        remoteUrl,
        targetPath,
        branch = "develop",
      } = opts;

      rmSync(tmpDir, { recursive: true, force: true });
      await mkdirp(tmpDir);
      const git = simpleGit(tmpDir);

      if (await git.checkIsRepo()) {
        console.log(tmpDir, "exists, pulling from remote");
        await git.fetch("origin").reset("hard", [`origin/${branch}`]);
      } else {
        console.log("Pulling from remote", remoteUrl);
        await git.init().addRemote("origin", remoteUrl).pull("origin", branch);
      }

      return readdirSync(`${tmpDir}/examples`).reduce((acc, curr) => {
        const file = `${tmpDir}/examples/${curr}/README.md`;
        return existsSync(file)
          ? {
              ...acc,
              [curr]: {
                docContent: readFileSync(file, "utf8"),
                docPath: `${targetPath}/${curr}.md`,
              },
            }
          : acc;
      }, {});
    },

    async contentLoaded({ content }) {
      const { repoUrl, sidebarContent, sidebarPath, branch = "master" } = opts;

      await mkdirp(targetPath);

      Object.entries(content).forEach(([key, { docContent, docPath }]) => {
        const docHeader = `---\nid: ${key}\ntitle: ${key}\ncustom_edit_url: ${repoUrl}/edit/${branch}/examples/${key}/README.md\n---\n\n`;
        writeFileSync(docPath, docHeader.concat(docContent));
      });

      const sidebar = sidebarContent.sidebar || {};
      sidebar.Examples = Object.keys(content).map((key) => `examples/${key}`);
      sidebarContent.sidebar = sidebar;
      writeFileSync(
        sidebarPath,
        `module.exports=${JSON.stringify(sidebarContent, null, 2)}`
      );
    },
  };
};
