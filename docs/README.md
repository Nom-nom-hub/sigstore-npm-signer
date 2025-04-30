# sigstore-npm-signer Documentation Site

This folder contains the GitHub Pages documentation site for the sigstore-npm-signer project.

## Structure

- `index.html` - Main landing page
- `docs.html` - Detailed documentation page
- `styles.css` - Stylesheet for the site
- `script.js` - JavaScript for interactive elements
- `assets/` - Contains images, favicon, and other assets
- `.nojekyll` - Tells GitHub Pages not to use Jekyll processing

## Deployment

The site is automatically deployed to GitHub Pages from this folder when changes are pushed to the main branch.

To view the site locally:

```bash
# From the project root
cd docs
python -m http.server 8000
```

Then open your browser to http://localhost:8000

## Customization

To customize the site:

1. Update the GitHub username in links (replace `yourusername` with your actual GitHub username)
2. Update the npm package link if the package name changes
3. Modify the content as needed to reflect changes in the project

## Adding New Pages

To add a new page:

1. Create a new HTML file in the docs folder
2. Copy the header and footer structure from an existing page
3. Add a link to the new page in the navigation sections of other pages
