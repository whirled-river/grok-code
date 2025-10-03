# Grok Code

A terminal-based agentic coder powered by Grok's fast coding capabilities. This CLI tool orchestrates multiple AI agents to provide comprehensive software development assistance, from code generation to debugging and optimization.

## Features

### 🤖 Multi-Agent Orchestration
- **Intelligent Orchestrator**: Analyzes requests and coordinates specialized agents
- **Coder Agent**: Full software development pipeline from analysis to deployment
- **Architect Agent**: System architecture and technical design planning
- **Debugger Agent**: Root cause analysis and systematic problem resolution
- **Optimizer Agent**: Performance and code quality enhancements

### 🎯 Core Capabilities
- **Code Generation**: Generate production-ready code with Grok Code Fast-1
- **Code Analysis**: Comprehensive code review and optimization suggestions
- **Code Completion**: Intelligent code completion and context-aware suggestions
- **Benchmarking**: Performance testing and metrics collection

### ⚡ Advanced Features
- **Memory-Enhanced Pipelines**: Context-aware agent coordination with learning capabilities
- **Intelligent Orchestration**: Dynamic agent selection based on request analysis
- **Whisper Network**: Invisible meta-agents for optimization and coordination
- **Stream Processing**: Real-time code generation with live output

### 🔧 Pipeline System
- **Code Development Pipeline**: Full lifecycle development workflow
- **Analysis Pipeline**: Codebase analysis and recommendations
- **Intelligent Agent Selection**: Automatic workflow determination
- **Memory Pruning**: Intelligent context and memory management

## Installation

```bash
# Install dependencies
bun install

# Make executable
chmod +x index.ts

# Build (optional)
bun run build
```

## Setup

### 1. API Configuration

Set up your Grok API key:

```bash
# Interactive setup
bun run setup
```

Or manually configure via config command.

### 2. Global Installation (Optional)

```bash
# Build and install globally
bun run prepublishOnly  # Creates executable at ./index.ts
# Then symlink or add to PATH as needed
```

## Usage

### Basic Commands

```bash
# Interactive agent selector
grok-code

# List available conceptual agents
grok-code list

# Start chat with specific agent
grok-code chat orchestrator
grok-code chat coder --auto

# Configure agents
grok-code config
```

### Code Generation

```bash
# Generate code
grok-code generate "javascript" "Create a user authentication system"

# With requirements and constraints
grok-code generate "python" "Build a REST API" \
  --requirements "JWT auth, rate limiting" \
  --constraints "FastAPI, PostgreSQL" \
  --context "E-commerce application"

# Stream generation
grok-code stream-generate "react" "Build a dashboard component"
```

### Code Analysis & Tools

```bash
# Analyze code
grok-code analyze "$(cat myfile.js)" --type performance
grok-code analyze "$(cat myfile.js)" javascript --type security

# Code completion
grok-code complete "function greet" --suffix ")" --language javascript
grok-code complete "#include <iostream>" --language cpp
```

### Pipeline Orchestration

```bash
# List available pipelines
grok-code pipelines

# Run code development pipeline
grok-code pipeline code-development "Add user authentication to existing codebase"

# Memory-enhanced pipeline (with learning)
grok-code pipeline-memory code-development "Implement real-time notifications"

# Intelligent orchestration (auto-agent selection)
grok-code orchestrate "Debug why my app crashes on startup"

# Analyze optimal workflow without execution
grok-code auto-analyze "Optimize database queries for better performance"
```

### Memory Management

```bash
# Analyze memories for pipeline optimization
grok-code memory-analyze code-development "Enhance the existing API endpoints"

# Clear all stored memories (factory reset)
grok-code forget-memories --force
```

### Benchmarking & Testing

```bash
# Benchmark Grok Code Fast-1 performance
grok-code benchmark --iterations 10
```

## Project Structure

```
src/
├── api/
│   └── grok-api.ts              # Grok API client
├── components/
│   ├── App.tsx                  # Main app component
│   ├── ConceptualAgentSelector.tsx
│   ├── Chat.tsx                 # Chat interface
│   ├── AgentList.tsx            # Agent management UI
│   └── Setup.tsx                # Initial setup wizard
├── types.ts                      # Type definitions
├── multi-agent-orchestrator.ts   # Core orchestration engine
├── agent-manager.ts             # Agent lifecycle management
├── session-manager.ts           # Session handling
├── default-agents.ts            # Conceptual agent definitions
├── meta-agents.ts               # Whisper network (invisible coordinators)
└── utils/
    ├── config.ts                # Configuration management
    ├── exec.ts                  # Command execution utilities
    └── file-tools.ts            # File operation tools
```

## Conceptual Agents

### Orchestrator
_Intelligent multi-agent system - analyzes requests and orchestrates specialized AI agents_
- Request analysis and intent understanding
- Agent selection and workflow coordination
- Memory management and learning
- Quality assurance through iterative cycles

### Coder
_Full software development pipeline - from analysis to deployment_
- Requirements analysis and codebase examination
- Implementation and code generation
- Testing and quality assurance
- Production deployment readiness

### Architect
_System architecture and design - strategic planning and technical specifications_
- System design for scalability and maintainability
- API design and interface contracts
- Security architecture integration
- Performance planning and optimization strategies

### Debugger
_Comprehensive debugging pipeline - root cause to solution_
- Error parsing and diagnostic analysis
- Code path tracing and root cause identification
- Targeted fix implementation
- Regression prevention and testing

### Optimizer
_Performance and quality optimization - analysis, enhancement, and optimization_
- Performance profiling and bottleneck identification
- Code quality and maintainability improvements
- Algorithm and pattern optimization
- User experience enhancements

## Meta-Agents (Whisper Network)

### Response Analyzer
_Invisible assistant analyzing agent outputs for optimization_
- Key insight extraction from responses
- Actionable idea summarization
- Quality metrics and coordination guidance

### Context Guardian
_Memory and temporal coordination specialist_
- Conversation context synthesis and management
- Agent transition coordination
- Memory pruning and relevance filtering
- Temporal analysis and trend recognition

## Technical Details

### Dependencies
- **Ink & React**: Beautiful terminal UIs
- **Commander**: CLI command parsing and handling
- **Axios**: HTTP client for API communication
- **TypeScript**: Type safety and modern JavaScript features

### API Integration
- **Model**: grok-code-fast-1
- **Features**: Code generation, analysis, completion, streaming
- **Capabilities**: Advanced reasoning, context understanding, iterative refinement

### Pipeline Architecture
- **Modular Design**: Extensible agent and pipeline system
- **Memory System**: Persistent learning across sessions
- **Quality Gates**: Multi-level validation and improvement
- **Orchestration Layers**: Intelligent coordination between agents

## Development

```bash
# Development server
bun run dev

# Build project
bun run build

# Compile to single executable
bun run compile

# Run tests
bun test
```

## Contributing

Contributions welcome! The project follows a modular architecture that makes it easy to:
- Add new conceptual agents
- Extend pipeline capabilities
- Integrate additional API endpoints
- Enhance the whisper network coordination

## License

MIT License - see package.json for details

## Acknowledgments

Powered by Grok Code Fast-1, this tool represents the future of AI-assisted software development through intelligent agent orchestration and multi-layered coordination systems.
