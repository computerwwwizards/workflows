# Rslib project

## Setup

Install the dependencies:

```bash
pnpm install
```

## Get started

Build the library:

```bash
pnpm build
```

Build the library in watch mode:

```bash
pnpm dev
```

## Usage

To run the vulnerability report, you can use the following commands:

### Standard Report

```bash
tsx packages/github-vulnerabilities-report/src/index.ts --token <token> --org <org> --team <team>
```

### Enhanced Report

```bash
tsx packages/github-vulnerabilities-report/src/index.ts --token <token> --org <org> --team <team> --report enhanced
```
