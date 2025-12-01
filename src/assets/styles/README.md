# Assets Styles

## CSS Modules Usage

CSS Modules are **scoped styles** that prevent class name conflicts.

### Example:

**Component file:** `Button.jsx`

```jsx
import styles from './Button.module.css';

const Button = () => {
  return <button className={styles.primary}>Click me</button>;
};
```

**Style file:** `Button.module.css`

```css
.primary {
  background: blue;
  color: white;
}

.secondary {
  background: gray;
}
```

### Generated output:

```html
<button class="Button_primary__a1b2c">Click me</button>
```

The class name is automatically hashed to avoid conflicts!

## File organization:

- **Component-specific styles**: `src/components/Button/Button.module.css`
- **Global styles**: `src/assets/styles/global.css`
- **Layout styles**: `src/assets/styles/layouts.module.css`
- **Utility classes**: `src/assets/styles/utils.css`
