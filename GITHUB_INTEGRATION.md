# GitHub Integration Guide

## Overview

This React + Node.js application provides a comprehensive GitHub integration that allows you to:

- Connect to GitHub repositories using a Personal Access Token
- Browse and search repositories
- View commit history and details
- Analyze code differences with syntax highlighting
- Generate AI-powered summaries of commits
- Navigate through different branches

## Features

### 🔐 Secure Authentication
- Uses GitHub Personal Access Token for secure API access
- Token is validated against GitHub's API

### 🔍 Repository Search
- Search for repositories across GitHub
- View repository details including stars, forks, and watchers
- Access repository metadata

### 📊 Commit History
- View detailed commit history for any branch
- See commit messages, authors, and timestamps
- Navigate through paginated commit lists

### 🔄 Code Differences
- View file changes in commits
- Syntax-highlighted diff view
- Expandable file sections for detailed analysis

### 🤖 AI-Powered Analysis
- Generate AI summaries of commits
- Automatic change categorization (bug fix, feature, refactor)
- Risk assessment based on change size

## Setup Instructions

### Prerequisites

1. **GitHub Personal Access Token**
   - Go to GitHub Settings → Developer settings → Personal access tokens
   - Generate a new token with appropriate permissions:
     - `repo` (for private repositories)
     - `public_repo` (for public repositories)
     - `read:user` (for user information)

### Installation

1. **Install Dependencies**
   ```bash
   # Frontend dependencies
   cd path/to/frontend
   npm install @octokit/rest react-syntax-highlighter openai @types/react-syntax-highlighter

   # Backend dependencies
   cd path/to/backend
   npm install @octokit/rest
   ```

2. **Start the Servers**
   ```bash
   # Start backend (port 4000)
   cd backend
   npm start

   # Start frontend (port 5174)
   cd frontend
   npm run dev
   ```

## Usage Guide

### 1. Initial Configuration

1. Navigate to `/main/gitHub/githubprojetos` in your application
2. Enter your GitHub Personal Access Token
3. Click "Configure GitHub"

### 2. Searching Repositories

1. Once configured, use the search bar to find repositories
2. Enter keywords, repository names, or organization names
3. Click on any repository from the search results to explore it

### 3. Exploring Commits

1. After selecting a repository, choose a branch from the dropdown
2. View the commit history in the "Commits" tab
3. Click on any commit to see detailed information

### 4. Analyzing Code Changes

1. Select a commit to view its details
2. Use the "Files" tab to see which files were modified
3. Switch to the "Diff" tab for detailed code changes
4. Expand individual files to see line-by-line differences

### 5. AI Summary Generation

1. Select a commit you want to analyze
2. Go to the "AI Summary" tab
3. Click "Generate Summary" to get an AI-powered analysis
4. The summary includes:
   - Change description
   - Files affected
   - Change type classification
   - Risk assessment

## API Endpoints

The backend provides the following GitHub API endpoints:

### Authentication
- `POST /api/github/configure` - Configure GitHub token

### Repository Operations
- `GET /api/github/repo/:owner/:repo` - Get repository details
- `GET /api/github/search/repos` - Search repositories
- `GET /api/github/branches/:owner/:repo` - Get repository branches

### Commit Operations
- `GET /api/github/commits/:owner/:repo` - Get commit history
- `GET /api/github/commit/:owner/:repo/:sha` - Get commit details
- `GET /api/github/compare/:owner/:repo/:base/:head` - Compare commits

### File Operations
- `GET /api/github/content/:owner/:repo/:path` - Get file content

## Code Structure

### Frontend Components

```
src/assets/GitHub.tsx
├── Interfaces (Repository, Commit, Branch)
├── State Management (React hooks)
├── API Communication
├── UI Components
│   ├── Authentication Form
│   ├── Repository Search
│   ├── Commit History
│   ├── File Diff Viewer
│   └── AI Summary Panel
└── Utility Functions
```

### Backend Routes

```
backend/routes/github.js
├── Authentication Middleware
├── GitHub API Client (Octokit)
├── Repository Endpoints
├── Commit Endpoints
├── File Content Endpoints
└── Error Handling
```

## Key Features Explained

### Syntax Highlighting

The application uses `react-syntax-highlighter` with the VS Code Dark Plus theme to provide:
- Language-specific syntax highlighting
- Line-by-line diff visualization
- Color-coded additions/deletions

### Responsive Design

Built with Tailwind CSS for:
- Mobile-responsive layouts
- Modern UI components
- Consistent styling across the application

### Error Handling

Comprehensive error handling for:
- Network issues
- Invalid tokens
- Repository access permissions
- API rate limiting

## Security Considerations

1. **Token Storage**: GitHub tokens are not persisted locally
2. **API Limits**: Respects GitHub API rate limits
3. **CORS**: Proper CORS configuration for frontend-backend communication
4. **Validation**: Input validation on both frontend and backend

## Troubleshooting

### Common Issues

1. **"GitHub not configured" error**
   - Ensure you've entered a valid Personal Access Token
   - Check that the token has appropriate permissions

2. **Repository search returns no results**
   - Verify your search query
   - Check internet connectivity
   - Ensure the repository exists and is accessible

3. **Commit details not loading**
   - Check repository permissions
   - Verify the commit SHA exists
   - Check API rate limits

### Debug Tips

1. Check browser console for JavaScript errors
2. Verify backend server is running on port 4000
3. Test GitHub token with curl:
   ```bash
   curl -H "Authorization: token YOUR_TOKEN" https://api.github.com/user
   ```

## Future Enhancements

Potential improvements for the GitHub integration:

1. **Real AI Integration**: Connect to OpenAI API for actual AI summaries
2. **File Tree Navigation**: Visual file tree for repository exploration
3. **Pull Request Support**: View and analyze pull requests
4. **Issue Tracking**: Integration with GitHub Issues
5. **Webhooks**: Real-time updates for repository changes
6. **Collaborative Features**: Team-based repository analysis
7. **Export Options**: Export analysis reports as PDF/CSV
8. **Dashboard**: Summary dashboard for multiple repositories

## Contributing

To extend the GitHub integration:

1. Add new endpoints in `backend/routes/github.js`
2. Update the frontend component in `src/assets/GitHub.tsx`
3. Add new TypeScript interfaces for data structures
4. Update this documentation with new features

## Support

For issues or questions:
1. Check the browser console for errors
2. Verify all dependencies are installed
3. Ensure proper GitHub token permissions
4. Check the backend logs for API errors
