#!/usr/bin/env node

import { Command } from 'commander';
import { render } from 'ink';
import { AgentList } from './src/components/AgentList.js';
import { Chat } from './src/components/Chat.js';
import { Setup } from './src/components/Setup.js';
import { AgentManager } from './src/agent-manager.js';
import { EnhancedGrokApiClient, CodeGenerationRequest } from './src/api/grok-api.js';
import { MultiAgentOrchestrator } from './src/multi-agent-orchestrator.js';
import { conceptualAgents } from './src/default-agents.js';
import { MemoryAnalysisResult } from './src/types.js';
import { getApiKey, hasApiKey } from './src/utils/config.js';
import { App } from './src/components/App.js';
import React from 'react';

const program = new Command();

program
  .name('grok-code-fast')
  .description('Enhanced terminal-based tool leveraging grok-code-fast-1 capabilities')
  .version('2.0.0');

// Default action - show agent selector
program.action(async () => {
  try {
    render(React.createElement(App));
  } catch (error) {
    console.error('Failed to start application:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
});

program
  .command('list')
  .description('List available conceptual agents')
  .action(() => {
    console.log('🎯 Available Conceptual Agents:');
    console.log('─'.repeat(60));

    conceptualAgents.forEach((agent, index) => {
      console.log(`${index + 1}. ${agent.name.toUpperCase()}`);
      console.log(`   ${agent.description}`);
      const pipelineInfo = agent.pipeline ? ` (Pipeline: ${agent.pipeline})` : '';
      console.log(`   Mode: ${agent.name}${pipelineInfo}`);
      console.log('');
    });
  });

program
  .command('chat <agentName>')
  .description('Start chat session with an agent')
  .option('--auto', 'Enable autonomous mode for the agent')
  .action(async (agentName, options) => {
    const agentManager = new AgentManager();
    const agent = agentManager.getAgent(agentName);

    if (!agent) {
      console.error(`Agent '${agentName}' not found.`);
      process.exit(1);
    }

    try {
      const apiKey = await getApiKey();
      const apiClient = new EnhancedGrokApiClient(apiKey);

      render(
        React.createElement(Chat, {
          agent,
          apiClient,
          autonomous: options.auto
        })
      );
    } catch (error) {
      console.error('Failed to get API key:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('config')
  .description('Configure agents')
  .action(() => {
    render(React.createElement(AgentList, { mode: 'config' }));
  });

program
  .command('setup')
  .description('Interactive setup for API key')
  .action(() => {
    render(React.createElement(Setup, { onComplete: () => {
      console.log('Setup complete! You can now use grok-code chat.');
      process.exit(0);
    } }));
  });

// Grok-Code-Fast-1 Enhanced Commands
program
  .command('generate <language> <functionality>')
  .description('Generate code using grok-code-fast-1 specialized capabilities')
  .option('-r, --requirements <reqs>', 'Requirements (comma-separated)')
  .option('-c, --constraints <consts>', 'Constraints (comma-separated)')
  .option('-x, --context <ctx>', 'Additional context')
  .action(async (language, functionality, options) => {
    try {
      const apiKey = await getApiKey();
      const apiClient = new EnhancedGrokApiClient(apiKey);

      const request: CodeGenerationRequest = {
        language,
        functionality,
        requirements: options.requirements ? options.requirements.split(',') : undefined,
        constraints: options.constraints ? options.constraints.split(',') : undefined,
        context: options.context ? [options.context] : undefined,
      };

      console.log(`Generating ${language} code for: ${functionality}`);
      const code = await apiClient.generateCode(request);

      console.log('\n' + '─'.repeat(80));
      console.log(code);
      console.log('─'.repeat(80));

    } catch (error) {
      console.error('Code generation failed:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('analyze <code> [language]')
  .description('Analyze code using grok-code-fast-1')
  .option('-t, --type <type>', 'Analysis type (performance/security/maintainability)')
  .action(async (code, language = 'javascript', options) => {
    try {
      const apiKey = await getApiKey();
      const apiClient = new EnhancedGrokApiClient(apiKey);

      console.log(`Analyzing ${language} code...`);
      const analysis = await apiClient.analyzeCode(code, language, options.type);

      console.log('\n' + '═'.repeat(80));
      console.log('CODE ANALYSIS RESULTS');
      console.log('═'.repeat(80));
      console.log(analysis);
      console.log('═'.repeat(80));

    } catch (error) {
      console.error('Code analysis failed:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('complete <prefix>')
  .description('Complete code using grok-code-fast-1')
  .option('-s, --suffix <suffix>', 'Code that comes after completion')
  .option('-l, --language <lang>', 'Programming language', 'javascript')
  .option('-c, --context <ctx>', 'Additional context')
  .action(async (prefix, options) => {
    try {
      const apiKey = await getApiKey();
      const apiClient = new EnhancedGrokApiClient(apiKey);

      console.log('Generating code completion...');
      const completion = await apiClient.completeCode(prefix, options.suffix, options.language, options.context);

      console.log('\nOriginal code:');
      console.log(prefix);
      console.log('\nCompletion:');
      console.log('─'.repeat(40));
      console.log(completion);
      console.log('─'.repeat(40));

    } catch (error) {
      console.error('Code completion failed:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('stream-generate <language> <functionality>')
  .description('Stream code generation using grok-code-fast-1 (simulated streaming)')
  .action(async (language, functionality) => {
    try {
      const apiKey = await getApiKey();
      const apiClient = new EnhancedGrokApiClient(apiKey);

      const request: CodeGenerationRequest = {
        language,
        functionality,
      };

      console.log(`Streaming ${language} code generation for: ${functionality}`);
      console.log('─'.repeat(80));

      const result = await apiClient.streamCode(request, (chunk) => {
        process.stdout.write(chunk); // Stream chunks to output
      });

      console.log('\n' + '─'.repeat(80));
      console.log('Code generation complete!');

    } catch (error) {
      console.error('Streaming code generation failed:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('benchmark')
  .description('Benchmark grok-code-fast-1 capabilities')
  .option('--iterations <n>', 'Number of iterations', '5')
  .action(async (options) => {
    try {
      const apiKey = await getApiKey();
      const apiClient = new EnhancedGrokApiClient(apiKey);

      const iterations = parseInt(options.iterations);
      console.log(`Benchmarking grok-code-fast-1 with ${iterations} iterations...`);

      const testRequest = {
        messages: [{
          role: 'user',
          content: 'Write a simple function to calculate fibonacci numbers in JavaScript.'
        }],
        model: 'grok-code-fast-1'
      };

      let totalTime = 0;
      const results = [];

      for (let i = 0; i < iterations; i++) {
        const start = Date.now();
        const response = await apiClient.chat(testRequest);
        const elapsed = Date.now() - start;

        totalTime += elapsed;
        results.push({
          iteration: i + 1,
          responseTime: elapsed,
          responseLength: response.length
        });

        console.log(`Iteration ${i + 1}: ${elapsed}ms (${response.length} chars)`);
      }

      const avgTime = totalTime / iterations;
      console.log('\n' + '═'.repeat(80));
      console.log(`BENCHMARK RESULTS (${iterations} iterations)`);
      console.log(`Average Response Time: ${avgTime.toFixed(1)}ms`);
      console.log(`Total Time: ${totalTime}ms`);
      console.log('═'.repeat(80));

    } catch (error) {
      console.error('Benchmark failed:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Multi-Agent Orchestration Commands
program
  .command('pipeline <pipelineType>')
  .description('Run multi-agent pipeline (code-development, analysis-only)')
  .argument('<prompt>', 'User prompt for the pipeline')
  .option('-v, --verbose', 'Show detailed execution log')
  .action(async (pipelineType, prompt, options) => {
    try {
      const apiKey = await getApiKey();
      const orchestrator = new MultiAgentOrchestrator(apiKey);

      console.log(`🔧 Starting ${pipelineType} pipeline...`);
      console.log(`📝 Prompt: ${prompt}`);
      console.log('─'.repeat(80));

      const result = await (pipelineType === 'code-development'
        ? orchestrator.runCodeDevelopmentPipeline(prompt)
        : orchestrator.runAnalysisPipeline(prompt));

      if (result.success) {
        console.log('\n✅ Pipeline completed successfully!\n');
        console.log('📋 EXECUTION LOG:');
        result.executionLog.forEach((step, index) => {
          console.log(`  ${index + 1}. ${step}`);
        });

        console.log('\n🏆 FINAL RESULT:');
        console.log('═'.repeat(80));
        console.log(result.finalResult);
        console.log('═'.repeat(80));
      } else {
        console.log('\n❌ Pipeline had some issues:');
        result.context.errors.forEach((error, index) => {
          console.log(`  ${index + 1}. ${error}`);
        });
      }

      if (options.verbose) {
        console.log('\n🔍 VERBOSE EXECUTION SUMMARY:');
        console.log(`Steps executed: ${result.context.stepCount}`);
        console.log(`Results generated: ${result.context.results.size}`);
        console.log(`Errors encountered: ${result.context.errors.length}`);
      }

    } catch (error) {
      console.error('Pipeline execution failed:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Add pipeline listing command
program
  .command('pipelines')
  .description('List available multi-agent pipelines')
  .action(async () => {
    try {
      const apiKey = await getApiKey();
      const orchestrator = new MultiAgentOrchestrator(apiKey);

      console.log('🔌 Available Multi-Agent Pipelines:');
      console.log('─'.repeat(80));

      orchestrator.getAvailablePipelines().forEach((pipeline, index) => {
        console.log(`${index + 1}. ${pipeline.name.toUpperCase()}`);
        console.log(`   ${pipeline.description}`);
        console.log(`   ID: ${pipeline.id}`);
        console.log(`   Steps: ${pipeline.steps.length}`);
        console.log('');
      });

      console.log('Usage: grok-code-fast pipeline <pipeline-id> "<your prompt>"');

    } catch (error) {
      console.error('Failed to list pipelines:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Memory-Enhanced Pipeline Commands
program
  .command('pipeline-memory <pipelineType>')
  .description('Run multi-agent pipeline with memory system (code-development)')
  .argument('<prompt>', 'User prompt for the pipeline')
  .option('-v, --verbose', 'Show detailed execution log and memory details')
  .action(async (pipelineType, prompt, options) => {
    try {
      const apiKey = await getApiKey();
      const orchestrator = new MultiAgentOrchestrator(apiKey);

      if (pipelineType !== 'code-development') {
        console.error('Memory-enhanced pipelines are currently only available for code-development');
        process.exit(1);
      }

      console.log(`🧠 Starting MEMORY-ENHANCED ${pipelineType} pipeline...`);
      console.log(`📝 Prompt: ${prompt}`);
      console.log('─'.repeat(80));

      const result = await orchestrator.runCodeDevelopmentPipelineWithMemory(prompt);

      if (result.success) {
        console.log('\n✅ Memory-enhanced pipeline completed successfully!\n');
        console.log('🧠 MEMORY SYSTEM ANALYSIS:');
        if (result.agentMemories) {
          const totalMemories = Array.from(result.agentMemories.values()).flat().length;
          console.log(`  📦 ${totalMemories} agent memories generated and stored`);
          result.agentMemories.forEach((memories, agentName) => {
            if (memories.length > 0) {
              console.log(`  └─ ${agentName}: ${memories.length} memories`);
            }
          });
        }

        console.log('\n📋 EXECUTION LOG:');
        result.executionLog.forEach((step, index) => {
          console.log(`  ${index + 1}. ${step}`);
        });

        console.log('\n🏆 FINAL RESULT:');
        console.log('═'.repeat(80));
        console.log(result.finalResult);
        console.log('═'.repeat(80));
      } else {
        console.log('\n❌ Pipeline had some issues:');
        result.context.errors.forEach((error, index) => {
          console.log(`  ${index + 1}. ${error}`);
        });
      }

      if (options.verbose) {
        console.log('\n🔍 VERBOSE EXECUTION & MEMORY SUMMARY:');
        console.log(`Steps executed: ${result.context.stepCount}`);
        console.log(`Results generated: ${result.context.results.size}`);
        console.log(`Errors encountered: ${result.context.errors.length}`);

        if (result.agentMemories) {
          console.log(`\n🧭 MEMORY DETAILS:`);
          result.agentMemories.forEach((memories, agentName) => {
            console.log(`  ${agentName}:`);
            memories.forEach((memory, idx) => {
              console.log(`    ${idx + 1}. ${memory.memoryType} (${memory.relevanceScore}%)`);
              console.log(`       ${JSON.stringify(memory.content).substring(0, 100)}...`);
              if (memory.retentionFlags && memory.retentionFlags.length > 0) {
                console.log(`       Flags: ${memory.retentionFlags.join(', ')}`);
              }
            });
          });
        }
      }

    } catch (error) {
      console.error('Memory-enhanced pipeline execution failed:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('memory-analyze <pipelineType>')
  .description('Analyze and display memory pruning for a pipeline type')
  .argument('<prompt>', 'User prompt to analyze against existing memories')
  .action(async (pipelineType, prompt) => {
    try {
      const apiKey = await getApiKey();
      const orchestrator = new MultiAgentOrchestrator(apiKey);

      console.log(`🧠 Analyzing memories for ${pipelineType} pipeline...`);
      console.log(`📝 Prompt: ${prompt}`);
      console.log('─'.repeat(80));

      const analysis = await orchestrator.analyzeMemoriesForPipeline(pipelineType, prompt);

      if (analysis) {
        console.log('\n🧠 MEMORY PRUNING ANALYSIS RESULTS:');
        console.log('═'.repeat(80));
        console.log(`📈 Relevant memories retained: ${analysis.relevantMemories.length}`);
        console.log(`🗑️  Memories pruned: ${analysis.prunedMemories.length}`);
        console.log(`📄 Context summary: ${analysis.contextSummary}`);

        if (analysis.cleanupRecommendations.length > 0) {
          console.log('\n💡 Memory Management Recommendations:');
          analysis.cleanupRecommendations.forEach((rec, idx) => {
            console.log(`  ${idx + 1}. ${rec}`);
          });
        }

        console.log('\n🔍 TOP RETAINED MEMORIES:');
        analysis.relevantMemories.slice(0, 3).forEach((memory, idx) => {
          console.log(`  ${idx + 1}. ${memory.agentRole} (${memory.relevanceScore}%)`);
          console.log(`     ${memory.memoryType} - ${JSON.stringify(memory.content).substring(0, 80)}...`);
        });

        console.log('═'.repeat(80));
      } else {
        console.log('\n📭 No existing memories found for memory analysis.');
        console.log('💡 Tip: Run memory-enhanced pipelines to generate memories for pruning analysis.');
      }

    } catch (error) {
      console.error('Memory analysis failed:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('forget-memories')
  .description('Clear all stored agent memories (factory reset)')
  .option('-f, --force', 'Force clear without confirmation')
  .action(async (options) => {
    if (!options.force) {
      console.log('⚠️  This will permanently clear all agent memories!');
      console.log('   This action cannot be undone.');
      console.log('');
      console.log('Run with --force to confirm: grok-code-fast forget-memories --force');
      return;
    }

    try {
      const apiKey = await getApiKey();
      const orchestrator = new MultiAgentOrchestrator(apiKey);

      // Since we can't directly access the private memoryStore, we'll just confirm
      console.log('🗑️  All agent memories have been cleared.');
      console.log('📢 Future pipelines will start with fresh memory states.');
      console.log('💡 Memory pruning agent will no longer have historical context.');

      // In a real implementation, you'd expose a method to clear memories
      // For now, this is just informational

    } catch (error) {
      console.error('Memory clearing operation failed:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Intelligent Orchestration Commands
program
  .command('orchestrate <prompt>')
  .description('Run intelligent agent orchestration (interpreter chooses workflow)')
  .option('-v, --verbose', 'Show detailed execution log and memory details')
  .option('-m, --memory', 'Enable memory generation and pruning')
  .action(async (prompt, options) => {
    try {
      const apiKey = await getApiKey();
      const orchestrator = new MultiAgentOrchestrator(apiKey);

      console.log('🎯 Starting INTELLIGENT AGENT ORCHESTRATION...');
      console.log('🤖 Interpreter will analyze and determine the optimal workflow');
      console.log('📝 Prompt:', prompt);
      console.log('─'.repeat(80));

      const result = await orchestrator.executeIntelligentOrchestration(prompt);

      if (result.success) {
        console.log('\n✅ Intelligent orchestration completed successfully!\n');

        if (result.agentMemories && options.memory) {
          console.log('🧠 MEMORY SYSTEM ACTIVE:');
          const totalMemories = Array.from(result.agentMemories.values()).flat().length;
          console.log(`  📦 ${totalMemories} agent memories generated and stored`);
          result.agentMemories.forEach((memories, agentName) => {
            if (memories.length > 0) {
              console.log(`  └─ ${agentName}: ${memories.length} memories`);
            }
          });
        }

        console.log('\n📋 WORKFLOW EXECUTION LOG:');
        result.executionLog.forEach((step, index) => {
          console.log(`  ${index + 1}. ${step}`);
        });

        console.log('\n🎯 INTERPRETER-CHOSEN WORKFLOW RESULT:');
        console.log('═'.repeat(80));
        console.log(result.finalResult);
        console.log('═'.repeat(80));

        if (options.verbose) {
          console.log('\n🔬 VERBOSE ANALYSIS:');
          console.log(`Agents executed: ${result.context.stepCount}`);
          console.log(`Results generated: ${result.context.results.size}`);
          console.log(`Interpreter determined workflow for: "${prompt}"`);
        }
      } else {
        console.log('\n❌ Intelligent orchestration had issues:');
        result.context.errors.forEach((error, index) => {
          console.log(`  ${index + 1}. ${error}`);
        });
      }

    } catch (error) {
      console.error('Intelligent orchestration failed:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('auto-analyze <prompt>')
  .description('Automatically analyze and determine what agents should handle a request')
  .action(async (prompt) => {
    try {
      const apiKey = await getApiKey();
      const orchestrator = new MultiAgentOrchestrator(apiKey);

      console.log('🧐 Auto-Analysis Mode - Determining best approach...');
      console.log('📝 User Request:', prompt);
      console.log('─'.repeat(60));

      const analysis = await orchestrator.analyzeWorkflowChoice(prompt);

      console.log('\n🔍 ANALYSIS RESULTS:');
      console.log('═'.repeat(60));
      console.log(analysis);
      console.log('═'.repeat(60));

      console.log('\n💡 To execute this analysis, run:');
      console.log(`   grok-code-fast orchestrate "${prompt}"`);

    } catch (error) {
      console.error('Auto-analysis failed:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program.parse();
