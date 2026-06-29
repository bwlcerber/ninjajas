# Git and Deployment Rules

When asked to deploy, commit changes, push, or update the site, follow these steps:
1. Analyze which files have been modified.
2. Generate a short, clear commit message in English (e.g., "Update header styles and improve mobile menu").
3. Execute the deploy alias command in the terminal:
   `git deploy "your commit message"`

Additional Rules:
- Always use the `git deploy` command, not separate git add, commit, and push commands.
- Keep commit messages informative but concise.
- If there are subsequent tasks requested after deployment, always complete the deployment first before moving on to other tasks.
