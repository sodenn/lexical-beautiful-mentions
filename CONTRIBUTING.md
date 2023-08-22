# Contributing to lexical-beautiful-mentions
Here is a quick guide to doing code contributions to lexical-beautiful-mentions.

## Pull Requests

1. Fork this repository.
2. Create a new branch following the convention `[type/scope]`. Type can be either `fix`, `feat`, or any other [commit convention](https://www.conventionalcommits.org/en/v1.0.0/) type. Scope is a short describes of the work.
3. Install dependencies:
   ```sh
   npm install
   ```
4. Start the app:
   ```sh
   npm run dev
   ```
5. Make and commit your changes following the commit convention.
6. Ensure tests and build passes:
   ```sh
   npm run hygiene
   npm run test
   npm run e2e
   npm run build
   ```
7. If you've changed APIs, update the documentation.
8. Push your branch.
9. Submit a pull request to the upstream [lexical-beautiful-mentions repository](https://github.com/sodenn/lexical-beautiful-mentions/pulls).<br>
> Maintainers will merge the pull request by squashing all commits and editing the commit message if necessary.
