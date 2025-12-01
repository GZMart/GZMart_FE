# Public Assets

Files in this directory are **NOT processed** by Vite bundler.

## Usage:

### ✅ Good use cases:
- Favicon: `public/favicon.ico`
- Robots.txt: `public/robots.txt`
- Static images that won't change: `public/images/logo.png`
- Large files that don't need optimization

### ❌ Don't use for:
- CSS files (use `src/assets/styles/` instead)
- Images imported in components (use `src/assets/images/`)
- Fonts used in CSS (use `src/assets/fonts/`)

## Accessing public files:

In HTML:
```html
<link rel="icon" href="/favicon.ico" />
<img src="/images/logo.png" alt="Logo" />
```

In JavaScript:
```jsx
<img src="/images/banner.jpg" alt="Banner" />
```

**Note:** Paths start with `/` (not `./public/`)
