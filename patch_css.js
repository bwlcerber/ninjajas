const fs = require('fs');
let css = fs.readFileSync('css/base.css', 'utf8');

const darkTokens = `
  /* Call Library V0 (Dark Theme) */
  --v0-background:        oklch(0.145 0.01  264);
  --v0-foreground:        oklch(0.985 0.005 240);
  --v0-surface-1:         oklch(0.19  0.015 264);
  --v0-surface-2:         oklch(0.235 0.018 264);
  --v0-card:              oklch(0.19  0.015 264);
  --v0-card-foreground:   oklch(0.985 0.005 240);
  --v0-muted:             oklch(0.27  0.02  264);
  --v0-muted-foreground:  oklch(0.68  0.02  258);
  --v0-border:            oklch(1     0     0 / 8%);
  --v0-input:             oklch(1     0     0 / 12%);
  --v0-ring:              oklch(0.68  0.22  295);
  --v0-brand:             oklch(0.68  0.20  295);
  --v0-brand-foreground:  oklch(0.985 0     0);
  --v0-brand-secondary:   oklch(0.72  0.25  328);
  --v0-brand-secondary-foreground: oklch(0.985 0 0);
  --v0-success:           oklch(0.72  0.19  155);
  --v0-shadow-glow-brand:     0 10px 40px -10px color-mix(in oklab, var(--v0-brand) 45%, transparent);
  --v0-shadow-glow-secondary: 0 10px 40px -10px color-mix(in oklab, var(--v0-brand-secondary) 40%, transparent);
}
`;

const lightTokens = `
  /* Call Library V0 (Light Theme) */
  --v0-background:        oklch(0.99  0.003 250);
  --v0-foreground:        oklch(0.18  0.02  264);
  --v0-surface-1:         oklch(0.975 0.005 250);
  --v0-surface-2:         oklch(0.945 0.008 250);
  --v0-card:              oklch(1     0     0);
  --v0-card-foreground:   oklch(0.18  0.02  264);
  --v0-muted:             oklch(0.955 0.008 250);
  --v0-muted-foreground:  oklch(0.5   0.02  258);
  --v0-border:            oklch(0.18  0.02  264 / 10%);
  --v0-input:             oklch(0.18  0.02  264 / 14%);
  --v0-ring:              oklch(0.62  0.22  295);
  --v0-brand:             oklch(0.62  0.22  295);
  --v0-brand-foreground:  oklch(0.985 0     0);
  --v0-brand-secondary:   oklch(0.62  0.27  328);
  --v0-brand-secondary-foreground: oklch(0.985 0 0);
  --v0-success:           oklch(0.6   0.17  155);
}
`;

css = css.replace('--logo-filter: invert(1);\n}', '--logo-filter: invert(1);\n' + darkTokens);
css = css.replace('--logo-filter: invert(0);\n}', '--logo-filter: invert(0);\n' + lightTokens);

fs.writeFileSync('css/base.css', css);
console.log('patched');
