/**
 * Convenção de commits: Conventional Commits.
 * Ver docs/guides/git-workflow.md
 */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      2,
      'always',
      ['api', 'web', 'mobile', 'contracts', 'ui', 'docs', 'infra', 'ci', 'deps', 'repo'],
    ],
    'subject-case': [0],
    'header-max-length': [2, 'always', 100],
  },
};
