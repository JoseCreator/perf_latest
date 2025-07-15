# 📚 Documentation Guide

This project uses **TypeDoc** to automatically generate documentation from JSDoc comments in the code.

## 🚀 Quick Start

### Generate Documentation
```bash
npm run docs
```

### Serve Documentation Locally
```bash
npm run docs:serve
```
This will open the documentation in your browser at http://localhost:8080

### Watch Mode (Auto-regenerate)
```bash
npm run docs:watch
```

### Build and Serve in One Command
```bash
npm run docs:build
```

## 📖 Documentation Features

### What's Documented
- **RegistarHoras Component**: Complete time tracking form
- **Type Definitions**: Cliente, Group, Category, TaskType interfaces
- **Function Documentation**: handleRegistar with parameter details
- **State Management**: All React state variables with descriptions
- **Effects**: useEffect hooks with dependency explanations

### JSDoc Comment Features Used
- `@module` - Module-level documentation
- `@interface` - Type interface definitions
- `@param` - Function parameter descriptions
- `@returns` - Return value descriptions
- `@example` - Usage examples
- `@throws` - Error conditions
- `@author` - Author information
- `@since` - Version/date information

## 🎨 Customization

### Styling
The documentation uses a custom theme defined in `docs-theme.css` with:
- Modern gradient colors
- Rounded corners and shadows
- Hover effects
- Professional typography

### Configuration
Documentation settings are in `typedoc.json`:
- Entry points: Which files to document
- Output directory: `./docs`
- Theme customization
- Navigation links
- Validation rules

## 📁 Project Structure
```
docs/                    # Generated documentation
├── index.html          # Main documentation page
├── assets/             # Styles and scripts
├── modules/            # Module documentation
└── interfaces/         # Type definitions

typedoc.json            # TypeDoc configuration
docs-theme.css          # Custom styling
```

## 🔧 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run docs` | Generate documentation |
| `npm run docs:watch` | Watch for changes and regenerate |
| `npm run docs:serve` | Serve documentation locally |
| `npm run docs:build` | Generate and serve documentation |

## 📝 Writing Documentation

### Component Documentation
```tsx
/**
 * Component description
 * 
 * @returns {JSX.Element} Description of what's returned
 * 
 * @example
 * ```tsx
 * <MyComponent />
 * ```
 */
export default function MyComponent() {
  // Component code
}
```

### Function Documentation
```tsx
/**
 * Function description
 * 
 * @param {string} param1 - Description of parameter
 * @param {number} param2 - Description of parameter
 * @returns {Promise<void>} Description of return value
 * 
 * @throws {Error} When something goes wrong
 */
const myFunction = async (param1: string, param2: number) => {
  // Function code
}
```

### Type Documentation
```tsx
/**
 * Type description
 * @interface MyType
 */
type MyType = {
  /** Property description */
  property: string;
}
```

## 🌐 Deployment

To deploy documentation to a web server:

1. Generate documentation: `npm run docs`
2. Upload the `docs/` folder to your web server
3. Point your domain to the `docs/index.html` file

For GitHub Pages:
1. Commit the `docs/` folder to your repository
2. Enable GitHub Pages in repository settings
3. Set source to the `docs/` folder

## 🔍 Search and Navigation

The generated documentation includes:
- **Full-text search** across all documented code
- **Hierarchical navigation** by modules and types
- **Source code links** back to original files
- **Cross-references** between related components

## 💡 Tips

1. **Comment as you code**: Add JSDoc comments while writing code
2. **Use examples**: Include usage examples in complex functions
3. **Document edge cases**: Explain error conditions and validations
4. **Keep it updated**: Regenerate docs after major changes
5. **Link related items**: Use TypeScript types for better cross-referencing

---

*Documentation generated with TypeDoc and enhanced with custom styling for the Perf Duarte project.*
