# RSS SALES MANAGER

Sales Representative Order Management & Inventory App for **RSS RAZEEN SECURE SOLUTIONS** — CCTV, networking, electronics, computer hardware and accessories.

[![CI](https://github.com/riyazamra1/RSS-Sales-Rap/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/riyazamra1/RSS-Sales-Rap/actions/workflows/ci.yml?query=branch%3Amain)
[![Checks](https://img.shields.io/github/checks-status/riyazamra1/RSS-Sales-Rap/main)](https://github.com/riyazamra1/RSS-Sales-Rap/actions/runs?branch=main)

> Both badges are live: the first reflects the CI workflow (typecheck + production build)
> on `main`, the second reflects the check status of the latest commit on `main`.

## Continuous integration

Every push and pull request runs `.github/workflows/ci.yml`:

1. `bun install --frozen-lockfile`
2. `bun run typecheck`
3. `bun run build`

The badge at the top links straight to the workflow run list, so contributors can see
whether typechecking and the production build are passing before they open a branch.

If your repository stays private, GitHub's badge image needs a token to be readable by
signed-out visitors. In that case use a shields.io endpoint badge with a read-only
personal access token, or keep the repository private and share the workflow page link
instead.

## Development

Copy the configuration template first, then fill in your own backend keys —
`.env` is ignored by Git, so nothing private gets committed:

```sh
cp .env.example .env
```


```sh
git clone <this-repository-url>
cd <repository-name>
bun install
bun run dev
```

Run the same checks CI runs, locally:

```sh
bun run typecheck
bun run build
```

## Build with Lovable

Open your project in the [Lovable editor](https://lovable.dev) and keep building.

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: connect the project to GitHub and every change made in Lovable is committed straight to your repository.
- **Full ownership**: this code is yours. Push to your repository and your changes sync back into Lovable, ready for your next prompt.

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS
