# VacatAd Blog CMS

This is a serverless CMS for the VacatAd blog, powered by GitHub API.

## Setup

1.  **GitHub Token**: You need a GitHub Personal Access Token with `repo` scope.
    -   Go to [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens).
    -   Generate a new token (classic).
    -   Select `repo` scope.
    -   Copy the token.

2.  **Accessing the CMS**:
    -   Navigate to `https://vacatad.com/admin/login.html` (or your local equivalent).
    -   Enter your token.

## Usage

-   **Dashboard**: Lists all posts from `blog/data/posts.json`.
-   **Creating Posts**: Click "+ New Post". Fill in the details. The content is rich-text editable.
-   **Editing Posts**: Click "Edit" on any post.
    -   *Note*: Existing legacy posts do not have their full content stored in `posts.json` (it's in static HTML files). If you edit a legacy post, you will see a placeholder message in the editor. You can paste the content there to migrate it to the CMS, or just update the metadata (title, date, tags, etc.).
-   **Saving**: When you save, it commits changes directly to the `main` branch of the `vacatad-website` repository. This triggers a site rebuild (if configured with Netlify/Vercel/GitHub Pages).
-   **Images**: Enter the URL of the image. You can use external hosts or paths to images already in the repo (e.g., `posts/my-slug/image.webp`).

## Frontend

-   **New Posts**: Displayed dynamically via `blog/article.html` using the content from JSON.
-   **Legacy Posts**: Still link to their static HTML folders unless you migrate their content to the JSON.

